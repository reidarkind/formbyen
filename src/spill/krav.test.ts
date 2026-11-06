import { describe, expect, it } from "vitest";
import { kravSomOves } from "../bygg/kart";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import type { Lagret, Nivaa } from "../typer";
import { anbefalt, nesteSteg } from "./anbefaling";
import { utfor } from "./okt";
import { spillDag } from "./testbot";

/** Låst på bynivå 2 (gj. 10, C5): når et krav mangler og det ikke er mer å bygge, skal spillet gi det som mangler. */

function spill(nivaa: Nivaa, fro: number, dager: number): { lagret: Lagret; tomme: number } {
  const grunn = standardLagret();
  let lagret: Lagret = { ...grunn, fro, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa } };
  let tomme = 0;
  for (let dag = 0; dag < dager; dag++) {
    const for_ = JSON.stringify([lagret.by.nivaa, lagret.by.bygg.map((rad) => rad.steg)]);
    lagret = utfor(lagret, { slag: "start" }).lagret;
    lagret = spillDag(lagret).lagret;
    if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
    const etter = JSON.stringify([lagret.by.nivaa, lagret.by.bygg.map((rad) => rad.steg)]);
    if (for_ === etter && !lagret.by.bygg.some((rad) => rad.bygg === "slott" && rad.ferdig)) tomme += 1;
  }
  return { lagret, tomme };
}

describe("krav for neste bynivå (gj. 10, C5)", () => {
  it("ser hvilket krav som mangler når alt på nivået er bygget", () => {
    const by = { ...standardLagret().by, nivaa: 2 as const, monsterFullfort: 0 };
    expect(kravSomOves({ ...by, bygg: [] })).toBeNull();
  });

  it("tilbyr mønsterøving når alle bygg på nivå 2 er ferdige uten mønster", () => {
    // Spill til alt på nivå 2 er bygget, og hold mønsteret ute ved å nullstille det.
    const grunn = standardLagret();
    let neste: Lagret = { ...grunn, fro: 1, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa: "andre" } };
    for (let dag = 0; dag < 20 && kravSomOves({ ...neste.by, monsterFullfort: 0 }) !== "monster"; dag++) {
      neste = spillDag(utfor({ ...neste, by: { ...neste.by, monsterFullfort: 0 } }, { slag: "start" }).lagret).lagret;
      if (neste.aktivDag) neste = utfor(neste, { slag: "avslutt" }).lagret;
    }
    neste = utfor({ ...neste, by: { ...neste.by, monsterFullfort: 0 } }, { slag: "start" }).lagret;
    expect(kravSomOves(neste.by)).toBe("monster");
    // Hjelperen sier hva som mangler, og den gule knappen gir øvingen.
    let steg = nesteSteg(neste);
    for (let i = 0; i < 40 && steg.handling.slag !== "ov"; i++) {
      const dag = neste.aktivDag;
      const oppgave = dag?.ko[dag.aktiv];
      if (oppgave) {
        neste = utfor(neste, { slag: "svar", svar: oppgave.fasit }).lagret;
        steg = nesteSteg(neste);
        continue;
      }
      const valg = anbefalt(neste);
      if (valg.slag === "gaa") neste = utfor(neste, { slag: "ga", sted: valg.sted }).lagret;
      else if (valg.slag === "vent") neste = utfor(neste, { slag: "vent", tid: valg.tid }).lagret;
      else if (valg.slag === "mot" || valg.slag === "spis") neste = utfor(neste, { slag: valg.slag }).lagret;
      else break;
      steg = nesteSteg(neste);
    }
    expect(steg.handling.slag).toBe("ov");
    expect(steg.grunn).toBe("For å bygge videre må vi øve på mønstre.");
    const ovd = utfor(neste, { slag: "ov" }).lagret;
    expect(ovd.aktivDag?.ko.every((rad) => rad.type === "monster")).toBe(true);
  });

  it("gir aldri mange dager uten noe å gjøre", () => {
    for (const [nivaa, fro] of [["andre", 1], ["andre", 205], ["forste", 205], ["utfordrende", 1]] as const) {
      const { tomme, lagret } = spill(nivaa, fro, 30);
      // Noen dager kan mangle framgang (helg, tidlig leggetid), men aldri mange.
      expect(tomme, `${nivaa} ${fro}: nivå ${lagret.by.nivaa}`).toBeLessThanOrEqual(8);
    }
  }, 120_000);
});
