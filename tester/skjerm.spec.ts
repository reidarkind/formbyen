import { expect, test, type Page } from "@playwright/test";
import { standardLagret } from "../src/lagring/lagring";
import { utfor } from "../src/spill/okt";
import type { Lagret } from "../src/typer";

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
      if (!el.querySelector("button, [data-svar]")) continue;
      if (el.scrollHeight > el.clientHeight + 1) funn.push(`klipp ${el.className || el.tagName}`);
    }
    for (const knapp of document.querySelectorAll<HTMLElement>("button, [data-svar]")) {
      const r = knapp.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom > window.innerHeight + 1 || r.right > window.innerWidth + 1 || r.top < -1 || r.left < -1) {
        funn.push((knapp.textContent ?? "knapp").trim().slice(0, 40));
      }
      const treff = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 12));
      if (treff && treff !== knapp && !knapp.contains(treff)) funn.push(`dekket ${(knapp.textContent ?? "knapp").trim().slice(0, 24)}`);
    }
    return funn;
  });
  expect(brudd).toEqual([]);
}

test.describe("ingen skjerm ruller", () => {
  for (const stor of STORRELSER) {
    test(stor.navn, async ({ page }) => {
      test.setTimeout(90000);
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
      await page.getByRole("button", { name: "Dagens plan" }).click();
      await expect(page.locator("button.hoved[data-plan='lukk']")).toBeVisible();
      await ingenRulling(page);
      await page.locator("button.hoved[data-plan='lukk']").click();
      await page.locator("[data-sted='taarn']").click({ force: true });
      await expect(page.locator(".ur-skjerm")).toBeVisible();
      await expect(page.locator(".ur-skjerm button.hoved")).toBeVisible();
      await ingenRulling(page);
      await page.locator(".ur-skjerm [data-skjerm='verden']").click();
      const butikk = lagButikk();
      await page.evaluate((json) => localStorage.setItem("formbyen-v1", json), JSON.stringify(butikk));
      await page.reload();
      await expect(page.locator("article.kort .dorskilt")).toBeVisible();
      await ingenRulling(page);
      const oppgave = lagOppgave();
      await page.evaluate((json) => localStorage.setItem("formbyen-v1", json), JSON.stringify(oppgave));
      await page.reload();
      await expect(page.locator("[data-svar]").first()).toBeVisible();
      await ingenRulling(page);
      const kveld = lagKveld();
      await page.evaluate((json) => localStorage.setItem("formbyen-v1", json), JSON.stringify(kveld));
      await page.reload();
      await page.getByRole("button", { name: "Legg deg" }).click();
      await expect(page.getByRole("button", { name: "God natt" })).toBeVisible();
      await ingenRulling(page);
      await page.getByRole("button", { name: "God natt" }).click();
      await page.getByRole("button", { name: "Dagboka" }).click();
      await page.getByRole("button", { name: "Fotoalbum" }).click();
      await expect(page.getByRole("button", { name: "Tilbake" })).toBeVisible();
      await ingenRulling(page);
      await page.getByRole("button", { name: "Tilbake" }).click();
      await page.getByRole("button", { name: "Tilbake" }).click();
      await page.getByRole("button", { name: "Innstillinger" }).click();
      await page.getByRole("button", { name: "Voksen" }).click();
      await page.getByRole("button", { name: "Kompetansemål" }).click();
      await expect(page.getByRole("button", { name: "Åpne" })).toBeVisible();
      await ingenRulling(page);
      const stykke = await page.locator("main p").first().textContent();
      const deler = (stykke ?? "").match(/(\d+)\s*×\s*(\d+)/);
      if (deler) {
        await page.locator("#voksen-svar").fill(String(Number(deler[1]) * Number(deler[2])));
        await page.getByRole("button", { name: "Åpne" }).click();
        await page.locator("button[data-fane='data']").click();
        await expect(page.locator("button[data-skjerm='innstillinger']")).toBeVisible();
        await ingenRulling(page);
      }
    });
  }
});

function lagButikk(): Lagret {
  let lagret = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  lagret = {
    ...lagret,
    startet: true,
    aktivDag: { ...dag, tid: dag.plan.butikk.apner - 30, sted: "butikk", fase: "handel", dorLest: false, ko: [], forklaring: null },
  };
  return utfor(lagret, { slag: "handle" }).lagret;
}

function lagOppgave(): Lagret {
  let lagret = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  const oppgave = {
    id: "skjerm-les",
    type: "les-klokka" as const,
    mal: "les-1",
    ferdighet: "hele-timer" as const,
    prompt: "Hva viser klokka?",
    nokkel: "test",
    valg: [
      { id: "a", tekst: "ett", klokke: 60 },
      { id: "b", tekst: "to", klokke: 120 },
      { id: "c", tekst: "tre", klokke: 180 },
    ],
    fasit: "b",
    vare: "planke" as const,
    hvem: "ekspeditøren",
    overraskelse: false,
  };
  return {
    ...lagret,
    startet: true,
    aktivDag: { ...dag, tid: dag.plan.butikk.apner, sted: "butikk", fase: "handel", dorLest: true, ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 },
  };
}

function lagKveld(): Lagret {
  let lagret = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return {
    ...lagret,
    startet: true,
    aktivDag: { ...dag, tid: dag.plan.leggetid, sted: "hjemme", fase: "ute", dorLest: true, ko: [], forklaring: null },
  };
}
