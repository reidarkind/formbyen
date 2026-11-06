import { describe, expect, it } from "vitest";
import { ALLE_2D, type Form2dId } from "../former/definisjoner";
import { omrissForForm } from "./omriss";
import { vurderTegning, type Raster } from "./vurder";

function stempel(maal: Raster, cx: number, cy: number, radius: number): void {
  const r2 = radius * radius;
  for (let y = Math.max(0, cy - radius); y <= Math.min(maal.hoyde - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(maal.bredde - 1, cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) maal.maske[y * maal.bredde + x] = true;
    }
  }
}

describe("tegning av former", () => {
  it("godtar omrisset og avviser en prikk i hjørnet", () => {
    const former: Form2dId[] = ["sirkel", "trekant", "kvadrat", "rektangel", "femkant", "sekskant"];
    for (const form of former) {
      const omriss = omrissForForm(form);
      expect(omriss.maske.some(Boolean)).toBe(true);
      expect(vurderTegning(omriss, omriss)).toBe(true);
      const prikk = { ...omriss, maske: omriss.maske.map(() => false) };
      prikk.maske[0] = true;
      expect(vurderTegning(prikk, omriss)).toBe(false);
    }
  });

  it("godtar en pensel som følger hver form, og avviser en krusedull", () => {
    for (const form of ALLE_2D) {
      const omriss = omrissForForm(form, 120, 120);
      const strek: Raster = { bredde: 120, hoyde: 120, maske: Array.from({ length: 120 * 120 }, () => false) };
      omriss.maske.forEach((pa, indeks) => {
        if (pa) stempel(strek, indeks % 120, Math.floor(indeks / 120), 6);
      });
      expect(vurderTegning(strek, omriss), form).toBe(true);
    }
    const kvadrat = omrissForForm("kvadrat", 120, 120);
    const kruss: Raster = { bredde: 120, hoyde: 120, maske: Array.from({ length: 120 * 120 }, () => false) };
    stempel(kruss, 2, 2, 6);
    expect(vurderTegning(kruss, kvadrat)).toBe(false);
  });
});

describe("prikker i stedet for omriss (gj. 10, 7.3.2)", () => {
  it("gir hjørnene til mangekanter og fire punkter på runde former", async () => {
    const { hjornerForForm } = await import("./omriss");
    expect(hjornerForForm("trekant", 240, 240)).toHaveLength(3);
    expect(hjornerForForm("kvadrat", 240, 240)).toHaveLength(4);
    expect(hjornerForForm("sekskant", 240, 240)).toHaveLength(6);
    expect(hjornerForForm("sirkel", 240, 240)).toHaveLength(4);
    for (const [x, y] of hjornerForForm("rektangel", 240, 240)) {
      expect(x).toBeGreaterThan(0);
      expect(y).toBeLessThan(240);
    }
  });
});
