import { describe, expect, it } from "vitest";
import type { Ferdighet, FerdighetsTilstand } from "../typer";
import { registrerSvar } from "./mestring";
import { ferdigheterForNivaa, ferdighetStatus, oversiktLinjer, OMRADER, ovesISpillet } from "./oversikt";

function svar(antallRiktige: number, antallFeil: number, dager: string[]): Partial<Record<Ferdighet, FerdighetsTilstand>> {
  let mestring: Partial<Record<Ferdighet, FerdighetsTilstand>> = {};
  let i = 0;
  for (let n = 0; n < antallRiktige; n++) mestring = registrerSvar(mestring, "hele-timer", true, "forste", dager[i++ % dager.length]);
  for (let n = 0; n < antallFeil; n++) mestring = registrerSvar(mestring, "hele-timer", false, "forste", dager[i++ % dager.length]);
  return mestring;
}

describe("mestring på voksensiden (gj. 9, B4)", () => {
  it("kaller en ferdighet sikker bare med 8 av de 10 siste riktige over minst 2 dager", () => {
    expect(ferdighetStatus(undefined).status).toBe("ikke");
    expect(ferdighetStatus(svar(3, 0, ["a"])["hele-timer"]).status).toBe("over");
    expect(ferdighetStatus(svar(10, 0, ["a"])["hele-timer"]).status).toBe("over");
    const sikker = ferdighetStatus(svar(9, 1, ["a", "b"])["hele-timer"]);
    expect(sikker.status).toBe("sikker");
    expect(sikker.riktige).toBe(9);
    expect(sikker.forsok).toBe(10);
    expect(ferdighetStatus(svar(7, 3, ["a", "b"])["hele-timer"]).status).toBe("over");
  });

  it("teller ikke 92 riktige som 100 % når andre ferdigheter står på null", () => {
    let mestring: Partial<Record<Ferdighet, FerdighetsTilstand>> = {};
    for (let n = 0; n < 92; n++) mestring = registrerSvar(mestring, "hele-timer", true, "andre", n % 2 ? "a" : "b");
    const linjer = oversiktLinjer(mestring, "nb");
    expect(linjer.klokke).toContain("sikker på hele timer");
    expect(linjer.klokke).toMatch(/ikke øvd|øver/);
  });

  it("viser bare ferdigheter spillet øver på", () => {
    const alle = OMRADER.flatMap((omrade) => omrade.ferdigheter);
    for (const id of alle) expect(ovesISpillet(id), id).toBe(true);
    expect(alle).toContain("hele-timer");
    expect(alle).toContain("former-3d");
    expect(alle).toContain("lengde");
  });

  it("viser to linjer i klartekst, og bare ferdigheter nivået øver på (gj. 10, 7.2.1 og 7.2.2)", () => {
    const linjer = oversiktLinjer({}, "nb", "forste");
    expect(Object.keys(linjer).sort()).toEqual(["former", "klokke"]);
    expect(linjer.klokke).not.toContain("fem minutter");
    expect(linjer.former).not.toMatch(/areal|koordinater|likevekt/);
    const forste = ferdigheterForNivaa("forste");
    for (const id of ["areal", "koordinater", "likevekt", "fem-minutter", "lengde"] as const) expect(forste.has(id), id).toBe(false);
    expect(forste.has("hele-timer")).toBe(true);
    expect(ferdigheterForNivaa("utfordrende").has("areal")).toBe(true);
  });
});
