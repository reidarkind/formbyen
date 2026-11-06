import { describe, expect, it } from "vitest";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import type { Lagret, Nivaa, Oppgave } from "../typer";
import { utfor } from "./okt";
import { spillDag } from "./testbot";

/** Gjentakelser (gj. 10, C2): simulering over 20 dager per nivå når barnet følger knappen. */

export function signatur(oppgave: Oppgave): string {
  const svar = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
  return `${oppgave.prompt}|${svar?.tekst ?? svar?.klokke ?? svar?.form ?? svar?.tall ?? oppgave.fasit}`;
}

interface Maling {
  dager: Oppgave[][];
}

function spill(nivaa: Nivaa, fro: number, dager = 20): Maling {
  const grunn = standardLagret();
  let lagret: Lagret = { ...grunn, fro, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa } };
  const ut: Oppgave[][] = [];
  for (let dag = 0; dag < dager; dag++) {
    lagret = utfor(lagret, { slag: "start" }).lagret;
    const { lagret: etter, logg } = spillDag(lagret);
    ut.push(logg.oppgaver.map((rad) => rad.oppgave));
    lagret = etter;
  }
  return { dager: ut };
}

function analyser(maling: Maling) {
  const brudd: string[] = [];
  let like = 0;
  let totalt = 0;
  const tekster = new Map<string, Set<string>>();
  const antall = new Map<string, number>();
  const maler: string[] = [];
  maling.dager.forEach((oppgaver, d) => {
    const tidligere = new Set(maling.dager.slice(Math.max(0, d - 3), d).flat().map(signatur));
    const iDag = new Set<string>();
    const perType = new Map<string, number>();
    let forrige = "";
    let paRad = 0;
    for (const oppgave of oppgaver) {
      totalt += 1;
      const sig = signatur(oppgave);
      if (tidligere.has(sig) || iDag.has(sig)) like += 1;
      iDag.add(sig);
      perType.set(oppgave.type, (perType.get(oppgave.type) ?? 0) + 1);
      paRad = oppgave.type === forrige ? paRad + 1 : 1;
      forrige = oppgave.type;
      if (paRad > 2) brudd.push(`dag ${d}: ${oppgave.type} ${paRad} på rad`);
      const sett = tekster.get(oppgave.type) ?? new Set<string>();
      sett.add(oppgave.prompt);
      tekster.set(oppgave.type, sett);
      antall.set(oppgave.type, (antall.get(oppgave.type) ?? 0) + 1);
      const indeks = maler.lastIndexOf(oppgave.mal);
      if (indeks >= 0 && maler.length - indeks <= 10) brudd.push(`dag ${d}: malen ${oppgave.mal} igjen etter ${maler.length - indeks}`);
      maler.push(oppgave.mal);
    }
    for (const [type, n] of perType) if (n > 3) brudd.push(`dag ${d}: ${type} ${n} ganger`);
  });
  const fa: string[] = [];
  for (const [type, sett] of tekster) if ((antall.get(type) ?? 0) >= 12 && sett.size < 6) fa.push(`${type}: ${sett.size} tekster på ${antall.get(type)}`);
  return { andelLike: like / Math.max(1, totalt), brudd, fa, totalt };
}

describe("gjentakelser over 20 dager (gj. 10, C2)", () => {
  for (const [nivaa, fro] of [["forste", 11], ["andre", 11], ["utfordrende", 11], ["forste", 205], ["andre", 205], ["utfordrende", 77]] as const) {
    it(`holder reglene i ${nivaa} (frø ${fro})`, () => {
      const resultat = analyser(spill(nivaa, fro));
      expect(resultat.totalt).toBeGreaterThan(100);
      expect(resultat.brudd.slice(0, 12)).toEqual([]);
      expect(resultat.fa).toEqual([]);
      expect(resultat.andelLike).toBeLessThanOrEqual(0.05);
    }, 60_000);
  }
});
