import { describe, expect, it } from "vitest";
import { nesteDato, STARTDATO } from "./plan";
import { harReeltValg, lagDagsplan, lagStartRytme, ukedagFor, utvidRytme } from "./plan";

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

  it("legger til en ny fast avtale når et bygg åpner", () => {
    const utvidet = utvidRytme(lagStartRytme(), ["idrettshall"], 3);
    expect(utvidet.length).toBe(3);
    expect(utvidet.some((rad) => rad.aktivitet === "fotball" || rad.aktivitet === "handball" || rad.aktivitet === "turn")).toBe(
      true,
    );
  });
});
