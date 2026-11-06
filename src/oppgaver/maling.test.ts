import { describe, expect, it } from "vitest";
import { arstidFor, STARTDATO } from "../dag/plan";
import { froTilfeldig } from "../felles/tilfeldig";
import { standardLagret } from "../lagring/lagring";
import { utfor } from "../spill/okt";
import { spillDag } from "../spill/testbot";
import { ovesISpillet, OMRADER } from "../tilpasning/oversikt";
import type { Dagsplan, Lagret, Nivaa, OppgaveType } from "../typer";
import { lagFraMal, type OppgaveKontekst } from "./lag";
import { MALER } from "./maler";

function ctx(nivaa: Nivaa, fro: number, plan: Dagsplan | null = null): OppgaveKontekst {
  return { tilfeldig: froTilfeldig(fro), spraak: "nb", nivaa, mestring: {}, plan, unngaMal: [], unngaNokkel: "" };
}

function typerISpillet(nivaa: Nivaa): { typer: Set<OppgaveType>; forMange: string[] } {
  const typer = new Set<OppgaveType>();
  const forMange: string[] = [];
  const grunn = standardLagret();
  let lagret: Lagret = { ...grunn, fro: 5, dato: STARTDATO, innstillinger: { ...grunn.innstillinger, nivaa } };
  for (let dag = 0; dag < 25; dag++) {
    lagret = utfor(lagret, { slag: "start" }).lagret;
    const { lagret: etter, logg } = spillDag(lagret);
    for (const rad of logg.oppgaver) {
      typer.add(rad.oppgave.type);
      // Høyst tre av samme type per dag, fra alle kilder (gj. 10, C2).
      const vist = Object.values(rad.takt).reduce((sum, n) => sum + (n ?? 0), 0);
      for (const [type, antall] of Object.entries(rad.takt)) if ((antall ?? 0) > 3) forMange.push(`${nivaa} dag ${dag}: ${type} ${antall} av ${vist}`);
    }
    lagret = etter;
  }
  return { typer, forMange: [...new Set(forMange)] };
}

describe("måling, areal, koordinater og kalender i spillet (gj. 9, oppfølging)", () => {
  it("gir ukeplan og kalender i 1. klasse, måling i 2. klasse og areal, koordinater og likevekt på utfordrende", () => {
    const forste = typerISpillet("forste");
    expect([...forste.typer]).toEqual(expect.arrayContaining(["ukeplan", "kalender"]));
    expect(forste.typer.has("areal")).toBe(false);
    const andre = typerISpillet("andre");
    expect([...andre.typer]).toEqual(expect.arrayContaining(["ukeplan", "kalender", "lengde", "masse"]));
    const utfordrende = typerISpillet("utfordrende");
    expect([...utfordrende.typer]).toEqual(expect.arrayContaining(["lengde", "masse", "areal", "koordinater", "likevekt"]));
    expect([...forste.forMange, ...andre.forMange, ...utfordrende.forMange]).toEqual([]);
  });

  it("viser ferdighetene på voksensiden nå som spillet øver på dem", () => {
    for (const id of ["lengde", "masse", "areal", "koordinater", "likevekt", "ukedager", "maneder"] as const) {
      expect(ovesISpillet(id), id).toBe(true);
      expect(OMRADER.some((omrade) => omrade.ferdigheter.includes(id)), id).toBe(true);
    }
  });

  it("gir vekta tall å telle, uten å skrive svaret", () => {
    for (const mal of MALER.filter((rad) => rad.type === "masse" || rad.type === "likevekt")) {
      for (let fro = 1; fro < 6; fro++) {
        const oppgave = lagFraMal(mal, ctx("utfordrende", fro));
        const vekt = oppgave.vekt;
        expect(vekt, oppgave.prompt).toBeDefined();
        if (!vekt) continue;
        const svar = oppgave.valg.find((valg) => valg.id === oppgave.fasit)?.tall;
        // Med kilolodd har vekta ingen sekk med oppgitt vekt.
        if (vekt.sekkKg === undefined) {
          expect(vekt.sekkKg).toBeUndefined();
          expect(vekt.lodd * vekt.loddKg).toBe(svar);
        } else {
          expect(vekt.sekkKg).toBeGreaterThan(0);
          expect(vekt.lodd).toBe(1);
          expect((vekt.sekkKg ?? 0) / vekt.loddKg).toBe(svar);
        }
      }
    }
  });

  it("viser planken mot en linjal når svaret er i centimeter", () => {
    for (const mal of MALER.filter((rad) => rad.type === "lengde")) {
      const oppgave = lagFraMal(mal, ctx("andre", 3));
      expect(oppgave.planke).toBeDefined();
      const svar = oppgave.valg.find((valg) => valg.id === oppgave.fasit)?.tall;
      if (oppgave.prompt.includes("centimeter")) expect((oppgave.planke?.klosser ?? 0) * 10).toBe(svar);
      else expect(oppgave.planke?.klosser).toBe(svar);
    }
  });

  it("lar ukeplan og kalender løses ut fra bildet eller teksten", () => {
    const plan = utfor({ ...standardLagret(), dato: STARTDATO }, { slag: "start" }).lagret.aktivDag!.plan;
    for (const mal of MALER.filter((rad) => rad.type === "ukeplan")) {
      const oppgave = lagFraMal(mal, ctx("forste", 4, plan));
      expect(oppgave.ukeMerke).toBe(oppgave.fasit);
      expect(oppgave.valg.map((valg) => valg.id)).toContain(oppgave.fasit);
    }
    const maneder = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
    for (const mal of MALER.filter((rad) => rad.type === "kalender")) {
      const oppgave = lagFraMal(mal, ctx("andre", 4, plan));
      if (oppgave.nokkel.startsWith("maned:")) {
        const fra = maneder.findIndex((navn) => oppgave.prompt.includes(` ${navn}`));
        expect(fra, oppgave.prompt).toBeGreaterThanOrEqual(0);
        expect(oppgave.fasit).toBe(maneder[(fra + 1) % 12]);
      }
      if (oppgave.nokkel.startsWith("arstid:")) {
        const fra = maneder.findIndex((navn) => oppgave.prompt.toLowerCase().includes(navn));
        expect(fra, oppgave.prompt).toBeGreaterThanOrEqual(0);
        expect(oppgave.fasit).toBe(arstidFor(fra + 1));
      }
    }
  });
});
