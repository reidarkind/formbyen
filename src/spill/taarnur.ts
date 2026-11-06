import { visBestemt } from "../dag/aktiviteter";
import { lagDagsplan, nesteDato } from "../dag/plan";
import { ferdigeBygg } from "../bygg/kart";
import { mal } from "../tekst/ordbok";
import { klokke, minutt, timer, tidTilOrd } from "../tid/tid";
import type { Dagsplan, Lagret, Nivaa } from "../typer";

export interface UrSteg {
  tid: number;
  tekst: string;
}

export function urTrinn(nivaa: Nivaa): number {
  if (nivaa === "forste") return 30;
  if (nivaa === "andre") return 15;
  return 5;
}

function snap(tid: number, steg: number): number {
  const avrundet = Math.round(minutt(tid) / steg) * steg;
  return klokke(timer(tid) + Math.floor(avrundet / 60), avrundet % 60) % (24 * 60);
}

/** Planen for i morgen: den som ble laget da dagen startet, så tårnuret og morgendagen stemmer (gj. 9, A6). */
export function morgendagensPlan(lagret: Lagret): Dagsplan {
  const lagretPlan = lagret.aktivDag?.morgen?.[0];
  if (lagretPlan) return lagretPlan;
  return lagDagsplan({
    fro: lagret.fro + 1,
    dato: nesteDato(lagret.dato),
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  });
}

const GJOR: Record<string, [string, string]> = {
  lillesoster: ["I morgen henter vi lillesøster klokka {ord}. Still tårnuret.", "I morgon hentar vi lillesyster klokka {ord}. Still tårnuret."],
  hund: ["I morgen lufter vi hunden klokka {ord}. Still tårnuret.", "I morgon luftar vi hunden klokka {ord}. Still tårnuret."],
  lekser: ["I morgen gjør vi lekser klokka {ord}. Still tårnuret.", "I morgon gjer vi lekser klokka {ord}. Still tårnuret."],
  middag: ["I morgen spiser vi middag klokka {ord}. Still tårnuret.", "I morgon et vi middag klokka {ord}. Still tårnuret."],
  tannlege: ["I morgen skal vi til tannlegen klokka {ord}. Still tårnuret.", "I morgon skal vi til tannlækjaren klokka {ord}. Still tårnuret."],
};

/** Fem tider fra morgendagens plan, med en setning som gir mening for hver (gj. 9, B7). */
export function urRunde(lagret: Lagret, naa = lagret.aktivDag?.tid ?? 12 * 60): UrSteg[] {
  const spraak = lagret.innstillinger.spraak;
  const steg = urTrinn(lagret.innstillinger.nivaa);
  const plan = morgendagensPlan(lagret);
  const start = snap(naa, steg);
  const ut: UrSteg[] = [];
  const legg = (tid: number, tekst: string) => {
    if (tid === start || ut.some((rad) => rad.tid === tid)) return;
    ut.push({ tid, tekst });
  };
  for (const avtale of plan.avtaler.filter((rad) => rad.varighet > 0)) {
    const tid = snap(avtale.start, steg);
    const ord = tidTilOrd(tid, spraak);
    const id = avtale.aktivitet ?? avtale.navn;
    const rad = GJOR[id] ?? (avtale.slag === "middag" ? GJOR.middag : undefined);
    if (rad) legg(tid, mal(spraak, rad[0], rad[1], { ord }));
    else
      legg(
        tid,
        mal(spraak, "I morgen begynner {navn} klokka {ord}. Still tårnuret.", "I morgon byrjar {navn} klokka {ord}. Still tårnuret.", {
          navn: visBestemt(id, spraak),
          ord,
        }),
      );
  }
  if (!plan.butikk.stengtHele) {
    const tid = snap(plan.butikk.apner, steg);
    legg(tid, mal(spraak, "I morgen åpner butikken klokka {ord}. Still tårnuret.", "I morgon opnar butikken klokka {ord}. Still tårnuret.", { ord: tidTilOrd(tid, spraak) }));
  }
  const legg2 = snap(plan.leggetid, steg);
  legg(legg2, mal(spraak, "I morgen er leggetid klokka {ord}. Still tårnuret.", "I morgon er leggetid klokka {ord}. Still tårnuret.", { ord: tidTilOrd(legg2, spraak) }));
  let ekstra = ((ut.at(-1)?.tid ?? start) + steg * 3) % (24 * 60);
  for (let vakt = 0; ut.length < 5 && vakt < 200; vakt++) {
    legg(ekstra, mal(spraak, "Still tårnuret til klokka {ord}.", "Still tårnuret til klokka {ord}.", { ord: tidTilOrd(ekstra, spraak) }));
    ekstra = (ekstra + steg * 3) % (24 * 60);
  }
  return ut.slice(0, 5);
}
