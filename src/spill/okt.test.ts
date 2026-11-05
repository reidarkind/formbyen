import { describe, expect, it } from "vitest";
import { standardLagret } from "../lagring/lagring";
import { utfor } from "./okt";

describe("en ettermiddag", () => {
  it("mister ingen bygg når butikken er stengt eller svaret er feil", () => {
    let lagret = standardLagret();
    lagret = { ...lagret, dato: { aar: 2026, maned: 8, dag: 23 } };
    lagret = utfor(lagret, { slag: "start" }).lagret;
    lagret = utfor(lagret, { slag: "ga", sted: "butikk" }).lagret;
    const stengt = utfor(lagret, { slag: "handle" });
    expect(stengt.lagret.aktivDag?.ko[0]?.type).toBe("apningstider");
    let svart = utfor(stengt.lagret, { slag: "svar", svar: stengt.lagret.aktivDag?.ko[0]?.fasit ?? "" });
    const oppfolging = svart.lagret.aktivDag?.ko[0];
    if (oppfolging) svart = utfor(svart.lagret, { slag: "svar", svar: oppfolging.fasit });
    expect(svart.melding).toContain("Stengt i dag");
    expect(svart.melding ?? "").not.toContain("i morgen");
    expect(svart.lagret.by.bygg.some((bygg) => bygg.bygg === "ronne" && bygg.ferdig)).toBe(true);

    const feil = utfor(stengt.lagret, { slag: "svar", svar: "helt-feil" });
    expect(feil.lagret.aktivDag?.forklaring?.length).toBeGreaterThan(0);
    expect(feil.lagret.by.bygg).toHaveLength(1);
    expect(feil.lagret.kurv).toEqual({});
  });

  it("tar en del tilbake i kurven uten å rive rønna", () => {
    let lagret = standardLagret();
    lagret = {
      ...lagret,
      kurv: { "kloss-sylinder": 1, "vegg-stein": 1, "tak-rodt": 1 },
      aktivDag: {
        plan: {
          nokkel: "test",
          dato: lagret.dato,
          ukedag: "mandag",
          arstid: "host",
          skoleslutt: 13 * 60 + 30,
          sisteTime: null,
          sfo: null,
          butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false },
          avtaler: [{ id: "middag", slag: "middag", navn: "Middag", start: 16 * 60 + 30, varighet: 30, sted: "hjemme" }],
          leggetid: 20 * 60,
          start: 13 * 60 + 30,
        },
        tid: 14 * 60,
        sted: "hjemme",
        fase: "ute",
        ko: [],
        aktiv: 0,
        forklaring: null,
        besokt: [],
        forSent: [],
        handlet: false,
        dorLest: false,
        byggetIDag: [],
        formerIDag: [],
        klokkerIDag: [],
        valgtInstans: null,
        melding: null,
        visteForSent: [],
      },
    };
    lagret = utfor(lagret, { slag: "velg-bygg", bygg: "bronn", x: 4, y: 4 }).lagret;
    lagret = utfor(lagret, { slag: "steg" }).lagret;
    expect(lagret.kurv["kloss-sylinder"]).toBe(0);
    lagret = utfor(lagret, { slag: "angre" }).lagret;
    expect(lagret.kurv["kloss-sylinder"]).toBe(1);
    expect(lagret.by.bygg.find((bygg) => bygg.bygg === "ronne")?.ferdig).toBe(true);
    expect(lagret.by.bygg.find((bygg) => bygg.bygg === "bronn")?.ferdig).toBe(false);
  });

  it("sier ifra vennlig når middagen er passert", () => {
    let lagret = standardLagret();
    const start = utfor(lagret, { slag: "start" }).lagret;
    const dag = start.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const middag = dag.plan.avtaler.find((avtale) => avtale.slag === "middag");
    if (!middag) throw new Error("mangler middag");
    lagret = { ...start, aktivDag: { ...dag, tid: middag.start + middag.varighet + 15, sted: "butikk" } };
    const etter = utfor(lagret, { slag: "ga", sted: "hjemme" });
    expect(etter.melding ?? "").toMatch(/spiste|åt/);
    expect(etter.melding ?? "").not.toMatch(/likevel/);
    expect(etter.lagret.by.bygg[0]?.ferdig).toBe(true);
  });
});
