import { describe, expect, it } from "vitest";
import { ferdighetApent, registrerSvar, tillatteMinutter, tomFerdighet } from "./mestring";

describe("mestring", () => {
  it("går opp etter tre riktige og ned etter to feil", () => {
    let mestring = { "hele-timer": { ...tomFerdighet(), trinn: 1 } };
    mestring = registrerSvar(mestring, "hele-timer", true, "andre");
    mestring = registrerSvar(mestring, "hele-timer", true, "andre");
    expect(mestring["hele-timer"]?.trinn).toBe(1);
    mestring = registrerSvar(mestring, "hele-timer", true, "andre");
    expect(mestring["hele-timer"]?.trinn).toBe(2);
    expect(mestring["hele-timer"]?.riktigePaRad).toBe(0);
    mestring = registrerSvar(mestring, "hele-timer", false, "andre");
    mestring = registrerSvar(mestring, "hele-timer", false, "andre");
    expect(mestring["hele-timer"]?.trinn).toBe(1);
  });

  it("holder halvtime stengt til hele timer sitter i 1. klasse", () => {
    expect(ferdighetApent("halv", "forste", {})).toBe(false);
    expect(ferdighetApent("halv", "forste", { "hele-timer": { ...tomFerdighet(), riktige: 6 } })).toBe(true);
    expect(ferdighetApent("kvart", "forste", {})).toBe(false);
    expect(ferdighetApent("areal", "andre", {})).toBe(false);
    expect(ferdighetApent("areal", "utfordrende", {})).toBe(true);
    expect(ferdighetApent("lengde", "blandet", {})).toBe(true);
    expect(tillatteMinutter("forste", {})).toEqual([0]);
    expect(tillatteMinutter("andre", {})).toEqual([0, 15, 30, 45]);
    expect(tillatteMinutter("andre", { kvart: { ...tomFerdighet(), riktige: 6 } })).toEqual([0, 15, 30, 45]);
    expect(tillatteMinutter("utfordrende", {})).toContain(5);
  });
});
