import { describe, expect, it } from "vitest";
import { froTilfeldig } from "../felles/tilfeldig";
import type { Nivaa, Oppgave } from "../typer";
import { lagFraMal, trekkType, type OppgaveKontekst } from "./lag";
import { malerFor } from "./maler";

function ctx(fro: number, nivaa: Nivaa): OppgaveKontekst {
  return {
    tilfeldig: froTilfeldig(fro),
    spraak: "nb",
    nivaa,
    mestring: {},
    plan: null,
    unngaMal: [],
    unngaNokkel: "",
  };
}

function enhet(sekvens: string[]): string[] {
  for (let lengde = 1; lengde <= Math.floor(sekvens.length / 2); lengde++) {
    if (sekvens.every((ledd, indeks) => ledd === sekvens[indeks % lengde])) return sekvens.slice(0, lengde);
  }
  return sekvens;
}

function rekke(oppgave: Oppgave): string[] {
  if (oppgave.monsterFarge?.length) return oppgave.monsterFarge;
  if (oppgave.monsterStor?.length) return oppgave.monsterStor.map(String);
  return oppgave.monster ?? [];
}

describe("mønster", () => {
  it("har én korteste gjentakelse, og fasiten følger den", () => {
    for (const nivaa of ["forste", "andre", "utfordrende"] as const) {
      for (const mal of malerFor("monster")) {
        const oppgave = lagFraMal(mal, ctx(mal.id.length, nivaa));
        if (oppgave.prompt.includes("vokser")) {
          expect(nivaa).toBe("utfordrende");
          expect(oppgave.fasit).toBe(oppgave.monster?.[0]);
          continue;
        }
        const sekvens = rekke(oppgave);
        const kort = enhet(sekvens);
        expect(kort.length).toBeLessThan(sekvens.length);
        expect(oppgave.fasit).toBe(kort[sekvens.length % kort.length]);
      }
    }
  });
});

describe("åpningstid uten oppgitt klokke", () => {
  it("kan svare både ja og nei", () => {
    const svar = new Set<string>();
    for (let fro = 0; fro < 30; fro++) {
      const oppgave = trekkType("apningstider", {
        ...ctx(fro * 17, "andre"),
        plan: {
          nokkel: "test",
          dato: { aar: 2026, maned: 8, dag: 18 },
          ukedag: "tirsdag",
          arstid: "sommer",
          skoleslutt: null,
          sisteTime: null,
          sfo: null,
          butikk: { apner: 14 * 60, stenger: 17 * 60, stengtFra: 15 * 60, stengtTil: 15 * 60 + 30, stengtHele: false },
          avtaler: [],
          leggetid: 20 * 60,
          start: 13 * 60,
        },
      });
      svar.add(oppgave.fasit);
    }
    expect(svar.has("ja")).toBe(true);
    expect(svar.has("nei")).toBe(true);
  });

  it("beholder klokka når den er oppgitt", () => {
    const oppgave = trekkType("apningstider", {
      ...ctx(3, "andre"),
      naa: 14 * 60 + 30,
      plan: {
        nokkel: "test",
        dato: { aar: 2026, maned: 8, dag: 18 },
        ukedag: "tirsdag",
        arstid: "sommer",
        skoleslutt: null,
        sisteTime: null,
        sfo: null,
        butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false },
        avtaler: [],
        leggetid: 20 * 60,
        start: 13 * 60,
      },
    });
    expect(oppgave.fasit).toBe("ja");
    expect(oppgave.skilt?.naa).toBe(14 * 60 + 30);
  });
});
