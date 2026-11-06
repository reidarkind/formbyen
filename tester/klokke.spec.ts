import { expect, test, type Page } from "@playwright/test";
import { oppgaver, type Tilstand } from "./tilstander";

/**
 * Klokke-input med berøring (gj. 10, C1): et trykk midt på et tall skal flytte den valgte viseren dit,
 * og minuttviseren skal kunne dras til alle trinn for nivået.
 */

async function apne(page: Page): Promise<void> {
  await page.goto("/formbyen/");
  await page.waitForFunction(() => "formbyenTest" in window);
}

async function sett(page: Page, tilstand: Tilstand): Promise<void> {
  await page.evaluate(
    ({ lagret, skjerm }) => {
      (window as unknown as { formbyenTest: { sett: (l: unknown, s?: string) => void } }).formbyenTest.sett(lagret, skjerm);
    },
    { lagret: tilstand.lagret, skjerm: tilstand.skjerm },
  );
}

async function viserTid(page: Page): Promise<number> {
  return Number(await page.locator("[data-svar]").first().getAttribute("data-svar"));
}

async function midtPaTall(page: Page, tall: number): Promise<{ x: number; y: number }> {
  const boks = await page.locator(`[data-ur] .tall[data-tall="${tall}"]`).boundingBox();
  if (!boks) throw new Error(`fant ikke tallet ${tall}`);
  return { x: boks.x + boks.width / 2, y: boks.y + boks.height / 2 };
}

function stillKlokka(nivaa: string): Tilstand {
  const tilstand = oppgaver().find((rad) => rad.navn.startsWith("oppgave-") && rad.lagret.aktivDag?.ko[0]?.type === "still-klokka");
  if (!tilstand) throw new Error("mangler still-klokka");
  // Minutt-trinnet følger nivået i innstillingene.
  return { ...tilstand, lagret: { ...tilstand.lagret, innstillinger: { ...tilstand.lagret.innstillinger, nivaa: nivaa as never } } };
}

test("trykk midt på hvert tall flytter den valgte viseren dit", async ({ page }) => {
  await apne(page);
  await sett(page, stillKlokka("utfordrende"));
  const feil: string[] = [];
  await expect(page.getByRole("button", { name: "Lille viser" })).toHaveAttribute("aria-pressed", "true");
  for (let tall = 1; tall <= 12; tall++) {
    const punkt = await midtPaTall(page, tall);
    await page.touchscreen.tap(punkt.x, punkt.y);
    const tid = await viserTid(page);
    if (Math.floor(tid / 60) % 12 !== tall % 12) feil.push(`lille viser: ${tall} → ${Math.floor(tid / 60) % 12}`);
  }
  await page.getByRole("button", { name: "Store viser" }).tap();
  await expect(page.getByRole("button", { name: "Store viser" })).toHaveAttribute("aria-pressed", "true");
  for (let tall = 1; tall <= 12; tall++) {
    const punkt = await midtPaTall(page, tall);
    await page.touchscreen.tap(punkt.x, punkt.y);
    const tid = await viserTid(page);
    if (tid % 60 !== (tall * 5) % 60) feil.push(`store viser: ${tall} → ${tid % 60} min`);
  }
  expect(feil).toEqual([]);
});

for (const nivaa of ["forste", "andre", "utfordrende"] as const) {
  test(`minuttviseren kan dras til alle trinn (${nivaa})`, async ({ page }) => {
    await apne(page);
    await sett(page, stillKlokka(nivaa));
    const steg = nivaa === "forste" ? 30 : nivaa === "andre" ? 15 : 5;
    const skive = await page.locator("[data-ur] svg").boundingBox();
    if (!skive) throw new Error("mangler urskive");
    const cx = skive.x + skive.width / 2;
    const cy = skive.y + skive.height / 2;
    const r = (skive.width * 70) / 240;
    const punkt = (minutt: number) => ({ x: cx + Math.sin((minutt * 6 * Math.PI) / 180) * r, y: cy - Math.cos((minutt * 6 * Math.PI) / 180) * r });
    // Ta tak i tuppen av minuttviseren (den står på 12) og dra den rundt.
    const start = punkt(0);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    const funnet = new Set<number>();
    for (let minutt = 1; minutt <= 60; minutt++) {
      const neste = punkt(minutt);
      await page.mouse.move(neste.x, neste.y, { steps: 2 });
      if (minutt % steg === 0) funnet.add(Number(await page.locator("[data-ur]").getAttribute("data-tid")) % 60);
    }
    await page.mouse.up();
    const forventet = Array.from({ length: 60 / steg }, (_, i) => i * steg);
    expect([...funnet].sort((a, b) => a - b)).toEqual(forventet);
    // En hel runde med minuttviseren flytter timen én fram.
    expect(Math.floor((await viserTid(page)) / 60) % 12).toBe(1);
  });
}
