import { describe, expect, it } from "vitest";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import type { Nivaa } from "../typer";
import { utfor } from "./okt";
import { urRunde } from "./taarnur";
import { spillDag } from "./testbot";

describe("tårnuret (gj. 9, A6 og B7)", () => {
  it("henter tidene fra planen barnet faktisk får i morgen, og setningene gir mening", () => {
    for (const nivaa of ["forste", "andre", "utfordrende"] as Nivaa[]) {
      const grunn = standardLagret();
      let lagret = { ...grunn, fro: 4, dato: STARTDATO, innstillinger: { ...grunn.innstillinger, nivaa } };
      for (let dag = 0; dag < 8; dag++) {
        lagret = utfor(lagret, { slag: "start" }).lagret;
        const runde = urRunde(lagret);
        expect(runde.length).toBe(5);
        expect(new Set(runde.map((rad) => rad.tid)).size).toBe(5);
        for (const rad of runde) {
          expect(rad.tekst).not.toMatch(/I morgen er klokka|begynner hente|begynner lufte/);
          expect(rad.tekst).toMatch(/klokka /);
        }
        lagret = spillDag(lagret).lagret;
        lagret = utfor(lagret, { slag: "start" }).lagret;
        const plan = lagret.aktivDag!.plan;
        const avtaleTider = plan.avtaler.filter((avtale) => avtale.varighet > 0).map((avtale) => avtale.start);
        const fraPlan = runde.filter((rad) => rad.tekst.startsWith("I morgen") && !rad.tekst.includes("leggetid") && !rad.tekst.includes("butikken"));
        for (const rad of fraPlan) expect(avtaleTider.some((tid) => Math.abs(tid - rad.tid) < 30), rad.tekst).toBe(true);
        lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      }
    }
  });

  it("gir nye mål i en ny runde samme dag (gj. 10, C2)", () => {
    const grunn = standardLagret();
    const lagret = utfor({ ...grunn, fro: 4, dato: STARTDATO }, { slag: "start" }).lagret;
    const forste = urRunde(lagret);
    const andre = urRunde(lagret, undefined, 1);
    const tredje = urRunde(lagret, undefined, 2);
    expect(andre.length).toBe(5);
    expect(andre.map((rad) => rad.tid)).not.toEqual(forste.map((rad) => rad.tid));
    expect(tredje.map((rad) => rad.tid)).not.toEqual(andre.map((rad) => rad.tid));
    for (const rad of andre) expect(rad.tekst).toMatch(/klokka /);
  });

  it("teller rundene, og bare den første gir mynter", () => {
    const grunn = standardLagret();
    let lagret = utfor({ ...grunn, fro: 4, dato: STARTDATO }, { slag: "start" }).lagret;
    const mynter = lagret.mynter;
    lagret = utfor(lagret, { slag: "ur-runde", riktige: 5 }).lagret;
    lagret = utfor(lagret, { slag: "ur-runde", riktige: 5 }).lagret;
    expect(lagret.mynter).toBe(mynter + 5);
    expect(lagret.aktivDag?.urRunder).toBe(2);
  });
});
