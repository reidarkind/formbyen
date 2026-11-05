import { describe, expect, it } from "vitest";
import { manglendeDeler } from "../bygg/handleliste";
import { byggSomKanStartes, ledigeTomter } from "../bygg/kart";
import { BYGG, byggDef } from "../bygg/katalog";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import { erApen } from "../tid/tid";
import type { ByggId, Lagret, Nivaa } from "../typer";
import { utfor } from "./okt";

function svarEn(lagret: Lagret): Lagret {
  const dag = lagret.aktivDag;
  const oppgave = dag?.ko[dag.aktiv];
  if (!dag || !oppgave) return lagret;
  return utfor(lagret, { slag: "svar", svar: oppgave.fasit }).lagret;
}

function handel(lagret: Lagret): Lagret {
  if (!lagret.aktivDag) return lagret;
  if (lagret.aktivDag.sted !== "butikk") {
    const gikk = utfor(lagret, { slag: "ga", sted: "butikk" });
    if (!gikk.lagret.aktivDag) return gikk.lagret;
    lagret = gikk.lagret;
  }
  for (let vakt = 0; vakt < 16 && lagret.aktivDag; vakt++) {
    const dag = lagret.aktivDag;
    if (dag.plan.butikk.stengtHele) break;
    if (!erApen(dag.tid, dag.plan.butikk)) {
      if (!dag.dorLest) {
        lagret = utfor(lagret, { slag: "handle" }).lagret;
        for (let steg = 0; lagret.aktivDag && lagret.aktivDag.ko.length > 0 && steg < 4; steg++) {
          lagret = svarEn(lagret);
          if (lagret.aktivDag?.forklaring) lagret = utfor(lagret, { slag: "fortsett" }).lagret;
        }
        if (!lagret.aktivDag) return lagret;
      }
      const ventet = utfor(lagret, { slag: "vent" });
      if (!ventet.lagret.aktivDag || ventet.lagret.aktivDag.tid === dag.tid) break;
      lagret = ventet.lagret;
      continue;
    }
    const startet = utfor(lagret, { slag: "handle" }).lagret;
    if (!startet.aktivDag || startet.aktivDag.ko.length === 0) break;
    lagret = startet;
    let steg = 0;
    while (lagret.aktivDag && lagret.aktivDag.ko.length > 0 && lagret.aktivDag.fase !== "ute" && steg < 6) {
      const forAktiv = lagret.aktivDag.aktiv;
      lagret = svarEn(lagret);
      steg += 1;
      if (lagret.aktivDag && lagret.aktivDag.aktiv === forAktiv && lagret.aktivDag.fase === "forklaring") break;
    }
  }
  return lagret;
}

function byggVidere(lagret: Lagret): Lagret {
  const rekkefolge: ByggId[] = ["bronn", "gjerde", "vedskjul", "hytte"];
  for (const id of rekkefolge) {
    if (!lagret.aktivDag) return lagret;
    if (lagret.by.bygg.some((bygg) => bygg.bygg === id && bygg.ferdig)) continue;
    let plassert = lagret.by.bygg.find((bygg) => bygg.bygg === id && !bygg.ferdig);
    if (!plassert) {
      if (!byggSomKanStartes(lagret.by).includes(id)) continue;
      const tomt = ledigeTomter(lagret.by, id)[0];
      if (!tomt) continue;
      const valgt = utfor(lagret, { slag: "velg-bygg", bygg: id, x: tomt.x, y: tomt.y });
      if (!valgt.lagret.aktivDag) return valgt.lagret;
      lagret = valgt.lagret;
      plassert = lagret.by.bygg.find((bygg) => bygg.bygg === id && !bygg.ferdig);
    } else {
      lagret = utfor(lagret, { slag: "velg", instans: plassert.instans }).lagret;
    }
    for (let vakt = 0; vakt < 8 && lagret.aktivDag && plassert; vakt++) {
      const naa = lagret.by.bygg.find((bygg) => bygg.instans === plassert?.instans);
      if (!naa || naa.ferdig) break;
      const trinn = byggDef(id).oppskrift[naa.steg];
      if (!trinn || (lagret.kurv[trinn.vare] ?? 0) < 1) break;
      const bygd = utfor(lagret, { slag: "steg" });
      if (!bygd.lagret.aktivDag) return bygd.lagret;
      const etter = bygd.lagret.by.bygg.find((bygg) => bygg.instans === naa.instans);
      if (!etter || etter.steg === naa.steg) break;
      lagret = bygd.lagret;
    }
  }
  return lagret;
}

