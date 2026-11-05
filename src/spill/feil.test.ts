import { describe, expect, it } from "vitest";
import { standardLagret } from "../lagring/lagring";
import type { Lagret, Oppgave } from "../typer";
import { utfor } from "./okt";

function oppgave(over: Partial<Oppgave> = {}): Oppgave {
  return {
    id: "butikk-les",
    type: "les-klokka",
    mal: "les-1",
    ferdighet: "hele-timer",
    prompt: "Hva viser klokka?",
    nokkel: "test",
    valg: [
      { id: "a", tekst: "ett", klokke: 60 },
      { id: "b", tekst: "to", klokke: 120 },
    ],
    fasit: "b",
    vare: "planke",
    hvem: "ekspeditøren",
    overraskelse: false,
    ...over,
  };
}

function medOppgave(lagret: Lagret, rad: Oppgave, feil = 0): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return {
    ...lagret,
    aktivDag: {
      ...dag,
      sted: "butikk",
      fase: "handel",
      dorLest: true,
      ko: [rad],
      aktiv: 0,
      forklaring: null,
      feil,
    },
  };
}

describe("feil svar", () => {
  it("beholder oppgaven og slipper videre etter ett og to feil", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    lagret = medOppgave(lagret, oppgave());
    const en = utfor(lagret, { slag: "svar", svar: "a" }).lagret;
    expect(en.aktivDag?.forklaring).toBeTruthy();
    expect(en.aktivDag?.ko[0]?.id).toBe("butikk-les");
    expect(en.aktivDag?.feil).toBe(1);
    const igjen = utfor(en, { slag: "fortsett" }).lagret;
    expect(igjen.aktivDag?.forklaring).toBeNull();
    expect(igjen.aktivDag?.ko[0]?.id).toBe("butikk-les");
    expect(igjen.aktivDag?.feil).toBe(1);
    const to = utfor(igjen, { slag: "svar", svar: "a" }).lagret;
    expect(to.aktivDag?.feil).toBe(2);
    expect(to.aktivDag?.forklaring).toBeTruthy();
    const videre = utfor(to, { slag: "fortsett" }).lagret;
    expect(videre.aktivDag?.ko).toEqual([]);
    expect(videre.aktivDag?.forklaring).toBeNull();
  });

  it("gir delen når åpningstidsoppgaven i butikken svares riktig", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const rad = oppgave({ id: "butikk-apen", type: "apningstider", fasit: "ja", valg: [{ id: "ja", tekst: "Åpen" }, { id: "nei", tekst: "Stengt" }] });
    lagret = medOppgave(lagret, rad, 0);
    lagret = utfor(lagret, { slag: "svar", svar: "nei" }).lagret;
    const forMynt = lagret.mynter;
    const etter = utfor(lagret, { slag: "svar", svar: "ja" }).lagret;
    expect(etter.kurv.planke ?? etter.kurv["kloss-sylinder"]).toBeGreaterThan(0);
    expect(etter.mynter).toBe(forMynt + 1);
    expect(etter.aktivDag?.dorLest).toBe(true);
    expect(etter.aktivDag?.fase).not.toBe("dor");
  });

  it("nullstiller feil når barnet går et annet sted", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = { ...lagret, aktivDag: { ...dag, feil: 1, sted: "hjemme" } };
    const etter = utfor(lagret, { slag: "ga", sted: "torg" }).lagret;
    expect(etter.aktivDag?.feil).toBe(0);
    expect(etter.aktivDag?.ko).toEqual([]);
  });
});
