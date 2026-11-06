import { describe, expect, it } from "vitest";
import { froTilfeldig } from "../felles/tilfeldig";
import { standardLagret } from "../lagring/lagring";
import { utfor } from "../spill/okt";
import { STARTDATO } from "../dag/plan";
import { byggBestemt, vareAntall, vareMedArtikkel } from "../tekst/ordbok";
import type { Lagret, Nivaa, Oppgave, VareId } from "../typer";
import { lagFraMal, type OppgaveKontekst } from "./lag";
import { MALER } from "./maler";
import { sporsmalViser } from "./visning";

function ctx(nivaa: Nivaa, fro: number): OppgaveKontekst {
  return { tilfeldig: froTilfeldig(fro), spraak: "nb", nivaa, mestring: {}, plan: null, unngaMal: [], unngaNokkel: "" };
}

function alle(nivaa: Nivaa, antall = 4): Oppgave[] {
  const ut: Oppgave[] = [];
  for (const mal of MALER) for (let fro = 1; fro <= antall; fro++) ut.push(lagFraMal(mal, ctx(nivaa, fro * 13 + mal.id.length)));
  return ut;
}

describe("tekst (gj. 9, B7)", () => {
  it("bøyer deler og bygg riktig", () => {
    expect(vareMedArtikkel("tak-rodt", "nb")).toBe("et rødt tak");
    expect(vareMedArtikkel("vindu-sirkel", "nb")).toBe("et sirkelvindu");
    expect(vareMedArtikkel("jord", "nb")).toBe("jord");
    expect(vareMedArtikkel("kloss-prisme", "nb")).toBe("et prisme");
    expect(vareMedArtikkel("maling", "nb")).toBe("maling");
    expect(vareMedArtikkel("planke", "nb")).toBe("en planke");
    expect(vareAntall("planke", 3, "nb")).toBe("3 planker");
    expect(vareAntall("vegg-stein", 5, "nb")).toBe("5 steinkanter");
    expect(byggBestemt("vanntaarn", "nb", true)).toBe("Vanntårnet");
    expect(byggBestemt("fyrtarn", "nb")).toBe("fyrtårnet");
  });

  it("setter «klokka» foran klokkeslett i ord", () => {
    for (const oppgave of alle("andre").filter((rad) => rad.type === "still-klokka")) {
      if (/\d{2}:\d{2}/.test(oppgave.prompt)) continue;
      expect(oppgave.prompt, oppgave.mal).toMatch(/klokka (halv |kvart |fem |ti |tjue |[a-zæøå]+)/i);
      expect(oppgave.prompt, oppgave.mal).not.toMatch(/(?:^|\s)(åpner|er|starter|sier) (halv |kvart )?(ett|to|tre|fire|fem|seks|sju|åtte|ni|ti|elleve|tolv)\b/);
    }
  });

  it("bruker ikke vanskelige ord", () => {
    for (const nivaa of ["forste", "andre", "utfordrende"] as Nivaa[]) {
      for (const oppgave of alle(nivaa)) {
        expect(oppgave.prompt, oppgave.mal).not.toMatch(/merkelapp|halvtimer|stempler|Koble klokka|flatene|(^|\s)kantene|rette hjørnene/i);
      }
    }
  });

  it("gir bare hele og halve timer i «rekker du det» i 1. klasse", () => {
    for (const oppgave of alle("forste", 12).filter((rad) => rad.type === "rekker-jeg")) {
      const tid = oppgave.prompt.match(/(\d{2}):(\d{2})/);
      if (tid) expect(["00", "30"], oppgave.prompt).toContain(tid[2]);
    }
  });

  it("viser digital tid når spørsmålet er tid på døgnet", () => {
    const les12 = MALER.find((mal) => mal.id === "les-12");
    if (!les12) return;
    const oppgave = lagFraMal(les12, ctx("andre", 3));
    expect(sporsmalViser(oppgave)).toBe("digital");
  });

  it("gir svaret på ulike plasser blant tallene", () => {
    const plass = [0, 0, 0];
    for (const oppgave of alle("andre", 30).filter((rad) => rad.valg.length === 3 && rad.valg.every((valg) => valg.tall !== undefined))) {
      const sortert = [...oppgave.valg].sort((a, b) => (a.tall ?? 0) - (b.tall ?? 0));
      const indeks = sortert.findIndex((valg) => valg.id === oppgave.fasit);
      plass[indeks] = (plass[indeks] ?? 0) + 1;
    }
    const sum = plass.reduce((a, b) => a + b, 0);
    expect(sum).toBeGreaterThan(30);
    for (const antall of plass) expect(antall / sum).toBeGreaterThan(0.2);
  });
});

