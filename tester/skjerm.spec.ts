import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { oppgaver, skjermer, type Tilstand } from "./tilstander";

/**
 * Skjermtesten (gj. 9, B8). For hver skjerm og hver oppgavemal sjekkes:
 * a) ingen element med overflow: hidden har innhold som er klippet, verken loddrett eller sideveis,
 * b) alle knapper kan nås, ligger innenfor skjermen, er ikke dekket og er minst 44 px,
 * c) det finnes en vei ut,
 * d) klokker som er en del av oppgaven, er minst 80 px.
 */

async function sett(page: Page, tilstand: Tilstand): Promise<void> {
  await page.evaluate(
    ({ lagret, skjerm, ekstra }) => {
      (window as unknown as { formbyenTest: { sett: (l: unknown, s?: string, e?: unknown) => void } }).formbyenTest.sett(lagret, skjerm, ekstra);
    },
    { lagret: tilstand.lagret, skjerm: tilstand.skjerm, ekstra: tilstand.ekstra },
  );
}

/** Skjermer der lange lister får scrolle. Alle andre skal passe uten scrolling. */
const LANGE_LISTER = /^(voksen-(oversikt|detalj|avtaler|data|om|slett|nivaa)|dagbok-lang|album)/;

async function sjekk(page: Page, tillatScroll = false): Promise<string[]> {
  return page.evaluate((tillatScroll) => {
    const funn: string[] = [];
    if (!tillatScroll) {
      for (const el of document.querySelectorAll<HTMLElement>(".side-midt, .verden-midten, .kveld-midt, .intro-valg")) {
        const over = el.scrollHeight - el.clientHeight;
        if (over > 2) funn.push(`må scrolle ${over} px: ${el.className}`);
      }
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const navn = (el: Element) => ((el as HTMLElement).innerText || el.getAttribute("aria-label") || el.getAttribute("data-sted") || el.className.toString() || el.tagName).trim().replace(/\s+/g, " ").slice(0, 32);
    if (document.documentElement.scrollWidth > vw + 1) funn.push("siden er bredere enn skjermen");
    if (document.documentElement.scrollHeight > vh + 1) funn.push("dokumentet scroller");
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      if (el.closest("svg") || el.classList.contains("skjult") || el.closest(".skjult")) continue;
      const stil = getComputedStyle(el);
      const klipperY = stil.overflowY === "hidden" || stil.overflowY === "clip";
      const klipperX = stil.overflowX === "hidden" || stil.overflowX === "clip";
      if (klipperY && el.scrollHeight > el.clientHeight + 2) funn.push(`klippet loddrett: ${navn(el)}`);
      if (klipperX && el.scrollWidth > el.clientWidth + 2) funn.push(`klippet sideveis: ${navn(el)}`);
      if (!klipperX && stil.overflowX === "visible" && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && !el.closest(".tall-lag") && stil.display !== "inline") {
        const forelder = el.parentElement;
        if (forelder && el.getBoundingClientRect().right > vw + 1) funn.push(`stikker ut sideveis: ${navn(el)}`);
      }
    }
    const knapper = [...document.querySelectorAll<HTMLElement>("button, a.knapp, select, input:not(.skjult), summary")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !el.closest(".skjult");
    });
    let veiUt = false;
    for (const knapp of knapper) {
      knapp.scrollIntoView({ block: "nearest", inline: "nearest" });
      const r = knapp.getBoundingClientRect();
      if (r.top < -1 || r.left < -1 || r.bottom > vh + 1 || r.right > vw + 1) {
        funn.push(`utenfor skjermen: ${navn(knapp)}`);
        continue;
      }
      if (r.height < 43.5 || r.width < 43.5) funn.push(`for liten (${Math.round(r.width)}×${Math.round(r.height)}): ${navn(knapp)}`);
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const treff = document.elementFromPoint(x, y);
      if (treff && treff !== knapp && !knapp.contains(treff) && !(treff instanceof HTMLLabelElement && treff.contains(knapp))) funn.push(`dekket: ${navn(knapp)} av ${navn(treff)}`);
      if (!(knapp as HTMLButtonElement).disabled) veiUt = true;
    }
    if (!veiUt) funn.push("ingen vei ut");
    // Navneskiltene på kartet er ikke dekket av noe annet (gj. 10, 8).
    for (const skilt of document.querySelectorAll<HTMLElement>(".kartflate .skilt:not(.trangt)")) {
      const r = skilt.getBoundingClientRect();
      if (r.width === 0) continue;
      const treff = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (treff && treff !== skilt && !skilt.contains(treff)) funn.push(`skilt dekket: ${navn(skilt)} av ${navn(treff)}`);
    }
    for (const ur of document.querySelectorAll<HTMLElement>(".oppgave > .ur, .oppgave .sammenlign .ur, .oppgave .valg .ur, .ur-midten .ur, .skilt-naa .ur")) {
      const r = ur.getBoundingClientRect();
      if (r.width > 0 && r.width < 79.5) funn.push(`klokke for liten (${Math.round(r.width)} px)`);
    }
    // Klokker som stilles, er minst 180 px, og tallene er minst 14 px (gj. 10, C1).
    for (const ur of document.querySelectorAll<HTMLElement>("[data-ur]")) {
      const r = ur.getBoundingClientRect();
      if (r.width > 0 && r.width < 179.5) funn.push(`klokka som stilles, er for liten (${Math.round(r.width)} px)`);
      const tall = ur.querySelector<HTMLElement>(".tall");
      if (tall && parseFloat(getComputedStyle(tall).fontSize) < 14) funn.push("tallene på klokka er under 14 px");
    }
    // Tallene står som HTML over skiva. Tall-laget må ha samme flate som urskiva, ellers forskyves de.
    for (const skive of document.querySelectorAll<HTMLElement>(".skive")) {
      const svg = skive.querySelector(":scope > svg");
      const lag = skive.querySelector(":scope > .tall-lag");
      if (!svg || !lag || !lag.children.length) continue;
      const a = svg.getBoundingClientRect();
      const b = lag.getBoundingClientRect();
      if (Math.abs(a.left - b.left) > 1 || Math.abs(a.top - b.top) > 1 || Math.abs(a.width - b.width) > 1 || Math.abs(a.height - b.height) > 1) {
        funn.push(`tallene er forskjøvet på klokka (${Math.round(a.width)}×${Math.round(a.height)} mot ${Math.round(b.width)}×${Math.round(b.height)})`);
      }
    }
    // Trykkflatene på kartet går ikke utenfor kartet (gj. 10, C6).
    for (const flate of document.querySelectorAll<HTMLElement>(".kartflate")) {
      const ramme = flate.querySelector("svg")?.getBoundingClientRect();
      if (!ramme) continue;
      for (const treff of flate.querySelectorAll<SVGRectElement>(".treff")) {
        const r = treff.getBoundingClientRect();
        if (r.left < ramme.left - 1 || r.right > ramme.right + 1 || r.top < ramme.top - 1 || r.bottom > ramme.bottom + 1) {
          funn.push(`trykkflate utenfor kartet: ${treff.parentElement?.getAttribute("data-sted") ?? ""}`);
          break;
        }
      }
    }
    for (const treff of document.querySelectorAll<SVGRectElement>(".verden .kartflate .treff")) {
      const r = treff.getBoundingClientRect();
      if (r.width > 0 && (r.width < 43 || r.height < 43)) {
        funn.push(`trykkflate på kartet for liten (${Math.round(r.width)} px)`);
        break;
      }
    }
    document.querySelectorAll<HTMLElement>(".side-midt, .verden-midten, .kveld-midt").forEach((el) => {
      el.scrollTop = 0;
    });
    return [...new Set(funn)];
  }, tillatScroll);
}

