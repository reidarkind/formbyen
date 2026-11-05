import { describe, expect, it } from "vitest";
import { BYGG } from "../bygg/katalog";
import type { ByggId } from "../typer";
import { fasadeSvg } from "./fasade";

describe("fasade", () => {
  it("holder alle deler innenfor 100 ganger 120", () => {
    for (const id of Object.keys(BYGG) as ByggId[]) {
      const steg = BYGG[id].oppskrift.length;
      for (let i = 0; i <= steg; i++) {
        const svg = fasadeSvg(id, i);
        for (const treff of svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)) {
          const x = Number(treff[1]);
          const y = Number(treff[2]);
          const b = Number(treff[3]);
          const h = Number(treff[4]);
          expect(x, `${id} ${i}`).toBeGreaterThanOrEqual(0);
          expect(y, `${id} ${i}`).toBeGreaterThanOrEqual(0);
          expect(x + b, `${id} ${i}`).toBeLessThanOrEqual(100.1);
          expect(y + h, `${id} ${i}`).toBeLessThanOrEqual(120.1);
        }
        for (const treff of svg.matchAll(/points="([^"]+)"/g)) {
          const tall = treff[1]?.split(/[,\s]+/).map(Number) ?? [];
          for (let p = 0; p < tall.length; p += 2) {
            expect(tall[p], `${id} x`).toBeGreaterThanOrEqual(0);
            expect(tall[p], `${id} x`).toBeLessThanOrEqual(100.1);
            expect(tall[p + 1], `${id} y`).toBeGreaterThanOrEqual(0);
            expect(tall[p + 1], `${id} y`).toBeLessThanOrEqual(120.1);
          }
        }
      }
    }
  });
});
