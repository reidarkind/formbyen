import { describe, expect, it } from "vitest";
import { SKOLEFAG, visNavn } from "./aktiviteter";
import { harReeltValg, lagDagsplan, lagStartRytme, nesteDato, STARTDATO, ukedagFor, utvidRytme } from "./plan";

function grunn(over: Partial<Parameters<typeof lagDagsplan>[0]> = {}) {
  return {
    fro: 1,
    dato: STARTDATO,
    nivaa: "andre" as const,
    spraak: "nb" as const,
    ferdige: [] as const,
    ukerytme: lagStartRytme(),
    fasteAvtaler: [],
    siste: [],
    bursdager: [],
    ...over,
  };
}

describe("kalender", () => {
  it("starter skoleåret på en mandag", () => {
    expect(ukedagFor(STARTDATO)).toBe("mandag");
    expect(ukedagFor({ aar: 2026, maned: 5, dag: 17 })).toBe("sondag");
  });
});

describe("dagsplan", () => {
  it("lager minst 90 ulike planer på 100 dager", () => {
    const nokler = new Set<string>();
    let dato = STARTDATO;
    const siste: string[] = [];
    for (let i = 0; i < 100; i++) {
      const plan = lagDagsplan(grunn({ fro: 1000 + i, dato, siste }));
      expect(siste).not.toContain(plan.nokkel);
      siste.push(plan.nokkel);
      if (siste.length > 7) siste.shift();
      nokler.add(plan.nokkel);
      const tider = plan.avtaler.map((avtale) => avtale.start);
      const sortert = [...tider].sort((a, b) => a - b);
      expect(tider).toEqual(sortert);
      expect(harReeltValg(plan)).toBe(true);
      const opptatt = plan.avtaler.filter((avtale) => avtale.varighet > 0);
      expect(opptatt.length).toBeGreaterThanOrEqual(2);
      expect(opptatt.length).toBeLessThanOrEqual(4);
      for (let j = 1; j < opptatt.length; j++) {
        const forrige = opptatt[j - 1];
        const denne = opptatt[j];
        if (forrige && denne) expect(denne.start).toBeGreaterThanOrEqual(forrige.start + forrige.varighet);
      }
      dato = nesteDato(dato);
    }
    expect(nokler.size).toBeGreaterThanOrEqual(90);
  });

  it("stenger butikken på søndag og holder tidene inne på nivået", () => {
    const sondag = lagDagsplan(grunn({ dato: { aar: 2026, maned: 8, dag: 23 }, nivaa: "forste", fro: 4 }));
    expect(ukedagFor(sondag.dato)).toBe("sondag");
    expect(sondag.butikk.stengtHele).toBe(true);
    expect(sondag.skoleslutt).toBeNull();
    const forste = lagDagsplan(grunn({ nivaa: "forste", fro: 8 }));
    const tider = [forste.start, forste.leggetid, ...forste.avtaler.map((avtale) => avtale.start)];
    for (const tid of tider) expect(tid % 30).toBe(0);
    expect(forste.avtaler.some((avtale) => avtale.start % 60 === 15)).toBe(false);
  });

  it("gir tid til å gå mellom to steder", () => {
    let dato = STARTDATO;
    for (let i = 0; i < 40; i++) {
      const plan = lagDagsplan(grunn({ fro: 700 + i, dato, nivaa: "forste" }));
      const opptatt = plan.avtaler.filter((avtale) => avtale.varighet > 0);
      for (let j = 1; j < opptatt.length; j++) {
        const fra = opptatt[j - 1];
        const til = opptatt[j];
        if (!fra || !til || fra.sted === til.sted) continue;
        expect(til.start - (fra.start + fra.varighet)).toBeGreaterThanOrEqual(30);
      }
      if (plan.sfo !== null) {
        for (const avtale of opptatt) {
          const overlap = avtale.start < plan.sfo + 60 && plan.sfo < avtale.start + avtale.varighet;
          expect(overlap).toBe(false);
        }
      }
      dato = nesteDato(dato);
    }
  });

  it("legger ikke en aktivitet i den første timen etter skolen", () => {
    let dato = STARTDATO;
    for (let i = 0; i < 30; i++) {
      const plan = lagDagsplan(grunn({ fro: 400 + i, dato, nivaa: "forste" }));
      expect(plan.avtaler.some((avtale) => avtale.id === "sfo")).toBe(false);
      if (plan.skoleslutt !== null) {
        const tidligst = plan.sfo ?? plan.start + 90;
        for (const avtale of plan.avtaler) {
          if (avtale.slag === "middag" || avtale.varighet <= 0) continue;
          expect(avtale.start).toBeGreaterThanOrEqual(tidligst);
        }
      }
      dato = nesteDato(dato);
    }
  });

  it("holder korps på tirsdag når rytmen sier det og lokalet er bygd", () => {
    const plan = lagDagsplan(
      grunn({
        fro: 2,
        dato: { aar: 2026, maned: 8, dag: 18 },
        ferdige: ["korpslokale"],
        fasteAvtaler: [{ aktivitet: "korps", ukedag: "tirsdag", start: 18 * 60 }],
      }),
    );
    expect(plan.ukedag).toBe("tirsdag");
    expect(plan.avtaler.some((avtale) => avtale.aktivitet === "korps" && avtale.start === 18 * 60)).toBe(true);
  });

  it("gir svømming, tannlege og torget et sted, og lagrer navn som id", () => {
    const sett = new Set<string>();
    let dato = STARTDATO;
    for (let i = 0; i < 80; i++) {
      const plan = lagDagsplan(grunn({ fro: 900 + i, dato, spraak: "en" }));
      if (plan.sisteTime) {
        expect(SKOLEFAG).toContain(plan.sisteTime);
        expect(visNavn(plan.sisteTime, "nn")).not.toMatch(/PE|English|math/);
      }
      for (const avtale of plan.avtaler) {
        sett.add(avtale.aktivitet ?? avtale.navn);
        expect(avtale.navn).not.toMatch(/Homework|Dinner|Swimming|Dentist|Delivery|Dance|Scouts/);
        const vist = visNavn(avtale.aktivitet ?? avtale.navn, "nn");
        expect(vist).not.toMatch(/Homework|Dinner|Swimming|Dentist|Delivery/);
        if (avtale.aktivitet === "svomming") expect(avtale.sted).toBe("svommehall");
        if (avtale.aktivitet === "tannlege") expect(avtale.sted).toBe("tannlege");
        if (avtale.aktivitet === "lekser" || avtale.aktivitet === "hund") expect(avtale.sted).toBe("hjemme");
        if (avtale.aktivitet === "dans" || avtale.aktivitet === "sjakk" || avtale.aktivitet === "speider") expect(avtale.sted).toBe("torg");
      }
      dato = nesteDato(dato);
    }
    expect(sett.has("svomming")).toBe(true);
    expect(sett.has("tannlege")).toBe(true);
  });

  it("legger til en ny fast avtale når et bygg åpner", () => {
    const utvidet = utvidRytme(lagStartRytme(), ["idrettshall"], 3);
    expect(utvidet.length).toBe(3);
    expect(utvidet.some((rad) => rad.aktivitet === "fotball" || rad.aktivitet === "handball" || rad.aktivitet === "turn")).toBe(
      true,
    );
  });
});
