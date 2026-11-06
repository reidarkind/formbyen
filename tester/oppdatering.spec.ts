import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Oppdateringssjekken med ekte service worker (gj. 10, C3):
 * bygg A lastes, bygg B legges ut, knappen svarer «Ny versjon er klar» uten å laste siden på nytt,
 * og «Åpne på nytt» gir bygg B.
 */

const ROT = resolve(process.cwd(), "test-results", "sw");
const TYPER: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

function bygg(navn: string, id: string): string {
  const ut = join(ROT, navn);
  execSync(`npx vite build --outDir "${ut}" --emptyOutDir`, { env: { ...process.env, VITE_BYGG: id }, stdio: "ignore" });
  return ut;
}

let mappe = "";
let tjener: Server;
let port = 0;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({}, info) => {
  test.skip(info.project.name !== "chromium-iphone13", "Bygges og kjøres én gang, i Chromium.");
  info.setTimeout(240_000);
  bygg("a", "aaaaaaa0");
  bygg("b", "bbbbbbb0");
  tjener = createServer((req, res) => {
    const sti = decodeURIComponent((req.url ?? "/").split("?")[0] ?? "/").replace(/^\/formbyen\/?/, "/");
    let fil = join(mappe, sti.endsWith("/") ? `${sti}index.html` : sti);
    if (!existsSync(fil)) fil = join(mappe, "index.html");
    res.setHeader("Content-Type", TYPER[extname(fil)] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(readFileSync(fil));
  });
  await new Promise<void>((ferdig) => tjener.listen(0, ferdig));
  const adresse = tjener.address();
  port = typeof adresse === "object" && adresse ? adresse.port : 0;
});

test.afterAll(async () => {
  await new Promise((ferdig) => (tjener ? tjener.close(ferdig) : ferdig(undefined)));
});

async function tilOmAppen(page: Page): Promise<void> {
  const hopp = page.getByRole("button", { name: "Hopp over" });
  if (await hopp.isVisible()) await hopp.click();
  await page.getByRole("button", { name: "Innstillinger" }).click();
  await page.getByRole("button", { name: "Åpne voksensiden" }).click();
  const tekst = (await page.locator(".regnestykke").textContent()) ?? "";
  const deler = tekst.match(/(\d+)\s*×\s*(\d+)/);
  if (!deler) throw new Error("mangler regnestykke");
  await page.locator("#voksen-svar").fill(String(Number(deler[1]) * Number(deler[2])));
  await page.getByRole("button", { name: "Åpne", exact: true }).click();
  await page.getByRole("button", { name: /Om appen/ }).click();
}

test("knappen finner en ny versjon på serveren, og «Åpne på nytt» gir den", async ({ page }) => {
  mappe = join(ROT, "a");
  const url = `http://localhost:${port}/formbyen/`;
  await page.goto(url);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Som hos en bruker som har åpnet appen før: siden styres av service workeren.
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await tilOmAppen(page);
  await expect(page.getByText(/aaaaaaa/)).toBeVisible();
  await page.getByRole("button", { name: "Sjekk for oppdateringer" }).click();
  await expect(page.getByText("Du har nyeste versjon.")).toBeVisible();

  mappe = join(ROT, "b");
  let lastet = false;
  page.on("framenavigated", () => {
    lastet = true;
  });
  await page.getByRole("button", { name: "Sjekk for oppdateringer" }).click();
  await expect(page.getByText("Ny versjon er klar.")).toBeVisible({ timeout: 15_000 });
  expect(lastet).toBe(false);
  await expect(page.getByText(/Ny versjon av Formbyen/)).toBeVisible();

  await page.getByRole("button", { name: "Åpne på nytt" }).click();
  await page.waitForLoadState("load");
  await expect(page.getByRole("button", { name: "Innstillinger" })).toBeVisible({ timeout: 15_000 });
  await tilOmAppen(page);
  await expect(page.getByText(/bbbbbbb/)).toBeVisible();
});
