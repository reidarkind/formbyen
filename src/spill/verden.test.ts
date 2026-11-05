import { describe, expect, it } from "vitest";
import { byggSomKanStartes, ledigeTomter } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { froTilfeldig } from "../felles/tilfeldig";
import { standardLagret } from "../lagring/lagring";
import { trekkOppgave } from "../oppgaver/lag";
import { erApen } from "../tid/tid";
import type { ByggId, Lagret } from "../typer";
import { anbefalt } from "./anbefaling";
import { hylleForNivaa, utfor } from "./okt";

function medDag(lagret: Lagret, over: Partial<NonNullable<Lagret["aktivDag"]>>): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return { ...lagret, aktivDag: { ...dag, ...over, plan: { ...dag.plan, ...over.plan } } };
}

describe("verden", () => {
  it("venter helt fram til tiden den nevner", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, {
      tid: 12 * 60 + 45,
      sted: "hjemme",
      fase: "ute",
      ko: [],
      plan: {
        ...dag.plan,
        avtaler: dag.plan.avtaler.filter((avtale) => avtale.start >= 15 * 60),
        butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false },
      },
    });
    const etter = utfor(lagret, { slag: "vent" }).lagret;
    expect(etter.aktivDag?.tid).toBe(13 * 60 + 30);
  });

  it("gir ingen vare når døra blir lest", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const mynter = lagret.mynter;
    lagret = medDag(lagret, { sted: "butikk", tid: dag.plan.butikk.apner, dorLest: false, fase: "ute", ko: [] });
    lagret = utfor(lagret, { slag: "handle" }).lagret;
    const oppgave = lagret.aktivDag?.ko[0];
    if (!oppgave) throw new Error("mangler døroppgave");
    const etter = utfor(lagret, { slag: "svar", svar: oppgave.fasit }).lagret;
    expect(etter.mynter).toBe(mynter);
    expect(Object.values(etter.kurv).reduce((sum, n) => sum + (n ?? 0), 0)).toBe(0);
  });

  it("lar avtalen ta tiden sin, uten å legge varer i kurven", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const start = 15 * 60;
    lagret = medDag(lagret, {
      tid: start,
      sted: "hjemme",
      fase: "ute",
      ko: [],
      besokt: [],
      forSent: [],
      plan: {
        ...dag.plan,
        avtaler: [{ id: "lekser-1", slag: "hjemme", navn: "lekser", aktivitet: "lekser", start, varighet: 30, sted: "hjemme" }],
      },
    });
    lagret = utfor(lagret, { slag: "mot" }).lagret;
    const oppgave = lagret.aktivDag?.ko[0];
    if (!oppgave) throw new Error("mangler møt-oppgave");
    const svar = utfor(lagret, { slag: "svar", svar: oppgave.fasit });
    expect(svar.melding ?? "").not.toMatch(/kurv/);
    expect(svar.lagret.aktivDag?.tid).toBe(start + 30);
  });

  it("sier et og eit om kvadrat", () => {
    let settKvadrat = false;
    let settSirkel = false;
    for (let fro = 1; fro < 40 && (!settKvadrat || !settSirkel); fro++) {
      const nb = trekkOppgave({
        tilfeldig: froTilfeldig(fro),
        spraak: "nb",
        nivaa: "forste",
        mestring: {},
        plan: null,
        unngaMal: [],
        unngaNokkel: "",
        type: "tegn",
      });
      const nn = trekkOppgave({
        tilfeldig: froTilfeldig(fro),
        spraak: "nn",
        nivaa: "forste",
        mestring: {},
        plan: null,
        unngaMal: [],
        unngaNokkel: "",
        type: "tegn",
      });
      if (nb.form === "kvadrat") {
        settKvadrat = true;
        expect(nb.prompt).toBe("Tegn et kvadrat.");
        expect(nn.prompt).toBe("Teikn eit kvadrat.");
      }
      if (nb.form === "sirkel") {
        settSirkel = true;
        expect(nb.prompt).toBe("Tegn en sirkel.");
        expect(nn.prompt).toBe("Teikn ein sirkel.");
      }
    }
    expect(settKvadrat).toBe(true);
    expect(settSirkel).toBe(true);
  });

  it("anbefaler butikk når kurven er tom, og bygg når delen er inne", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, {
      tid: 15 * 60,
      sted: "hjemme",
      fase: "ute",
      ko: [],
      dorLest: true,
      plan: { ...dag.plan, avtaler: [], butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false } },
    });
    const tom = anbefalt(lagret);
    expect(tom.slag).toBe("gaa");
    if (tom.slag === "gaa") expect(tom.sted).toBe("butikk");
    lagret = { ...lagret, kurv: { "kloss-sylinder": 1 } };
    expect(anbefalt(lagret)).toEqual({ slag: "bygg", bygg: "bronn", instans: null });
    const full = medDag({ ...lagret, kurv: { "kloss-sylinder": 1, "vegg-stein": 1, "tak-rodt": 1 } }, { sted: "butikk", dorLest: true });
    expect(anbefalt(full).slag).not.toBe("handle");
  });

  it("lar 1. klasse lære fire romformer", () => {
    expect(hylleForNivaa("forste", 2)).toBe("kloss");
    let lagret = standardLagret();
    const sett = new Set<string>();
    for (let dag = 0; dag < 30 && sett.size < 4; dag++) {
      lagret = utfor(lagret, { slag: "start" }).lagret;
      lagret = handleKloss(lagret);
      lagret = byggDetDuHar(lagret);
      for (const form of lagret.by.kjente3d) sett.add(form);
      if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
    }
    expect(sett.size).toBeGreaterThanOrEqual(4);
  });
});

function handleKloss(lagret: Lagret): Lagret {
  if (!lagret.aktivDag) return lagret;
  if (lagret.aktivDag.sted !== "butikk") {
    const gikk = utfor(lagret, { slag: "ga", sted: "butikk" });
    if (!gikk.lagret.aktivDag) return gikk.lagret;
    lagret = gikk.lagret;
  }
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  if (!dag.dorLest) {
    lagret = utfor(lagret, { slag: "handle" }).lagret;
    const oppgave = lagret.aktivDag?.ko[0];
    if (oppgave) lagret = utfor(lagret, { slag: "svar", svar: oppgave.fasit }).lagret;
  }
  if (!lagret.aktivDag) return lagret;
  if (!erApen(lagret.aktivDag.tid, lagret.aktivDag.plan.butikk)) {
    const ventet = utfor(lagret, { slag: "vent" });
    if (!ventet.lagret.aktivDag) return ventet.lagret;
    lagret = ventet.lagret;
  }
  if (!lagret.aktivDag || lagret.aktivDag.handlet || lagret.aktivDag.plan.butikk.stengtHele) return lagret;
  lagret = utfor(lagret, { slag: "handle" }).lagret;
  for (let steg = 0; steg < 4 && lagret.aktivDag && lagret.aktivDag.fase !== "ute" && lagret.aktivDag.ko.length > 0; steg++) {
    const oppgave = lagret.aktivDag.ko[lagret.aktivDag.aktiv];
    if (!oppgave) break;
    const forAktiv = lagret.aktivDag.aktiv;
    lagret = utfor(lagret, { slag: "svar", svar: oppgave.fasit }).lagret;
    if (lagret.aktivDag?.aktiv === forAktiv && lagret.aktivDag.fase === "forklaring") break;
  }
  return lagret;
}

function byggDetDuHar(lagret: Lagret): Lagret {
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