async function apne(page: Page): Promise<void> {
  await page.goto("/formbyen/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => "formbyenTest" in window);
}

async function bilde(page: Page, info: TestInfo, navn: string): Promise<void> {
  await page.screenshot({ path: info.outputPath(`${navn}.png`) });
}

test("alle skjermer får plass uten klipping", async ({ page }, info) => {
  test.setTimeout(120_000);
  await apne(page);
  const brudd: string[] = [];
  for (const tilstand of skjermer()) {
    await sett(page, tilstand);
    await page.waitForTimeout(30);
    const funn = await sjekk(page, LANGE_LISTER.test(tilstand.navn));
    await bilde(page, info, tilstand.navn);
    for (const rad of funn) brudd.push(`${tilstand.navn}: ${rad}`);
  }
  expect(brudd).toEqual([]);
});

test("alle oppgavemaler og forklaringskort kan løses", async ({ page }, info) => {
  test.setTimeout(300_000);
  await apne(page);
  const brudd: string[] = [];
  const vist = new Set<string>();
  for (const tilstand of oppgaver()) {
    await sett(page, tilstand);
    const funn = await sjekk(page);
    const type = tilstand.navn.replace(/-\d+$/, "");
    if (funn.length || !vist.has(type)) {
      vist.add(type);
      await bilde(page, info, tilstand.navn);
    }
    for (const rad of funn) brudd.push(`${tilstand.navn}: ${rad}`);
  }
  expect(brudd).toEqual([]);
});

test("planen kan ikke åpnes mens en oppgave pågår", async ({ page }) => {
  await apne(page);
  const oppgave = oppgaver().find((rad) => rad.navn === "oppgave-les-1");
  if (!oppgave) throw new Error("mangler oppgave");
  await sett(page, oppgave);
  await expect(page.locator("button.stripe")).toBeDisabled();
});

test("sortering med dra og berøring", async ({ page }) => {
  await apne(page);
  const sortering = oppgaver().find((rad) => rad.navn.startsWith("oppgave-sort"));
  if (!sortering) throw new Error("mangler sortering");
  await sett(page, sortering);
  const figur = page.locator(".figurgrid [data-vare]").first();
  const kasse = page.locator(".kasse").first();
  await expect(figur).toBeVisible();
  await expect(kasse).toBeVisible();
  const fra = await figur.boundingBox();
  const til = await kasse.boundingBox();
  if (!fra || !til) throw new Error("mangler boks");
  const antall = await page.locator(".figurgrid [data-vare]").count();
  await figur.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, clientX: fra.x + fra.width / 2, clientY: fra.y + fra.height / 2, pointerId: 1 });
  await page.evaluate(
    ({ x, y }) => {
      window.dispatchEvent(new PointerEvent("pointermove", { pointerType: "touch", isPrimary: true, clientX: x, clientY: y, pointerId: 1 }));
      window.dispatchEvent(new PointerEvent("pointerup", { pointerType: "touch", isPrimary: true, clientX: x, clientY: y, pointerId: 1 }));
    },
    { x: til.x + til.width / 2, y: til.y + til.height / 2 },
  );
  await expect(page.locator(".figurgrid [data-vare]")).toHaveCount(antall - 1);
});
