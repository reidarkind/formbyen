import { describe, expect, it } from "vitest";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import type { Lagret, Nivaa } from "../typer";
import { nesteSteg } from "./anbefaling";
import { utfor } from "./okt";
import { spillDag } from "./testbot";

/** Dager uten framgang (gj. 10, 7.1.10, og gj. 9, 6.8). */

function ny(nivaa: Nivaa, fro: number): Lagret {
  const grunn = standardLagret();
  return { ...grunn, fro, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa } };
}

function nokkel(lagret: Lagret): string {
  return JSON.stringify(lagret.by.bygg.map((rad) => [rad.instans, rad.steg]));
}

describe("dager uten framgang (gj. 10, 7.1.10)", () => {
  it("tilbyr en del til i morgen når butikken er stengt i morgen", () => {
    let tilbud = 0;
    for (const nivaa of ["forste", "andre"] as Nivaa[]) {
      let lagret = ny(nivaa, 9);
      for (let dag = 0; dag < 14; dag++) {
        const { lagret: etter, logg } = spillDag(lagret);
        for (const rad of logg.spor.filter((spor) => spor.slag === "forraad")) {
          expect(rad.lagret.aktivDag?.morgen?.[0]?.butikk.stengtHele).toBe(true);
          const steg = nesteSteg(rad.lagret);
          expect(steg.grunn).toMatch(/^Butikken er stengt i morgen\./);
          tilbud++;
        }
        lagret = etter.aktivDag ? utfor(etter, { slag: "avslutt" }).lagret : etter;
      }
    }
    expect(tilbud).toBeGreaterThan(0);
  });

  it("bygger ikke delen samme dag, men dagen etter", () => {
    let lagret = ny("forste", 9);
    for (let dag = 0; dag < 14; dag++) {
      const { lagret: etter, logg } = spillDag(lagret);
      lagret = etter.aktivDag ? utfor(etter, { slag: "avslutt" }).lagret : etter;
      if (!logg.spor.some((spor) => spor.slag === "forraad")) continue;
      // Delen ligger i kurven når dagen er slutt.
      expect(Object.values(lagret.kurv).some((antall) => (antall ?? 0) > 0)).toBe(true);
      const for_ = nokkel(lagret);
      const { lagret: sondag } = spillDag(lagret);
      expect(nokkel(sondag)).not.toBe(for_);
      return;
    }
    throw new Error("Fant ingen dag med tilbud");
  });

  it("gir sjelden dager uten framgang når den gule knappen følges", () => {
    // Før: 13–17 % av dagene, nesten alle søndager. Nå bare dager der timeplanen er full.
    let alleTomme = 0;
    let alleDager = 0;
    for (const nivaa of ["forste", "andre", "blandet", "utfordrende"] as Nivaa[]) {
      for (const fro of [1, 9, 205]) {
        let lagret = ny(nivaa, fro);
        let tomme = 0;
        let dager = 0;
        for (let dag = 0; dag < 40; dag++) {
          if (lagret.by.bygg.some((rad) => rad.bygg === "slott" && rad.ferdig)) break;
          const for_ = nokkel(lagret);
          const { lagret: etter, logg } = spillDag(lagret);
          lagret = etter.aktivDag ? utfor(etter, { slag: "avslutt" }).lagret : etter;
          dager++;
          const handlet = logg.spor.some((rad) => rad.lagret.aktivDag?.sted === "butikk");
          if (for_ === nokkel(lagret) && !handlet) tomme++;
        }
        expect(tomme, `${nivaa} ${fro}: ${tomme}/${dager}`).toBeLessThanOrEqual(2);
        alleTomme += tomme;
        alleDager += dager;
      }
    }
    expect(alleTomme / alleDager).toBeLessThan(0.03);
  }, 300_000);
});
