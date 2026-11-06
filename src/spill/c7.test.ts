import { describe, expect, it } from "vitest";
import { nesteDato, STARTDATO, ukedagFor } from "../dag/plan";
import { normaliserLagret, standardLagret } from "../lagring/lagring";
import type { Lagret } from "../typer";
import { utfor } from "./okt";
import { spillDag } from "./testbot";

/** Mindre feil fra gjennomgang 10, kapittel 7. */

function start(over: Partial<Lagret> = {}): Lagret {
  const grunn = standardLagret();
  return utfor({ ...grunn, fro: 3, dato: STARTDATO, startet: true, ...over }, { slag: "start" }).lagret;
}

describe("faste avtaler (gj. 10, 7.1.3, 7.1.4 og 7.1.6)", () => {
  it("kommer med allerede i morgen når den voksne legger dem til midt i en dag", () => {
    let lagret = start();
    const iMorgen = ukedagFor(nesteDato(lagret.dato));
    lagret = utfor(lagret, { slag: "faste-avtaler", liste: [{ aktivitet: "hund", ukedag: iMorgen, start: 18 * 60 }] }).lagret;
    expect(lagret.aktivDag?.morgen?.[0]?.avtaler.some((avtale) => avtale.aktivitet === "hund" && avtale.start === 18 * 60)).toBe(true);
    lagret = spillDag(lagret).lagret;
    if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
    lagret = utfor(lagret, { slag: "start" }).lagret;
    expect(lagret.aktivDag?.plan.avtaler.some((avtale) => avtale.aktivitet === "hund" && avtale.start === 18 * 60)).toBe(true);
  });

  it("legger ikke inn samme avtale to ganger", () => {
    let lagret = start();
    const fast = { aktivitet: "hund", ukedag: "tirsdag" as const, start: 18 * 60 };
    lagret = utfor(lagret, { slag: "faste-avtaler", liste: [fast, fast, { ...fast, start: 17 * 60 }] }).lagret;
    expect(lagret.innstillinger.fasteAvtaler).toEqual([{ ...fast, start: 17 * 60 }]);
  });

  it("beholder resten av ukerytmen når en fast avtale legges til", () => {
    let lagret = start();
    const rytme = lagret.ukerytme.length;
    lagret = utfor(lagret, { slag: "faste-avtaler", liste: [{ aktivitet: "hund", ukedag: "tirsdag", start: 18 * 60 }] }).lagret;
    // Planene for dagene uten fast avtale har fortsatt avtaler fra rytmen.
    let med = 0;
    for (let dag = 0; dag < 7; dag++) {
      if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      lagret = utfor(lagret, { slag: "start" }).lagret;
      const ukedag = lagret.aktivDag?.plan.ukedag;
      if (ukedag === "tirsdag") continue;
      const fraRytme = lagret.ukerytme.filter((rad) => rad.ukedag === ukedag).map((rad) => rad.aktivitet);
      if (lagret.aktivDag?.plan.avtaler.some((avtale) => fraRytme.includes(avtale.aktivitet ?? ""))) med += 1;
    }
    expect(rytme).toBeGreaterThan(0);
    expect(med).toBeGreaterThan(0);
  });
});

describe("import med urimelige verdier (gj. 10, 7.1.5)", () => {
  it("begrenser mynter, plassering og steg", () => {
    const grunn = standardLagret();
    const raa = JSON.parse(JSON.stringify({ ...grunn, mynter: 1e9, by: { ...grunn.by, bygg: [{ ...grunn.by.bygg[0], x: 99, y: -4, steg: 999 }] } }));
    const lest = normaliserLagret(raa);
    expect(lest?.mynter).toBeLessThanOrEqual(9999);
    const bygg = lest?.by.bygg[0];
    expect(bygg?.x).toBeLessThanOrEqual(11);
    expect(bygg?.y).toBeGreaterThanOrEqual(0);
    expect(bygg?.steg).toBeLessThanOrEqual(10);
  });
});

describe("klokkeleken fra menyen (gj. 10, 7.1.12)", () => {
  it("gir én mynt og sier det", () => {
    const lagret = { ...standardLagret(), startet: true, mynter: 2 };
    const ut = utfor(lagret, { slag: "ur-runde", riktige: 5 });
    expect(ut.lagret.mynter).toBe(3);
    expect(ut.melding).toBe("Riktig! Du fikk 1 mynt.");
  });
});
