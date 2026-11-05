import { describe, expect, it } from "vitest";
import { BYGG } from "../bygg/katalog";
import { froTilfeldig } from "../felles/tilfeldig";
import { lagFraMal } from "../oppgaver/lag";
import { MALER } from "../oppgaver/maler";
import { forklaring } from "../oppgaver/forklaring";
import { klokke } from "../tid/tid";
import { SPRAAK } from "../typer";
import { fraNb, harOversettelse } from "./ordbok";

describe("ordbok", () => {
  it("har alle oppskrifter på engelsk", () => {
    const sett = new Set<string>();
    for (const bygg of Object.values(BYGG)) {
      for (const steg of bygg.oppskrift) sett.add(steg.nb);
    }
    for (const nb of sett) {
      expect(harOversettelse(nb), nb).toBe(true);
      expect(fraNb("en", nb).length, nb).toBeGreaterThan(0);
      expect(fraNb("en", nb), nb).not.toBe(nb);
      expect(fraNb("nn", nb, "nynorsk-fra-katalog")).toBe("nynorsk-fra-katalog");
    }
  });

  it("beholder bokmål og nynorsk, og bytter de andre", () => {
    expect(fraNb("nb", "Tilbake", "Tilbake")).toBe("Tilbake");
    expect(fraNb("nn", "Innstillinger", "Innstillingar")).toBe("Innstillingar");
    expect(fraNb("en", "Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka.")).toBe("Build a city. Watch the clock.");
    expect(fraNb("pt", "Sjekk for oppdateringer")).toBe("Procurar atualizações");
    expect(fraNb("de", "Riktig!", "Rett!")).toBe("Richtig!");
    for (const spraak of SPRAAK) {
      expect(fraNb(spraak, "Meny", "Meny").length).toBeGreaterThan(0);
    }
  });
});

describe("oppgaver på landets klokkespråk", () => {
  const mal = MALER.find((rad) => rad.id === "still-6");
  const les = MALER.find((rad) => rad.id === "les-6");

  it("sier half past two når engelsk skal vise 14:30", () => {
    expect(mal).toBeDefined();
    const oppgave = lagFraMal(mal!, {
      tilfeldig: froTilfeldig(1),
      spraak: "en",
      nivaa: "utfordrende",
      mestring: {},
      plan: null,
      unngaMal: [],
      unngaNokkel: "",
    });
    expect(oppgave.maalKlokke).toBe(klokke(14, 30));
    expect(oppgave.prompt).toContain("half past two");
    expect(oppgave.prompt.toLowerCase()).not.toContain("halv");
    expect(forklaring({ ...oppgave, valg: [{ id: "k" + klokke(15, 30), klokke: klokke(15, 30), tekst: "" }] }, "k" + klokke(15, 30), "en")).toBe(
      "Half past two is thirty minutes after two. It is 14:30.",
    );
  });

  it("spør hva duas e meia er på portugisisk", () => {
    expect(les).toBeDefined();
    const oppgave = lagFraMal(les!, {
      tilfeldig: froTilfeldig(1),
      spraak: "pt",
      nivaa: "utfordrende",
      mestring: {},
      plan: null,
      unngaMal: [],
      unngaNokkel: "",
    });
    expect(oppgave.prompt).toBe("O que é duas e meia?");
    expect(oppgave.valg.every((valg) => !valg.tekst.toLowerCase().includes("halv"))).toBe(true);
  });

  it("sier halb drei på tysk", () => {
    const oppgave = lagFraMal(mal!, {
      tilfeldig: froTilfeldig(1),
      spraak: "de",
      nivaa: "utfordrende",
      mestring: {},
      plan: null,
      unngaMal: [],
      unngaNokkel: "",
    });
    expect(oppgave.prompt).toContain("halb drei");
  });
});
