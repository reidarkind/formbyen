import { describe, expect, it } from "vitest";
import { ALLE_2D } from "../former/definisjoner";
import { klokke } from "../tid/tid";
import { galleriKort } from "./galleri";
import { kvadratPunkter, regulær, retteVinkler, sideLengder } from "./geometri";
import { tegnBygg, tegnKart } from "./bygg-svg";
import { urskive, viserPunkter, viserRetning } from "./klokke";
import { erIPalett } from "./stil";
import { fargerI, harForbudt, svgDokument } from "./svg";
import { timeviserVinkel, minuttviserVinkel } from "../tid/tid";
import { standardLagret } from "../lagring/lagring";

function sjekksum(tekst: string): string {
  let hash = 5381;
  for (let i = 0; i < tekst.length; i++) hash = Math.imul(hash, 33) ^ tekst.charCodeAt(i);
  return (hash >>> 0).toString(16);
}

describe("grafikk", () => {
  it("gir hver svg bredde og høyde", () => {
    const ikon = svgDokument("<circle/>", 24, 24, 0, 0, "ikon-m");
    expect(ikon).toContain('width="24"');
    expect(ikon).toContain('height="24"');
    expect(ikon).toContain('class="ikon-m"');
    for (const kort of galleriKort()) {
      expect(kort.svg, kort.tittel).toMatch(/<svg\b[^>]*\swidth="\d+"/);
      expect(kort.svg, kort.tittel).toMatch(/<svg\b[^>]*\sheight="\d+"/);
    }
  });

  it("holder seg til paletten og har verken gradient, filter eller tekst", () => {
    const rom = new Set(["kule", "sylinder", "kjegle"]);
    for (const kort of galleriKort()) {
      if (rom.has(kort.tittel)) {
        expect(kort.svg, kort.tittel).toMatch(/radialGradient|linearGradient/);
        expect(/<filter|<text|#000/i.test(kort.svg), kort.tittel).toBe(false);
      } else {
        expect(harForbudt(kort.svg), kort.tittel).toBe(false);
      }
      for (const farge of fargerI(kort.svg)) expect(erIPalett(farge), `${kort.tittel} ${farge}`).toBe(true);
      for (const bredde of kort.svg.matchAll(/stroke-width="(\d+(?:\.\d+)?)"/g)) {
        const verdi = Number(bredde[1]);
        const ramme = kort.svg.includes('data-ramme="ur"') && verdi === 6;
        expect(verdi === 2 || verdi === 3 || ramme, `${kort.tittel} ${verdi}`).toBe(true);
      }
    }
  });

  it("tegner kvadrat og mangekant presist", () => {
    const kv = kvadratPunkter(0, 0, 10);
    expect(new Set(sideLengder(kv).map((side) => side.toFixed(3))).size).toBe(1);
    expect(retteVinkler(kv)).toBe(4);
    for (const n of [3, 5, 6]) {
      const sider = sideLengder(regulær(n, 0, 0, 10));
      expect(Math.max(...sider) - Math.min(...sider)).toBeLessThan(0.001);
    }
    expect(ALLE_2D.length).toBe(8);
    expect(harForbudt(tegnBygg("ronne"))).toBe(false);
  });

  it("legger viserne rett for halv tre og alle 288 fem-minutter", () => {
    for (let time = 0; time < 24; time++) {
      for (let m = 0; m < 60; m += 5) {
        const verdi = klokke(time, m);
        const timeVinkel = viserRetning(viserPunkter(120, 120, 48, 10, timeviserVinkel(verdi)));
        const minuttVinkel = viserRetning(viserPunkter(120, 120, 77, 6, minuttviserVinkel(verdi)));
        expect(Math.abs(timeVinkel - timeviserVinkel(verdi))).toBeLessThan(0.6);
        expect(Math.abs(minuttVinkel - minuttviserVinkel(verdi))).toBeLessThan(0.6);
      }
    }
    expect(timeviserVinkel(klokke(2, 30))).toBe(75);
    expect(harForbudt(urskive(klokke(14, 30)))).toBe(false);
  });

  it("låser referansene rønne, byggmester, urskive og ikon", () => {
    const referanser = galleriKort().filter((kort) => kort.referanse);
    const samlet = referanser.map((kort) => `${kort.tittel}:${sjekksum(kort.svg)}`).join("|");
    expect(samlet).toBe(
      "Rønne:dcc82c11|Byggmester:876f2de4|Urskive:7d8036a7|Ikon:8ebcac2c",
    );
    expect(tegnKart(standardLagret().by, 12 * 60).includes("svg")).toBe(true);
  });
});
