import { describe, expect, it } from "vitest";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import { sjekkSvar } from "../oppgaver/sjekk";
import { erApen } from "../tid/tid";
import type { Lagret, Nivaa, Oppgave } from "../typer";
import { gangMinutter } from "./anbefaling";
import { apningTekst, utfor } from "./okt";
import { feilSvar, riktigSvar, spillDag } from "./testbot";

const NIVAER: Nivaa[] = ["forste", "andre", "utfordrende", "blandet"];

function ny(nivaa: Nivaa = "forste", fro = 1): Lagret {
  const grunn = standardLagret();
  return { ...grunn, fro, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa } };
}

function oppdragOppgave(): Oppgave {
  return {
    id: "oppdrag-test",
    type: "les-klokka",
    mal: "les-1",
    ferdighet: "hele-timer",
    prompt: "Naboen spør. Hva viser klokka?",
    nokkel: "test",
    valg: [
      { id: "a", tekst: "ett", klokke: 60 },
      { id: "b", tekst: "to", klokke: 120 },
    ],
    fasit: "b",
    vare: "planke",
    hvem: "naboen",
    overraskelse: false,
    ovelse: true,
    oppdrag: true,
  };
}

function medOppdrag(lagret: Lagret): Lagret {
  const start = utfor(lagret, { slag: "start" }).lagret;
  const dag = start.aktivDag!;
  return { ...start, aktivDag: { ...dag, fase: "aktivitet", oppdragFra: "aktivitet", ko: [oppdragOppgave()], aktiv: 0, feil: 0 } };
}

describe("morgendagens plan (gj. 9, A6 og 7.2)", () => {
  it("bruker samme plan i morgen som tårnuret og skiltet viste i dag", () => {
    for (const nivaa of NIVAER) {
      let lagret = ny(nivaa, 7);
      for (let dag = 0; dag < 14; dag++) {
        lagret = utfor(lagret, { slag: "start" }).lagret;
        const morgen = lagret.aktivDag!.morgen!;
        expect(morgen.length).toBeGreaterThan(0);
        const apen = morgen.find((plan) => !plan.butikk.stengtHele);
        if (apen) expect(lagret.aktivDag!.plan.nesteApning).toBe(apen.butikk.apner);
        lagret = spillDag(lagret).lagret;
        lagret = utfor(lagret, { slag: "start" }).lagret;
        const iDag = lagret.aktivDag!.plan;
        expect(iDag.nokkel).toBe(morgen[0]!.nokkel);
        expect(iDag.butikk.apner).toBe(morgen[0]!.butikk.apner);
        expect(iDag.avtaler.map((rad) => rad.start)).toEqual(morgen[0]!.avtaler.map((rad) => rad.start));
        if (morgen.length > 1) expect(lagret.aktivDag!.morgen![0]!.nokkel).toBe(morgen[1]!.nokkel);
        lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      }
    }
  });

  it("sier riktig åpningstid i morgen etter stengetid", () => {
    let lagret = ny("andre", 3);
    let sjekket = 0;
    for (let dag = 0; dag < 21; dag++) {
      lagret = utfor(lagret, { slag: "start" }).lagret;
      const d = lagret.aktivDag!;
      const morgen = d.morgen![0]!;
      if (!d.plan.butikk.stengtHele && !morgen.butikk.stengtHele && d.plan.ukedag !== "lordag" && d.plan.ukedag !== "sondag") {
        const sent = { ...lagret, aktivDag: { ...d, tid: d.plan.butikk.stenger + 5 } };
        const tekst = apningTekst(sent);
        const hh = String(Math.floor(morgen.butikk.apner / 60)).padStart(2, "0");
        const mm = String(morgen.butikk.apner % 60).padStart(2, "0");
        expect(tekst).toContain(`${hh}:${mm}`);
        sjekket++;
      }
      lagret = utfor(lagret, { slag: "avslutt" }).lagret;
    }
    expect(sjekket).toBeGreaterThan(5);
  });
});