function iButikken(nivaa: Nivaa, fro: number, vare: VareId): Lagret {
  const grunn = standardLagret();
  let lagret: Lagret = { ...grunn, fro, dato: STARTDATO, innstillinger: { ...grunn.innstillinger, nivaa } };
  lagret = utfor(lagret, { slag: "start" }).lagret;
  const dag = lagret.aktivDag!;
  const tid = dag.plan.butikk.stengtHele ? 15 * 60 : dag.plan.butikk.apner;
  return {
    ...lagret,
    kurv: {},
    aktivDag: { ...dag, tid, sted: "butikk", fase: "handel", dorLest: true, dagensBygg: undefined, valgtInstans: null, plan: { ...dag.plan, butikk: { apner: 12 * 60, stenger: 20 * 60, stengtHele: false } } },
    by: { ...lagret.by, bygg: [...lagret.by.bygg, { instans: "x", bygg: byggFor(vare), x: 5, y: 5, steg: stegFor(vare), ferdig: false, uthus: false, frie: [], pynt: [] }] },
  };
}

function byggFor(vare: VareId) {
  return vare === "kloss-sylinder" ? ("bronn" as const) : vare === "planke" ? ("gjerde" as const) : ("bronn" as const);
}
function stegFor(vare: VareId) {
  return vare === "kloss-sylinder" ? 0 : vare === "tak-rodt" ? 2 : 0;
}

describe("delen og oppgaven passer sammen (gj. 9, B5)", () => {
  it("sier aldri «Vi trenger X» foran en oppgave om noe annet, og handler oftest om delen", () => {
    const formFor: Record<string, string> = { "kloss-sylinder": "sylinder", planke: "rektangel", "tak-rodt": "trekant" };
    let formOppgaver = 0;
    let omDelen = 0;
    const perMal: Record<string, [number, number]> = {};
    for (const nivaa of ["forste", "andre", "utfordrende"] as Nivaa[]) {
      for (const vare of ["kloss-sylinder", "planke", "tak-rodt"] as VareId[]) {
        for (let fro = 1; fro <= 60; fro++) {
          const lagret = iButikken(nivaa, fro, vare);
          const etter = utfor(lagret, { slag: "handle" }).lagret;
          const oppgave = etter.aktivDag?.ko[0];
          if (!oppgave) continue;
          expect(oppgave.prompt, oppgave.mal).not.toMatch(/Vi trenger/);
          const form = oppgave.form3d ?? oppgave.form;
          const klokke = oppgave.maalKlokke !== undefined || oppgave.type === "still-klokka";
          if (klokke) {
            expect(oppgave.kontekst, oppgave.mal).toBeTruthy();
            continue;
          }
          formOppgaver++;
          const rad = (perMal[oppgave.type] ??= [0, 0]);
          rad[1]++;
          if (!oppgave.kontekst) {
            expect(form, `${oppgave.mal} ${oppgave.prompt}`).toBe(formFor[oppgave.vare]);
            omDelen++;
            rad[0]++;
          }
        }
      }
    }
    expect(formOppgaver).toBeGreaterThan(50);
    expect(omDelen / formOppgaver).toBeGreaterThanOrEqual(0.5);
    console.log("Andel om delen per mal:", JSON.stringify(perMal));
  });
});
