import { describe, expect, it } from "vitest";
import { standardLagret } from "../lagring/lagring";
import { lagFraMal } from "../oppgaver/lag";
import { MALER } from "../oppgaver/maler";
import { forklaring } from "../oppgaver/forklaring";
import { froTilfeldig } from "../felles/tilfeldig";
import { nesteSteg } from "./anbefaling";
import { utfor } from "./okt";
import type { Lagret } from "../typer";

function butikkDag(tid: number, fro = 2): Lagret {
  const startet = utfor(
    { ...standardLagret(), fro, innstillinger: { ...standardLagret().innstillinger, nivaa: "forste" } },
    { slag: "start" },
  ).lagret;
  const dag = startet.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return {
    ...startet,
    fro,
    aktivDag: {
      ...dag,
      tid,
      sted: "butikk",
      dorLest: false,
      fase: "ute",
      ko: [],
      forklaring: null,
      plan: {
        ...dag.plan,
        avtaler: [{ id: "middag", slag: "middag", navn: "Middag", start: 18 * 60, varighet: 30, sted: "hjemme" }],
        butikk: { apner: 14 * 60, stenger: 17 * 60 + 30, stengtHele: false, stengtFra: 15 * 60, stengtTil: 15 * 60 + 30 },
      },
    },
  };
}

describe("skiltet på døra", () => {
  it("sier ikke om butikken er åpen før skiltet er lest", () => {
    for (const tid of [12 * 60, 14 * 60, 15 * 60 + 15]) {
      const steg = nesteSteg(butikkDag(tid));
      expect(steg.grunn).toBe("Les skiltet på døra.");
      expect(steg.grunn.toLowerCase()).not.toMatch(/åpen|stengt|åpner/);
    }
  });

  it("legger pausen på skiltet og spør når butikken åpner hvis den er stengt", () => {
    const lagret = butikkDag(15 * 60 + 15);
    const dor = utfor(lagret, { slag: "dor" }).lagret;
    const forste = dor.aktivDag?.ko[0];
    expect(forste?.fasit).toBe("nei");
    expect(forste?.skilt?.stengtFra).toBe(15 * 60);
    expect(forste?.skilt?.stengtTil).toBe(15 * 60 + 30);
    expect(forste?.skilt?.naa).toBe(15 * 60 + 15);
    const etter = utfor(dor, { slag: "svar", svar: "nei" }).lagret;
    const oppfolging = etter.aktivDag?.ko[0];
    expect(oppfolging?.prompt).toBe("Når åpner butikken?");
    expect(oppfolging?.valg.filter((valg) => valg.klokke !== undefined)).toHaveLength(3);
    expect(oppfolging?.valg.find((valg) => valg.id === oppfolging.fasit)?.klokke).toBe(15 * 60 + 30);
    const ferdig = utfor(etter, { slag: "svar", svar: oppfolging?.fasit ?? "" });
    expect(ferdig.melding).toBe("Vent til 15:30. Butikken åpner.");
    expect(ferdig.lagret.aktivDag?.dorLest).toBe(true);
    expect(nesteSteg(ferdig.lagret).knapp).toBe("Vent til 15:30 · butikken åpner");
  });

  it("sender ikke barnet til en stengt butikk bare for å lese skiltet", () => {
    const inne = butikkDag(14 * 60 + 30);
    const dag = inne.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const hjemme = { ...inne, aktivDag: { ...dag, sted: "hjemme" as const } };
    const steg = nesteSteg(hjemme);
    expect(steg.grunn.toLowerCase()).not.toContain("les skiltet");
    if (steg.handling.slag === "gaa") expect(steg.handling.sted).not.toBe("butikk");
  });

  it("bruker spillets klokke og dagens plan i butikkoppgaven", () => {
    const lagret = butikkDag(17 * 60 + 15);
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    // Variant 1 bruker spillets klokke (gj. 10, 7.4).
    const apen1 = MALER.find((mal) => mal.id === "apen-1");
    if (!apen1) throw new Error("mangler apen-1");
    const oppgave = lagFraMal(apen1, {
      tilfeldig: froTilfeldig(4),
      spraak: "nb",
      nivaa: "forste",
      mestring: {},
      plan: dag.plan,
      unngaMal: [],
      unngaNokkel: "",
      naa: 17 * 60 + 15,
    });
    expect(oppgave.prompt).toContain("kvart over fem");
    expect(oppgave.skilt?.apner).toBe(14 * 60);
    expect(oppgave.skilt?.stenger).toBe(17 * 60 + 30);
    expect(oppgave.skilt?.naa).toBe(17 * 60 + 15);
    expect(oppgave.maalKlokke).toBe(14 * 60);
    expect(oppgave.tall).toBe(17 * 60 + 30);
    expect(oppgave.fasit).toBe("ja");
    const tekst = forklaring(oppgave, "nei", "nb", 2);
    expect(tekst).toContain("17:30");
    expect(tekst).not.toContain("18:00");
  });
});
