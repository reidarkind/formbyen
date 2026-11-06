import { describe, expect, it } from "vitest";
import { draMinutt, gripViser, settMedVinkel, vinkelFra, vinkelSteg } from "./urInput";

describe("urInput (gj. 10, C1)", () => {
  it("gir vinkelen med klokka fra tolv", () => {
    expect(vinkelFra(0, -10)).toBeCloseTo(0);
    expect(vinkelFra(10, 0)).toBeCloseTo(90);
    expect(vinkelFra(0, 10)).toBeCloseTo(180);
    expect(vinkelFra(-10, 0)).toBeCloseTo(270);
  });

  it("stiller timeviseren på tallet som trykkes, og beholder minuttene og døgnhalvdelen", () => {
    for (let tall = 1; tall <= 12; tall++) {
      const ut = settMedVinkel(14 * 60 + 15, tall * 30, "time", 15);
      expect(Math.floor(ut / 60) % 12).toBe(tall % 12);
      expect(ut % 60).toBe(15);
      expect(ut >= 12 * 60).toBe(true);
    }
    expect(settMedVinkel(9 * 60, 12 * 30 - 4, "time", 15)).toBe(0);
  });

  it("stiller minuttviseren på nærmeste trinn for nivået", () => {
    for (let tall = 0; tall < 12; tall++) expect(settMedVinkel(14 * 60, tall * 30, "minutt", 5) % 60).toBe((tall * 5) % 60);
    expect(settMedVinkel(14 * 60, 100, "minutt", 15) % 60).toBe(15);
    expect(settMedVinkel(14 * 60, 160, "minutt", 30) % 60).toBe(30);
    expect(settMedVinkel(14 * 60, 350, "minutt", 30)).toBe(14 * 60);
  });

  it("flytter timen når minuttviseren dras forbi tolv, på alle nivåer", () => {
    expect(vinkelSteg(350, 10)).toBe(20);
    expect(vinkelSteg(10, 350)).toBe(-20);
    expect(draMinutt(14 * 60 + 55, 330, 30, 5)).toBe(15 * 60);
    expect(draMinutt(15 * 60, 0, -30, 5)).toBe(14 * 60 + 55);
    expect(draMinutt(23 * 60 + 55, 330, 30, 5)).toBe(0);
    expect(draMinutt(14 * 60 + 30, 180, 180, 30)).toBe(15 * 60);
    expect(draMinutt(14 * 60, 0, 360, 15)).toBe(15 * 60);
    // Et trykk (ikke dra) flytter ikke timen.
    expect(settMedVinkel(14 * 60 + 55, 0, "minutt", 5)).toBe(14 * 60);
  });

  it("finner viseren barnet tar tak i", () => {
    const tid = 3 * 60; // timeviser mot 3 (90°), minuttviser mot 12 (0°)
    expect(gripViser(tid, 2, 0.8)).toBe("minutt");
    expect(gripViser(tid, 88, 0.4)).toBe("time");
    expect(gripViser(tid, 200, 0.6)).toBeNull();
    expect(gripViser(tid, 88, 0.95)).toBeNull();
  });
});
