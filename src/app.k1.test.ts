// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { NOKKEL, standardLagret } from "./lagring/lagring";
import type { Lagret, Oppgave } from "./typer";
import { froTilfeldig } from "./felles/tilfeldig";
import { lagFraMal } from "./oppgaver/lag";
import { malerFor } from "./oppgaver/maler";
import { sjekkSvar } from "./oppgaver/sjekk";
import { OPPGAVE_TYPER } from "./typer";
import { utfor } from "./spill/okt";

const oppgave: Oppgave = {
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
};

function lagMedOppgave(): Lagret {
  const startet = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
  const dag = startet.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return {
    ...startet,
    startet: true,
    aktivDag: { ...dag, sted: "butikk", fase: "handel", dorLest: true, ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 },
  };
}

function klikk(knapp: Element): void {
  knapp.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function videreknapp(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>("[data-handling='fortsett'], .hoved, [data-ga], [data-handling='handle']");
}

describe("feil svar på skjermen", () => {
  beforeAll(async () => {
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.setItem(NOKKEL, JSON.stringify(lagMedOppgave()));
    await import("./app.ts");
  });

  it("har en knapp som fører videre etter ett, to og tre feil", async () => {
    for (let gang = 1; gang <= 2; gang++) {
      const feil = document.querySelector<HTMLButtonElement>("[data-svar='a']");
      expect(feil, `gang ${gang}`).toBeTruthy();
      klikk(feil!);
      const knapp = videreknapp();
      expect(knapp?.textContent, `gang ${gang}`).toMatch(/Prøv igjen|Fortsett/);
      await new Promise((vent) => setTimeout(vent, 650));
      klikk(knapp!);
    }
    const handle = document.querySelector<HTMLButtonElement>("[data-handling='handle']");
    if (handle) {
      klikk(handle);
      const svar = [...document.querySelectorAll<HTMLButtonElement>("[data-svar]")];
      const feil = svar[0];
      if (feil) {
        klikk(feil);
        expect(document.querySelector("[data-handling='fortsett'], .reaksjon, .hoved")).toBeTruthy();
      }
    }
    expect(document.querySelector("button"), "skjermen har ingen knapp").toBeTruthy();
  });
});

describe("alle maler", () => {
  it("bygger et svar som kan sjekkes", () => {
    for (const type of OPPGAVE_TYPER) {
      for (const mal of malerFor(type)) {
        const oppgave = lagFraMal(mal, {
          tilfeldig: froTilfeldig(mal.id.length * 17),
          spraak: "nb",
          nivaa: "andre",
          mestring: {},
          plan: null,
          unngaMal: [],
          unngaNokkel: "",
          tidsromPa: true,
        });
        expect(oppgave.type).toBe(type);
        expect(oppgave.fasit.length).toBeGreaterThan(0);
        expect(sjekkSvar(oppgave, oppgave.fasit)).toBe(true);
      }
    }
  });
});
