import { describe, expect, it } from "vitest";
import { froTilfeldig } from "../felles/tilfeldig";
import { OPPGAVE_TYPER, type Oppgave } from "../typer";
import { forklaring } from "./forklaring";
import { trekkOppgave, trekkType, type OppgaveKontekst } from "./lag";
import { malerFor } from "./maler";
import { sjekkSvar } from "./sjekk";

function ctx(fro: number, unngaMal: string[] = []): OppgaveKontekst {
  return {
    tilfeldig: froTilfeldig(fro),
    spraak: "nb",
    nivaa: "utfordrende",
    mestring: {},
    plan: null,
    unngaMal,
    unngaNokkel: "",
    tidsromPa: true,
  };
}

function fasitErGyldig(oppgave: Oppgave): boolean {
  if (oppgave.type === "finn-formen") {
    const riktige = oppgave.fasit.split(",");
    expect(riktige.length).toBeGreaterThan(0);
    for (const id of riktige) {
      expect(oppgave.varer?.find((vare) => vare.id === id)?.form).toBe(oppgave.form);
    }
    return true;
  }
  if (oppgave.type === "sorter") {
    const par = oppgave.fasit.split(",");
    expect(par.length).toBe(oppgave.varer?.length);
    for (const del of par) {
      const [vare, kasse] = del.split(":");
      expect(oppgave.varer?.some((rad) => rad.id === vare)).toBe(true);
      expect(oppgave.kasser?.some((rad) => rad.id === kasse)).toBe(true);
    }
    return true;
  }
  if (oppgave.valg.length === 0) {
    if (oppgave.type === "still-klokka") expect(oppgave.fasit).toBe(String(oppgave.maalKlokke));
    if (oppgave.type === "tegn") expect(oppgave.fasit).toBe("ok");
    return true;
  }
  expect(oppgave.valg.map((valg) => valg.id)).toContain(oppgave.fasit);
  expect(new Set(oppgave.valg.map((valg) => valg.id)).size).toBe(oppgave.valg.length);
  if (oppgave.type !== "hvem-passer-ikke") {
    const synlig = oppgave.valg.map((valg) => `${valg.tekst ?? ""}|${valg.klokke ?? ""}|${valg.form ?? ""}|${valg.tall ?? ""}`);
    expect(new Set(synlig).size).toBe(synlig.length);
  }
  return true;
}

describe("oppgavebank", () => {
  it("har minst seks maler per type", () => {
    for (const type of OPPGAVE_TYPER) {
      expect(malerFor(type).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("legger riktig svar blant ulike alternativer", () => {
    for (const type of OPPGAVE_TYPER) {
      const brukt: string[] = [];
      for (let i = 0; i < 10; i++) {
        const oppgave = trekkType(type, ctx(100 + i * 17, brukt));
        expect(brukt).not.toContain(oppgave.mal);
        brukt.push(oppgave.mal);
        fasitErGyldig(oppgave);
        expect(sjekkSvar(oppgave, oppgave.fasit)).toBe(true);
        expect(sjekkSvar(oppgave, "helt-feil")).toBe(false);
      }
    }
  });

  it("gir omtrent én overraskelse av åtte og forklarer halv-tre-fella", () => {
    const tilfeldig = froTilfeldig(11);
    let overraskelse = 0;
    for (let i = 0; i < 400; i++) {
      const oppgave = trekkOppgave({ ...ctx(1), tilfeldig });
      if (oppgave.overraskelse) overraskelse += 1;
    }
    expect(overraskelse).toBeGreaterThan(30);
    expect(overraskelse).toBeLessThan(80);
    const tekst = forklaring(
      {
        id: "x",
        type: "les-klokka",
        mal: "les-6",
        ferdighet: "halv",
        prompt: "",
        nokkel: "",
        valg: [{ id: "k210", klokke: 3 * 60 + 30 }],
        fasit: "k150",
        vare: "planke",
        hvem: "naboen",
        overraskelse: false,
        maalKlokke: 2 * 60 + 30,
      },
      "k210",
      "nb",
    );
    expect(tekst).toContain("halvveis til tre");
  });
});