describe("oppdrag (gj. 9, 6.4, 6.5, 6.11)", () => {
  it("avslutter oppdraget for dagen etter to feil og gir ingen stjerne", () => {
    let lagret = medOppdrag(ny());
    lagret = utfor(lagret, { slag: "svar", svar: "a" }).lagret;
    lagret = utfor(lagret, { slag: "fortsett" }).lagret;
    lagret = utfor(lagret, { slag: "svar", svar: "a" }).lagret;
    const ut = utfor(lagret, { slag: "fortsett" });
    lagret = ut.lagret;
    expect(ut.melding).toBe("Vi prøver et nytt oppdrag i morgen.");
    expect(lagret.aktivDag?.oppdragFerdig).toBe(true);
    expect(lagret.aktivDag?.oppdragForste).toBeFalsy();
    expect(lagret.aktivDag?.ko).toEqual([]);
    expect(lagret.aktivDag?.fase).toBe("aktivitet");
    const igjen = utfor(lagret, { slag: "oppdrag" }).lagret;
    expect(igjen.aktivDag?.ko).toEqual([]);
    const kveld = utfor(lagret, { slag: "avslutt" }).lagret;
    expect(kveld.dagbok.at(-1)?.merknad).toContain("☆ Oppdraget ble ikke gjort");
    expect(kveld.dagbok.at(-1)?.stjerner).toBeLessThan(3);
  });

  it("sier at oppdraget ble gjort når det var riktig på andre forsøk", () => {
    let lagret = medOppdrag(ny());
    lagret = utfor(lagret, { slag: "svar", svar: "a" }).lagret;
    lagret = utfor(lagret, { slag: "fortsett" }).lagret;
    lagret = utfor(lagret, { slag: "svar", svar: "b" }).lagret;
    expect(lagret.aktivDag?.fase).toBe("aktivitet");
    const kveld = utfor(lagret, { slag: "avslutt" }).lagret;
    expect(kveld.dagbok.at(-1)?.merknad).toContain("☆ Oppdraget ble gjort, men ikke på første forsøk.");
  });

  it("husker hvor barnet var da oppdraget startet", () => {
    let lagret = utfor(ny(), { slag: "start" }).lagret;
    lagret = { ...lagret, aktivDag: { ...lagret.aktivDag!, fase: "aktivitet", sted: "hjemme" } };
    const startet = utfor(lagret, { slag: "oppdrag" }).lagret;
    expect(startet.aktivDag?.oppdragFra).toBe("aktivitet");
  });

  it("skriver aldri «0 av 0 riktige»", () => {
    const lagret = utfor(utfor(ny(), { slag: "start" }).lagret, { slag: "avslutt" }).lagret;
    expect(lagret.dagbok.at(-1)?.merknad).not.toContain("0 av 0");
  });
});

describe("tårnur og still klokka (gj. 9, 6.7 og 6.10)", () => {
  it("godtar tolvtimerstid når klokka stilles på en analog skive", () => {
    const oppgave = { ...oppdragOppgave(), type: "still-klokka" as const, fasit: String(15 * 60 + 30), maalKlokke: 15 * 60 + 30, valg: [] };
    expect(sjekkSvar(oppgave, String(3 * 60 + 30))).toBe(true);
    expect(sjekkSvar(oppgave, String(15 * 60 + 30))).toBe(true);
    expect(sjekkSvar(oppgave, String(4 * 60 + 30))).toBe(false);
  });

  it("gir mynter for bare én runde med tårnuret per dag", () => {
    let lagret = utfor(ny(), { slag: "start" }).lagret;
    const for0 = lagret.mynter;
    lagret = utfor(lagret, { slag: "ur-runde", riktige: 5 }).lagret;
    expect(lagret.mynter).toBe(for0 + 5);
    lagret = utfor(lagret, { slag: "ur-runde", riktige: 5 }).lagret;
    expect(lagret.mynter).toBe(for0 + 5);
  });
});

