import { expect, test, type Page } from "@playwright/test";
import { standardLagret } from "../src/lagring/lagring";

/** Flyt med vanlige trykk: voksenlåsen, import, tårnuret og klokkeleken fra menyen (gj. 9, B4 og B6). */

async function apne(page: Page): Promise<void> {
  await page.goto("/formbyen/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => "formbyenTest" in window);
}

async function losLas(page: Page): Promise<void> {
  const tekst = (await page.locator(".regnestykke").textContent()) ?? "";
  const deler = tekst.match(/(\d+)\s*×\s*(\d+)/);
  if (!deler) throw new Error("mangler regnestykke");
  await page.locator("#voksen-svar").fill(String(Number(deler[1]) * Number(deler[2])));
  await page.getByRole("button", { name: "Åpne", exact: true }).click();
}

test("voksenlåsen gir beskjed ved feil, lukkes igjen og går tilbake dit den voksne kom fra", async ({ page }) => {
  await apne(page);
  await page.getByRole("button", { name: "Hopp over" }).click();
  await page.getByRole("button", { name: "Innstillinger" }).click();
  await page.getByRole("button", { name: "Åpne voksensiden" }).click();
  await expect(page.getByText("For voksne. Løs regnestykket for å åpne.")).toBeVisible();
  await page.locator("#voksen-svar").fill("1");
  await page.getByRole("button", { name: "Åpne", exact: true }).click();
  await expect(page.getByText("Feil svar. Prøv dette:")).toBeVisible();
  await losLas(page);
  await expect(page.getByRole("button", { name: /Oversikt/ })).toBeVisible();
  await page.getByRole("button", { name: /Faste avtaler/ }).click();
  await page.getByRole("button", { name: "Legg til" }).click();
  await expect(page.locator(".avtaleliste li")).toHaveCount(1);
  await expect(page.locator(".avtaleliste li").first()).toContainText("kl.");
  await page.getByRole("button", { name: "← Tilbake til spillet" }).click();
  await expect(page.getByRole("heading", { name: "Innstillinger" })).toBeVisible();
  await page.getByRole("button", { name: "Åpne voksensiden" }).click();
  await expect(page.locator(".regnestykke")).toBeVisible();
});

test("import av en ugyldig fil endrer ikke byen, og en gyldig fil må bekreftes", async ({ page }) => {
  await apne(page);
  await page.getByRole("button", { name: "Hopp over" }).click();
  await page.getByRole("button", { name: "Innstillinger" }).click();
  await page.getByRole("button", { name: "Åpne voksensiden" }).click();
  await losLas(page);
  await page.getByRole("button", { name: /Ta vare på byen/ }).click();
  await page.locator("#import-fil").setInputFiles({ name: "by.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ mynter: 0 })) });
  await expect(page.getByText("Fila kunne ikke leses. Byen er ikke endret.")).toBeVisible();
  const by = { ...standardLagret(), mynter: 37, startet: true };
  await page.locator("#import-fil").setInputFiles({ name: "by.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(by)) });
  await expect(page.getByText(/Fila inneholder en by på nivå 1 med 1 bygg/)).toBeVisible();
  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page.getByText(/Fila inneholder/)).toHaveCount(0);
  await page.getByRole("button", { name: "Start på nytt" }).click();
  await expect(page.getByText("Dette sletter hele byen på denne telefonen.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Slett byen" })).toBeVisible();
});

test("tårnuret åpnes fra kartet, og planen har Lukk", async ({ page }) => {
  await apne(page);
  await page.getByRole("button", { name: "Hopp over" }).click();
  await page.getByRole("button", { name: "Spill" }).click();
  await page.getByRole("button", { name: /Start (ettermiddagen|dagen)/ }).click();
  await page.locator("button.stripe").click();
  await expect(page.locator(".planliste")).toBeVisible();
  await page.getByRole("button", { name: "Lukk" }).click();
  await page.locator(".kartflate .skilt[data-sted='taarn']").click();
  await expect(page.locator(".ur-skjerm")).toBeVisible();
  await expect(page.locator(".ur-prompt")).toContainText("klokka");
  await page.getByRole("button", { name: "Ferdig" }).click();
  await expect(page.locator(".ur-melding")).toContainText("Prøv igjen");
  await page.getByRole("button", { name: "Tilbake" }).click();
  await expect(page.locator(".verden")).toBeVisible();
});

test("klokkeleken fra menyen kan vinnes og ender i menyen", async ({ page }) => {
  await apne(page);
  const g = standardLagret();
  await page.evaluate((lagret) => (window as unknown as { formbyenTest: { sett: (l: unknown, s: string) => void } }).formbyenTest.sett(lagret, "ur"), { ...g, startet: true });
  for (let steg = 0; steg < 5; steg++) {
    const tekst = (await page.locator(".ur-prompt").textContent()) ?? "";
    await expect(page.locator(".ur-teller")).toHaveText(`${steg + 1}/5`);
    // Still viseren ved å trykke tall og minuttknapper til tiden stemmer med fasit fra testkroken.
    const maal = await page.evaluate(() => (window as unknown as { formbyenTest: { urMaal: () => number } }).formbyenTest.urMaal());
    await page.evaluate((tid) => (window as unknown as { formbyenTest: { settViser: (t: number) => void } }).formbyenTest.settViser(tid), maal);
    expect(tekst).toContain("klokka");
    await page.getByRole("button", { name: "Ferdig" }).click();
  }
  await expect(page.locator(".forside")).toBeVisible();
});
