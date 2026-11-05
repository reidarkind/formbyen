import { expect, test, type Page } from "@playwright/test";

const STORRELSER = [
  { width: 390, height: 664, navn: "390x664" },
  { width: 375, height: 667, navn: "375x667" },
  { width: 320, height: 568, navn: "320x568" },
  { width: 844, height: 390, navn: "844x390" },
];

async function ingenRulling(page: Page): Promise<void> {
  const brudd = await page.evaluate(() => {
    const funn: string[] = [];
    if (document.documentElement.scrollHeight > window.innerHeight + 1) funn.push("dokument");
    for (const el of document.querySelectorAll<HTMLElement>("*")) {
      const stil = getComputedStyle(el);
      if ((stil.overflowY === "auto" || stil.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        funn.push(String(el.className || el.tagName));
      }
    }
    for (const knapp of document.querySelectorAll("button")) {
      const r = knapp.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.top < -1 || r.left < -1) {
        funn.push((knapp.textContent ?? "knapp").trim().slice(0, 40));
      }
    }
    return funn;
  });
  expect(brudd).toEqual([]);
}

test.describe("ingen skjerm ruller", () => {
  for (const stor of STORRELSER) {
    test(stor.navn, async ({ page }) => {
      await page.setViewportSize({ width: stor.width, height: stor.height });
      await page.goto("/formbyen/");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Hopp over" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Innstillinger" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Nivå" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Språk" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Voksen" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Tilbake" }).click();
      await page.getByRole("button", { name: "Spill" }).click();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Start ettermiddagen" }).click();
      await ingenRulling(page);
    });
  }
});
