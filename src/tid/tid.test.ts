import { describe, expect, it } from "vitest";
import { SPRAAK } from "../typer";
import {
  dogn,
  erApen,
  erHalvFelle,
  himmel,
  klokke,
  minutterMellom,
  minuttviserVinkel,
  tidTilDigital12,
  tidTilDigital24,
  tidTilOrd,
  timeviserVinkel,
} from "./tid";
import { halvveisTekst } from "./ord";

const NAVN = ["tolv", "ett", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti", "elleve"];

function forventetOrd(minutter: number): string {
  const time = Math.floor(minutter / 60) % 24;
  const m = minutter % 60;
  const denne = NAVN[time % 12] ?? "";
  const neste = NAVN[(time + 1) % 12] ?? "";
  const tabell: Record<number, string> = {
    0: denne,
    5: `fem over ${denne}`,
    10: `ti over ${denne}`,
    15: `kvart over ${denne}`,
    20: `ti på halv ${neste}`,
    25: `fem på halv ${neste}`,
    30: `halv ${neste}`,
    35: `fem over halv ${neste}`,
    40: `ti over halv ${neste}`,
    45: `kvart på ${neste}`,
    50: `ti på ${neste}`,
    55: `fem på ${neste}`,
  };
  return tabell[m] ?? "";
}

describe("tidTilOrd", () => {
  it("dekker alle 288 fem-minutter, likt for 12- og 24-timers", () => {
    const sett = new Set<string>();
    for (let time = 0; time < 24; time++) {
      for (let m = 0; m < 60; m += 5) {
        const verdi = time * 60 + m;
        const ord = tidTilOrd(verdi);
        expect(ord).toBe(forventetOrd(verdi));
        expect(tidTilOrd(verdi + 24 * 60)).toBe(ord);
        sett.add(tidTilDigital24(verdi));
      }
    }
    expect(sett.size).toBe(288);
  });

  it("har de norske fellene riktig", () => {
    expect(tidTilOrd(klokke(2, 30))).toBe("halv tre");
    expect(tidTilOrd(klokke(14, 30))).toBe("halv tre");
    expect(tidTilOrd(klokke(3, 30))).toBe("halv fire");
    expect(tidTilOrd(klokke(4, 45))).toBe("kvart på fem");
    expect(tidTilOrd(klokke(6, 15))).toBe("kvart over seks");
    expect(tidTilOrd(klokke(2, 25))).toBe("fem på halv tre");
    expect(tidTilOrd(klokke(2, 35))).toBe("fem over halv tre");
    expect(tidTilOrd(klokke(2, 20))).toBe("ti på halv tre");
    expect(tidTilOrd(klokke(2, 40))).toBe("ti over halv tre");
    expect(tidTilOrd(klokke(2, 50))).toBe("ti på tre");
    expect(tidTilOrd(klokke(2, 55))).toBe("fem på tre");
    expect(tidTilOrd(klokke(1, 0))).toBe("ett");
    expect(tidTilOrd(klokke(13, 5))).toBe("fem over ett");
    expect(tidTilOrd(klokke(0, 30))).toBe("halv ett");
    expect(tidTilOrd(klokke(12, 30))).toBe("halv ett");
    expect(tidTilOrd(klokke(23, 55))).toBe("fem på tolv");
    expect(erHalvFelle(klokke(2, 30), klokke(3, 30))).toBe(true);
    expect(erHalvFelle(klokke(2, 30), klokke(2, 30))).toBe(false);
  });

  it("sier halv mot neste time på norsk, svensk, dansk og tysk", () => {
    for (const spraak of ["nb", "nn"] as const) {
      expect(tidTilOrd(klokke(13, 30), spraak)).toBe("halv to");
      expect(tidTilOrd(klokke(14, 30), spraak)).toBe("halv tre");
    }
    expect(tidTilOrd(klokke(13, 30), "sv")).toBe("halv två");
    expect(tidTilOrd(klokke(14, 30), "sv")).toBe("halv tre");
    expect(tidTilOrd(klokke(14, 20), "sv")).toBe("tjugo över två");
    expect(tidTilOrd(klokke(13, 30), "da")).toBe("halv to");
    expect(tidTilOrd(klokke(14, 30), "da")).toBe("halv tre");
    expect(tidTilOrd(klokke(14, 20), "da")).toBe("ti i halv tre");
    expect(tidTilOrd(klokke(13, 30), "de")).toBe("halb zwei");
    expect(tidTilOrd(klokke(14, 30), "de")).toBe("halb drei");
    expect(tidTilOrd(klokke(14, 15), "de")).toBe("viertel nach zwei");
    expect(tidTilOrd(klokke(14, 45), "de")).toBe("viertel vor drei");
  });

  it("sier halv etter timen som har vært på engelsk, spansk, portugisisk og fransk", () => {
    expect(tidTilOrd(klokke(13, 30), "en")).toBe("half past one");
    expect(tidTilOrd(klokke(14, 30), "en")).toBe("half past two");
    expect(tidTilOrd(klokke(14, 45), "en")).toBe("quarter to three");
    expect(tidTilOrd(klokke(13, 30), "es")).toBe("la una y media");
    expect(tidTilOrd(klokke(14, 30), "es")).toBe("las dos y media");
    expect(tidTilOrd(klokke(14, 15), "es")).toBe("las dos y cuarto");
    expect(tidTilOrd(klokke(13, 30), "pt")).toBe("uma e meia");
    expect(tidTilOrd(klokke(14, 30), "pt")).toBe("duas e meia");
    expect(tidTilOrd(klokke(14, 45), "pt")).toBe("três menos um quarto");
    expect(tidTilOrd(klokke(13, 30), "fr")).toBe("une heure et demie");
    expect(tidTilOrd(klokke(14, 30), "fr")).toBe("deux heures et demie");
    expect(tidTilOrd(klokke(14, 45), "fr")).toBe("trois heures moins le quart");
    expect(tidTilOrd(klokke(0, 30), "fr")).toBe("minuit et demi");
    expect(tidTilOrd(klokke(12, 30), "fr")).toBe("midi et demi");
    expect(tidTilOrd(klokke(0, 30), "pt")).toBe("meia-noite e meia");
    expect(tidTilOrd(klokke(12, 30), "pt")).toBe("meio-dia e meia");
    expect(tidTilOrd(klokke(0, 30), "es")).toBe("medianoche y media");
    expect(tidTilOrd(klokke(12, 30), "es")).toBe("mediodía y media");
  });

  it("bruker samme ord for 02:30 og 14:30, og forklarer halv på landets vis", () => {
    for (const spraak of SPRAAK) {
      expect(tidTilOrd(klokke(2, 30), spraak)).toBe(tidTilOrd(klokke(14, 30), spraak));
      expect(tidTilOrd(klokke(14, 30), spraak).length).toBeGreaterThan(0);
    }
    expect(halvveisTekst(klokke(14, 30), "nb")).toBe("Halv tre er halvveis til tre. Det er 14:30.");
    expect(halvveisTekst(klokke(14, 30), "en")).toBe("Half past two is thirty minutes after two. It is 14:30.");
    expect(halvveisTekst(klokke(14, 30), "pt")).toBe("Duas e meia é trinta minutos depois de duas. Digital: 14:30.");
    expect(halvveisTekst(klokke(13, 30), "de")).toBe("Halb zwei ist halbwegs bis zwei. Es ist 13:30.");
  });

  it("skriver digitalt med fast bredde", () => {
    expect(tidTilDigital24(klokke(14, 30))).toBe("14:30");
    expect(tidTilDigital24(klokke(2, 5))).toBe("02:05");
    expect(tidTilDigital12(klokke(14, 30))).toBe("2:30");
    expect(tidTilDigital12(klokke(0, 0))).toBe("12:00");
    expect(tidTilDigital24(0)).toHaveLength(5);
    expect(tidTilDigital24(klokke(23, 55))).toHaveLength(5);
  });
});

describe("visere", () => {
  it("står riktig for alle 288 fem-minutter", () => {
    for (let time = 0; time < 24; time++) {
      for (let m = 0; m < 60; m += 5) {
        const verdi = time * 60 + m;
        expect(timeviserVinkel(verdi)).toBeCloseTo((time % 12) * 30 + m * 0.5);
        expect(minuttviserVinkel(verdi)).toBeCloseTo(m * 6);
      }
    }
  });

  it("legger timeviseren midt mellom 2 og 3 ved halv tre", () => {
    expect(timeviserVinkel(klokke(2, 30))).toBe(75);
    expect(timeviserVinkel(klokke(14, 30))).toBe(75);
    expect(minuttviserVinkel(klokke(2, 30))).toBe(180);
  });
});

describe("dagen", () => {
  it("deler døgnet og himmelen i flate steg", () => {
    expect(dogn(klokke(7, 0))).toBe("morgen");
    expect(dogn(klokke(10, 0))).toBe("formiddag");
    expect(dogn(klokke(14, 0))).toBe("ettermiddag");
    expect(dogn(klokke(18, 0))).toBe("kveld");
    expect(dogn(klokke(23, 30))).toBe("natt");
    expect(himmel(klokke(16, 55))).toBe("dag");
    expect(himmel(klokke(17, 0))).toBe("ettermiddag");
    expect(himmel(klokke(18, 0))).toBe("kveld");
    expect(himmel(klokke(19, 0))).toBe("skumring");
    expect(himmel(klokke(20, 0))).toBe("natt");
  });

  it("regner åpningstid og tidsrom", () => {
    const vanlig = { apner: klokke(14, 0), stenger: klokke(17, 0) };
    expect(erApen(klokke(14, 0), vanlig)).toBe(true);
    expect(erApen(klokke(16, 59), vanlig)).toBe(true);
    expect(erApen(klokke(17, 0), vanlig)).toBe(false);
    expect(erApen(klokke(15, 15), { ...vanlig, stengtFra: klokke(15, 0), stengtTil: klokke(15, 30) })).toBe(false);
    expect(erApen(klokke(12, 0), { apner: klokke(14, 0), stenger: klokke(14, 0), stengtHele: true })).toBe(false);
    expect(minutterMellom(klokke(16, 30), klokke(18, 0))).toBe(90);
  });
});
