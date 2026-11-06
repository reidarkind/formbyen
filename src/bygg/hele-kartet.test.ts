import { describe, expect, it } from "vitest";
import { standardLagret } from "../lagring/lagring";
import { tegnKart } from "../grafikk/bygg-svg";
import { kartUtsnitt } from "./kart";
import type { ByTilstand } from "../typer";

function by(nivaa: number, omrader: ByTilstand["omrader"], uferdig?: { x: number; y: number }): ByTilstand {
  const grunn = standardLagret().by;
  const bygg = [...grunn.bygg, { instans: "b", bygg: "bronn" as const, x: 4, y: 4, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] }];
  if (uferdig) bygg.push({ instans: "u", bygg: "villa" as const, x: uferdig.x, y: uferdig.y, steg: 1, ferdig: false, uthus: false, frie: [], pynt: [] });
  return { ...grunn, nivaa, omrader, bygg };
}

describe("hele byen på kartet (gj. 9, B3)", () => {
  it("viser alltid butikk, torg, tårn og pyntebu, også fra bynivå 3", () => {
    for (const tilstand of [by(1, ["dalen"]), by(3, ["dalen", "bekken", "asen"], { x: 1, y: 9 }), by(5, ["dalen", "bekken", "asen", "havna"], { x: 9, y: 9 })]) {
      const svg = tegnKart(tilstand, 15 * 60);
      for (const sted of ["butikk", "torg", "taarn", "pynt", "tannlege", "svommehall", "barnehage", "hjemme"]) {
        expect(svg, `${sted} nivå ${tilstand.nivaa}`).toContain(`data-sted="${sted}"`);
      }
      const ramme = kartUtsnitt(tilstand);
      expect(ramme.x0).toBe(0);
      expect(ramme.y0).toBe(0);
    }
  });

  it("gir navneskilt som kan trykkes, også for pyntebua og tårnet", () => {
    const svg = tegnKart(by(1, ["dalen"]), 15 * 60, 20 * 60, { navn: { pynt: "Pyntebu", taarn: "Tårnet", butikk: "Butikken" } });
    expect(svg).toMatch(/class="skilt[^"]*"[^>]*data-sted="pynt"[^>]*>Pyntebu/);
    expect(svg).toMatch(/data-sted="taarn"[^>]*>Tårnet/);
    expect(svg).toMatch(/data-sted="butikk"[^>]*>Butikken/);
  });

  it("har en trykkflate på minst en hel rute rundt hvert sted", () => {
    const svg = tegnKart(by(1, ["dalen"]), 15 * 60);
    expect(svg).toMatch(/<g data-sted="butikk"[^>]*><rect class="treff"/);
  });
});