describe("pynt (gj. 9, 6.10)", () => {
  it("legger pynt bare på ledige ruter og sier hva pynten koster", () => {
    let lagret = { ...ny(), mynter: 3 };
    const hjem = lagret.by.bygg[0]!;
    const opptatt = utfor(lagret, { slag: "pynt", vare: "pynt-blomst", x: hjem.x, y: hjem.y });
    expect(opptatt.lagret.mynter).toBe(3);
    expect(opptatt.lagret.by.pynt ?? []).toEqual([]);
    const dyr = utfor(lagret, { slag: "pynt", vare: "pynt-benk", x: hjem.x + 1, y: hjem.y + 1 });
    expect(dyr.melding).toBe("Du har 3 mynter. Benken koster 5.");
    expect(dyr.lagret.mynter).toBe(3);
    lagret = utfor(lagret, { slag: "pynt", vare: "pynt-blomst", x: hjem.x + 1, y: hjem.y + 1 }).lagret;
    expect(lagret.mynter).toBe(1);
    expect(lagret.by.pynt?.length).toBe(1);
  });
});

describe("ingen låste dager (gj. 9, 6.3, 6.8, 6.9)", () => {
  it("avslutter dagen også når barnet bare svarer feil", () => {
    for (const nivaa of NIVAER) {
      const { lagret, logg } = spillDag(ny(nivaa, 11), feilSvar, 600);
      expect(lagret.aktivDag, `${nivaa} steg ${logg.steg}`).toBeNull();
    }
  });

  it("tilbyr ekstra bygg bare når butikken er åpen minst 30 minutter når barnet kommer fram", () => {
    let tilbud = 0;
    for (const nivaa of ["forste", "andre", "blandet"] as Nivaa[]) {
      let lagret = ny(nivaa, 5);
      for (let dag = 0; dag < 15; dag++) {
        const { lagret: etter, logg } = spillDag(lagret, riktigSvar);
        for (const rad of logg.spor.filter((spor) => spor.slag === "ekstra")) {
          const d = rad.lagret.aktivDag!;
          const fram = d.tid + (d.sted === "butikk" ? 0 : gangMinutter(d.sted, "butikk", nivaa));
          expect(erApen(fram, d.plan.butikk), `${nivaa} dag ${dag}`).toBe(true);
          expect(erApen(fram + 29, d.plan.butikk), `${nivaa} dag ${dag}`).toBe(true);
          tilbud++;
        }
        lagret = etter;
      }
    }
    expect(tilbud).toBeGreaterThan(0);
  });

  it("sender barnet til butikken minst én gang når den er åpen i minst 30 minutter", () => {
    const brudd: string[] = [];
    for (const nivaa of NIVAER) {
      let lagret = ny(nivaa, 9);
      for (let dag = 0; dag < 15; dag++) {
        lagret = utfor(lagret, { slag: "start" }).lagret;
        const d = lagret.aktivDag!;
        const plan = d.plan;
        let apneMin = 0;
        const fra = d.tid + gangMinutter("hjemme", "butikk", nivaa);
        const gang = gangMinutter("hjemme", "butikk", nivaa);
        const ledig = (t: number) =>
          !plan.avtaler.some((rad) => rad.varighet > 0 && t + gang > rad.start - (rad.sted === "hjemme" ? 0 : 30) && t - gang < rad.start + rad.varighet);
        for (let t = fra; t < plan.leggetid - gang; t += 5) if (erApen(t, plan.butikk) && ledig(t)) apneMin += 5;
        const { lagret: etter, logg } = spillDag(lagret, riktigSvar);
        const vartIButikken = logg.spor.some((rad) => rad.lagret.aktivDag?.sted === "butikk");
        if (apneMin >= 30 && !vartIButikken && etter.dagbok.at(-1)?.bygget.length === 0) {
          brudd.push(`${nivaa} ${plan.ukedag} ${plan.dato.dag}.${plan.dato.maned} start ${d.tid}`);
        }
        lagret = etter;
      }
    }
    expect(brudd).toEqual([]);
  });
});
