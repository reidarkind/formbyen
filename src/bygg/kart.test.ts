import { describe, expect, it } from "vitest";
import { BYGG } from "./katalog";
import { byggSomKanStartes, kanPlassere, kravOppfylt, lesRute, ruteNavn, tomterMedPlass } from "./kart";
import type { ByTilstand } from "../typer";

function tomBy(over: Partial<ByTilstand> = {}): ByTilstand {
  return {
    nivaa: 1,
    bygg: [
      {
        instans: "hjem",
        bygg: "ronne",
        x: 2,
        y: 2,
        steg: 4,
        ferdig: true,
        uthus: false,
        frie: [],
        pynt: [],
      },
    ],
    rotasjon: 0,
    skala: 1,
    panX: 0,
    panY: 0,
    monsterFullfort: 0,
    kjente3d: [],
    besteKlokkePaRad: 0,
    klokkePaRad: 0,
    dagerAlleAvtaler: 0,
    omrader: ["dalen"],
    ...over,
  };
}

describe("bykart", () => {
  it("gir C4 som tredje bokstav og fjerde rad", () => {
    expect(ruteNavn(2, 3)).toBe("C4");
    expect(lesRute("C4")).toEqual({ x: 2, y: 3 });
    expect(lesRute("c4")).toEqual({ x: 2, y: 3 });
  });

  it("krever en tomt som ikke ligger oppå rønna", () => {
    const by = tomBy();
    expect(kanPlassere(by, "bronn", 2, 2)).toBe(false);
    expect(kanPlassere(by, "bronn", 4, 4)).toBe(true);
    expect(kanPlassere(by, "bro", 4, 4)).toBe(false);
    expect(kanPlassere({ ...by, nivaa: 2, omrader: ["dalen", "bekken"] }, "bro", 8, 2)).toBe(true);
  });

  it("har oppskrifter på 3 til 8 steg og låser opp neste hjem når kravet er møtt", () => {
    for (const def of Object.values(BYGG)) {
      expect(def.oppskrift.length).toBeGreaterThanOrEqual(3);
      expect(def.oppskrift.length).toBeLessThanOrEqual(8);
    }
    const by = tomBy();
    expect(kravOppfylt(by)).toBe(false);
    expect(byggSomKanStartes(by)).toEqual(expect.arrayContaining(["bronn", "gjerde", "vedskjul"]));
    const tre = tomBy({
      bygg: [
        ...tomBy().bygg,
        { instans: "a", bygg: "bronn", x: 4, y: 4, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] },
        { instans: "b", bygg: "gjerde", x: 5, y: 5, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] },
      ],
    });
    expect(kravOppfylt(tre)).toBe(true);
    const store = tomterMedPlass(tomBy({ nivaa: 6, omrader: ["dalen", "bekken", "asen", "havna"] }), 6);
    expect(store.some((tomt) => tomt.areal >= 6)).toBe(true);
  });
});
