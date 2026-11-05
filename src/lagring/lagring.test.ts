import { describe, expect, it } from "vitest";
import { eksporter, importer, lesLagring, minneLager, normaliserLagret, skrivLagring } from "./lagring";

describe("lagring", () => {
  it("beholder byggverk når et gammelt lager mangler nye felt", () => {
    const gammelt = {
      versjon: 1,
      by: {
        bygg: [{ instans: "hjem-1", bygg: "ronne", x: 2, y: 4, steg: 4, ferdig: true, uthus: false, frie: [], pynt: ["pynt-blomst"] }],
      },
    };
    const lest = normaliserLagret(gammelt);
    expect(lest?.by.bygg).toHaveLength(1);
    expect(lest?.by.bygg[0]?.pynt).toEqual(["pynt-blomst"]);
    expect(lest?.mynter).toBe(0);
    const lager = minneLager();
    if (!lest) throw new Error("mangler");
    skrivLagring(lager, { ...lest, album: Array.from({ length: 40 }, () => ({ nivaa: 1, svg: "x".repeat(80_000) })) });
    const igjen = lesLagring(lager);
    expect(igjen.by.bygg[0]?.instans).toBe("hjem-1");
    expect(JSON.stringify(igjen).length).toBeLessThanOrEqual(1_500_000);
  });

  it("kan eksporteres og importeres", () => {
    const lager = minneLager();
    const lagret = lesLagring(lager);
    lagret.mynter = 4;
    const tekst = eksporter(lagret);
    expect(importer("ikke json")).toBeNull();
    expect(importer(tekst)?.mynter).toBe(4);
    expect(importer(tekst)?.by.bygg[0]?.bygg).toBe("ronne");
  });
});