describe("en spiller som svarer rett", () => {
  it.each(["forste", "andre", "utfordrende", "blandet"] as Nivaa[])("bygger brønn, gjerde og vedskjul på %s og når nivå 2", (nivaa) => {
    let lagret = standardLagret();
    lagret = { ...lagret, dato: STARTDATO, innstillinger: { ...lagret.innstillinger, nivaa } };
    for (let dag = 0; dag < 6; dag++) {
      lagret = utfor(lagret, { slag: "start" }).lagret;
      lagret = handel(lagret);
      lagret = byggVidere(lagret);
      if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      if (lagret.by.nivaa >= 2 && ["bronn", "gjerde", "vedskjul"].every((id) => lagret.by.bygg.some((bygg) => bygg.bygg === id && bygg.ferdig))) break;
    }
    for (const id of ["bronn", "gjerde", "vedskjul"] as const) {
      expect(lagret.by.bygg.some((bygg) => bygg.bygg === id && bygg.ferdig), id).toBe(true);
    }
    expect(lagret.by.nivaa).toBeGreaterThanOrEqual(2);
  });

  it("gir delen bygget trenger, også vegg og planke på 1. klasse", () => {
    let lagret = standardLagret();
    lagret = { ...lagret, dato: STARTDATO };
    lagret = utfor(lagret, { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = {
      ...lagret,
      aktivDag: { ...dag, tid: dag.plan.butikk.apner, sted: "butikk", dorLest: true },
    };
    expect(manglendeDeler(lagret)[0]).toBe("kloss-sylinder");
    lagret = svarEn(utfor(lagret, { slag: "handle" }).lagret);
    expect(lagret.kurv["kloss-sylinder"]).toBe(1);
    for (const id of Object.keys(BYGG) as ByggId[]) {
      if (BYGG[id].nivaa > 3) continue;
      const medBygg = {
        ...lagret,
        kurv: {},
        by: {
          ...lagret.by,
          bygg: [
            ...lagret.by.bygg,
            { instans: `prove-${id}`, bygg: id, x: 0, y: 0, steg: 0, ferdig: false, uthus: false, frie: [], pynt: [] },
          ],
        },
        aktivDag: lagret.aktivDag ? { ...lagret.aktivDag, valgtInstans: `prove-${id}` } : null,
      };
      expect(manglendeDeler(medBygg), id).toEqual(BYGG[id].oppskrift.map((trinn) => trinn.vare));
    }
  });
});

describe("avtaler", () => {
  it("gir stjerne når alle avtaler, også middagen, møtes i tide", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = {
      ...lagret,
      aktivDag: {
        ...dag,
        tid: 15 * 60,
        sted: "hjemme",
        besokt: [],
        forSent: [],
        plan: {
          ...dag.plan,
          leggetid: 20 * 60,
          avtaler: [
            { id: "lek", slag: "hjemme", navn: "Lek", start: 15 * 60, varighet: 30, sted: "hjemme" },
            { id: "middag", slag: "middag", navn: "Middag", start: 17 * 60, varighet: 30, sted: "hjemme" },
          ],
        },
      },
    };
    const mot = utfor(lagret, { slag: "mot" });
    expect(mot.lagret.aktivDag?.ko[0]?.nokkel).toBe("avtale:lek");
    lagret = utfor(mot.lagret, { slag: "svar", svar: "rett" }).lagret;
    const dagEtter = lagret.aktivDag;
    if (!dagEtter) throw new Error("dagen ble borte");
    lagret = { ...lagret, aktivDag: { ...dagEtter, tid: 17 * 60, sted: "hjemme" } };
    lagret = utfor(lagret, { slag: "spis" }).lagret;
    expect(lagret.aktivDag?.besokt).toEqual(expect.arrayContaining(["lek", "middag"]));
    const slutt = utfor(lagret, { slag: "avslutt" });
    expect(slutt.lagret.by.dagerAlleAvtaler).toBe(1);
    expect(slutt.lagret.dagbok.at(-1)?.stjerne).toBe(true);
  });

  it("krysser ikke av en avtale som ikke pågår", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = {
      ...lagret,
      aktivDag: {
        ...dag,
        tid: 10 * 60,
        sted: "torg",
        plan: {
          ...dag.plan,
          avtaler: [{ id: "tannlege", slag: "fritid", navn: "Tannlege", start: 12 * 60 + 30, varighet: 30, sted: "torg" }],
        },
      },
    };
    const mot = utfor(lagret, { slag: "mot" });
    expect(mot.melding).toContain("ingen avtale");
    expect(mot.lagret.aktivDag?.besokt).toEqual([]);
    expect(mot.lagret.aktivDag?.ko).toEqual([]);
  });

  it("sier at butikken åpner i dag når den åpner senere", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = {
      ...lagret,
      aktivDag: {
        ...dag,
        tid: 12 * 60 + 15,
        sted: "butikk",
        dorLest: false,
        plan: { ...dag.plan, butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false } },
      },
    };
    const dor = utfor(lagret, { slag: "handle" });
    let svart = utfor(dor.lagret, { slag: "svar", svar: dor.lagret.aktivDag?.ko[0]?.fasit ?? "" });
    const oppfolging = svart.lagret.aktivDag?.ko[0];
    if (oppfolging) svart = utfor(svart.lagret, { slag: "svar", svar: oppfolging.fasit });
    expect(svart.melding).toContain("14:00");
    expect(svart.melding ?? "").toContain("åpner");
    expect(svart.melding ?? "").not.toContain("i morgen");
  });

  it("gir minst 35 prosent klokkeoppgaver i butikken", () => {
    const klokke = new Set(["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"]);
    for (const nivaa of ["forste", "andre", "utfordrende"] as const) {
      let lagret = utfor(
        { ...standardLagret(), dato: { ...STARTDATO }, innstillinger: { ...standardLagret().innstillinger, nivaa } },
        { slag: "start" },
      ).lagret;
      const dag = lagret.aktivDag;
      if (!dag) throw new Error("mangler dag");
      let antall = 0;
      let klokker = 0;
      for (let i = 0; i < 120; i++) {
        lagret = {
          ...lagret,
          fro: i,
          kurv: {},
          aktivDag: { ...dag, tid: dag.plan.butikk.apner, sted: "butikk", dorLest: true, fase: "ute", ko: [], forklaring: null },
        };
        const startet = utfor(lagret, { slag: "handle" }).lagret;
        const type = startet.aktivDag?.ko[0]?.type;
        if (!type) continue;
        antall += 1;
        if (klokke.has(type)) klokker += 1;
      }
      expect(antall, nivaa).toBeGreaterThan(80);
      expect(klokker / antall, nivaa).toBeGreaterThanOrEqual(0.35);
    }
  });

  it("legger riktig dørsvar på hver side mellom 40 og 60 prosent", () => {
    const startet = utfor(
      { ...standardLagret(), dato: { ...STARTDATO }, innstillinger: { ...standardLagret().innstillinger, nivaa: "forste" } },
      { slag: "start" },
    ).lagret;
    const dag = startet.aktivDag;
    if (!dag) throw new Error("mangler dag");
    let forst = 0;
    const antall = 80;
    for (let fro = 1; fro <= antall; fro++) {
      const med = {
        ...startet,
        fro,
        aktivDag: {
          ...dag,
          tid: dag.plan.butikk.apner,
          sted: "butikk" as const,
          dorLest: false,
          fase: "ute" as const,
          ko: [],
          forklaring: null,
        },
      };
      const dor = utfor(med, { slag: "dor" }).lagret;
      const oppgave = dor.aktivDag?.ko[0];
      if (oppgave?.valg[0]?.id === oppgave?.fasit) forst += 1;
    }
    expect(forst / antall).toBeGreaterThanOrEqual(0.4);
    expect(forst / antall).toBeLessThanOrEqual(0.6);
  });
});
