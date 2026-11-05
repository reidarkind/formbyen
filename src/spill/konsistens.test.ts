import { describe, expect, it } from "vitest";
import { aktivitetKnapp, visNavn } from "../dag/aktiviteter";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import { erApen } from "../tid/tid";
import type { Avtale, Dagsplan, Lagret, Nivaa, StedId } from "../typer";
import { avtaleHer, gangMinutter, nesteSteg, stedForAvtale, type NesteSteg } from "./anbefaling";
import { byggDef } from "../bygg/katalog";
import { ledigeTomter } from "../bygg/kart";
import { utfor } from "./okt";
import type { ByggId } from "../typer";

const NIVA: Nivaa[] = ["forste", "andre", "utfordrende"];

function minuttOk(nivaa: Nivaa, tid: number): boolean {
  const steg = nivaa === "forste" ? 30 : nivaa === "andre" ? 15 : 5;
  return tid % steg === 0;
}

function tiderI(tekst: string): number[] {
  return [...tekst.matchAll(/\b(\d{2}):(\d{2})\b/g)].map((treff) => Number(treff[1]) * 60 + Number(treff[2]));
}

function imperativ(tekst: string): string | null {
  const lav = tekst.toLowerCase();
  if (lav.includes("gå til butikken")) return "butikk";
  if (lav.includes("gå hjem") || lav.includes("gå heim")) return "hjem";
  if (lav.includes("gå til tomta")) return "tomt";
  if (lav.includes("gå til tannlegen") || lav.includes("gå til tannlækjaren")) return "tannlege";
  if (lav.includes("gå til svømmehallen") || lav.includes("gå til symjehallen")) return "svomme";
  if (lav.includes("gå til barnehagen")) return "barnehage";
  if (lav.includes("gå til torget")) return "torg";
  if (lav.includes("sett på") || lav.includes("set på")) return "bygg";
  if (lav.includes("vent til")) return "vent";
  return null;
}

function stengtResten(lagret: Lagret): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return false;
  const butikk = dag.plan.butikk;
  if (butikk.stengtHele || dag.tid >= butikk.stenger) return true;
  return false;
}

function sjekkSteg(lagret: Lagret, steg: NesteSteg): string | null {
  const dag = lagret.aktivDag;
  if (!dag || dag.ko.length > 0) return null;
  const nivaa = lagret.innstillinger.nivaa;
  if (steg.knapp.toLowerCase().includes("møt opp")) return "Møt opp finnes";
  if (steg.knapp.includes("likevel") || steg.grunn.includes("likevel")) return "likevel komme";
  const a = imperativ(steg.grunn);
  const b = imperativ(steg.knapp);
  if (a && b && a !== b) return `tekst ${a} mot knapp ${b}: ${steg.grunn} / ${steg.knapp}`;
  for (const tid of [...tiderI(steg.knapp), ...tiderI(steg.grunn), dag.tid]) {
    if (!minuttOk(nivaa, tid)) return `tid ${tid} passer ikke ${nivaa}`;
  }
  if (steg.handling.slag === "vent") {
    if (!steg.knapp.includes("·")) return `vent uten grunn: ${steg.knapp}`;
    if (dag.sted === "butikk" && stengtResten(lagret)) return "venter i stengt butikk";
    if (dag.sted === "byggeplass") return "venter på tom tomt";
    if (steg.grunn.toLowerCase().includes("butikk") && steg.handling.tid > dag.plan.butikk.stenger && !dag.plan.butikk.stengtHele) {
      return "venter på butikken etter stengetid";
    }
  }
  if (steg.handling.slag === "gaa" && steg.handling.sted === "butikk") {
    const ankomst = dag.tid + gangMinutter(dag.sted, "butikk", nivaa);
    if (!erApen(ankomst, dag.plan.butikk)) return `butikken er stengt ved ankomst ${ankomst}`;
  }
  if (steg.handling.slag === "handle" && !erApen(dag.tid, dag.plan.butikk)) return "handler når butikken er stengt";
  if (steg.handling.slag === "mot") {
    const avtale = avtaleHer(lagret);
    if (!avtale) return "mot uten avtale";
    const knapp = aktivitetKnapp(avtale.aktivitet ?? avtale.navn, lagret.innstillinger.spraak);
    if (steg.knapp !== knapp) return `knapp ${steg.knapp} er ikke ${knapp}`;
    const navn = visNavn(avtale.aktivitet ?? avtale.navn, lagret.innstillinger.spraak);
    if (!steg.grunn.includes(navn)) return `teksten nevner ikke ${navn}`;
  }
  return null;
}

function gjorAnbefalt(lagret: Lagret, steg: NesteSteg): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const valg = steg.handling;
  if (valg.slag === "gaa") {
    if (valg.sted === dag.sted) return lagret;
    return utfor(lagret, { slag: "ga", sted: valg.sted }).lagret;
  }
  if (valg.slag === "vent") return utfor(lagret, { slag: "vent", tid: valg.tid }).lagret;
  if (valg.slag === "bygg") return byggEtt(lagret, valg.bygg, valg.instans);
  if (valg.slag === "handle" || valg.slag === "mot" || valg.slag === "spis") return utfor(lagret, { slag: valg.slag }).lagret;
  if (valg.slag === "legg" || valg.slag === "se") return utfor(lagret, { slag: "avslutt" }).lagret;
  return lagret;
}

function gjorTilfeldig(lagret: Lagret, steg: number): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const steder: StedId[] = ["hjemme", "butikk", "torg", "tannlege", "svommehall", "barnehage"];
  const sted = steder[steg % steder.length] ?? "hjemme";
  if (steg % 5 === 0) return utfor(lagret, { slag: "avslutt" }).lagret;
  if (dag.sted === "butikk" && steg % 2 === 0) return utfor(lagret, { slag: "handle" }).lagret;
  if (sted === dag.sted) return utfor(lagret, { slag: "vent", tid: dag.tid + 15 }).lagret;
  return utfor(lagret, { slag: "ga", sted }).lagret;
}

function byggEtt(lagret: Lagret, id: ByggId, instans: string | null): Lagret {
  if (!lagret.aktivDag) return lagret;
  if (!instans) {
    const tomt = ledigeTomter(lagret.by, id)[0];
    if (!tomt) return lagret;
    if (lagret.aktivDag.sted !== "byggeplass") {
      const gikk = utfor(lagret, { slag: "ga", sted: "byggeplass" }).lagret;
      if (!gikk.aktivDag) return gikk;
      lagret = gikk;
    }
    return utfor(lagret, { slag: "velg-bygg", bygg: id, x: tomt.x, y: tomt.y }).lagret;
  }
  const valgt = utfor(lagret, { slag: "velg", instans }).lagret;
  const naa = valgt.by.bygg.find((bygg) => bygg.instans === instans);
  const trinn = naa ? byggDef(id).oppskrift[naa.steg]?.vare : undefined;
  if (!trinn || (valgt.kurv[trinn] ?? 0) < 1) return valgt;
  return utfor(valgt, { slag: "steg" }).lagret;
}

function svarEn(lagret: Lagret, strategi: string, steg: number): Lagret {
  const dag = lagret.aktivDag;
  const oppgave = dag?.ko[dag.aktiv];
  if (!dag || !oppgave) return lagret;
  if (strategi !== "a" && steg % 4 === 0) {
    const feil = utfor(lagret, { slag: "svar", svar: "feil" }).lagret;
    if ((feil.aktivDag?.feil ?? 0) >= 2) return utfor(feil, { slag: "fortsett" }).lagret;
    return utfor(feil, { slag: "fortsett" }).lagret;
  }
  const etter = utfor(lagret, { slag: "svar", svar: oppgave.fasit });
  if (etter.lagret.aktivDag?.forklaring) return utfor(etter.lagret, { slag: "fortsett" }).lagret;
  return etter.lagret;
}

function stedAv(avtale: Avtale): StedId {
  if (avtale.slag === "middag") return "hjemme";
  return stedForAvtale(avtale.sted);
}

function muligeVedStart(plan: Dagsplan, nivaa: Nivaa, tidStart: number): string[] {
  let tid = tidStart;
  let sted: StedId = "hjemme";
  const gjort: string[] = [];
  const liste = plan.avtaler.filter((avtale) => avtale.varighet > 0).sort((a, b) => a.start - b.start);
  for (const avtale of liste) {
    const maal = stedAv(avtale);
    const dit = sted === maal ? 0 : gangMinutter(sted, maal, nivaa);
    const ankomst = tid + dit;
    if (ankomst > avtale.start + avtale.varighet) continue;
    const start = Math.max(ankomst, avtale.start);
    const slutt = start + avtale.varighet;
    const hjem = maal === "hjemme" ? 0 : gangMinutter(maal, "hjemme", nivaa);
    if (slutt + hjem > plan.leggetid) continue;
    gjort.push(avtale.id);
    tid = slutt;
    sted = maal;
  }
  return gjort;
}

function spill(lagret: Lagret, strategi: "a" | "b" | "c"): { lagret: Lagret; brudd: string } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, brudd: "" };
  const mulige = strategi === "a" ? muligeVedStart(dag.plan, lagret.innstillinger.nivaa, dag.tid) : [];
  const planAvtaler = dag.plan.avtaler.filter((avtale) => avtale.varighet > 0);
  let forrige = "";
  let likt = 0;
  const spor: string[] = [];
  for (let steg = 0; steg < 200 && lagret.aktivDag; steg++) {
    const naa = lagret.aktivDag;
    const fremdrift = lagret.by.bygg.reduce((sum, bygg) => sum + bygg.steg, 0);
    const kurv = Object.values(lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0);
    const nokkel = `${naa.tid}:${naa.sted}:${naa.fase}:${naa.ko.length}:${fremdrift}:${kurv}`;
    likt = nokkel === forrige ? likt + 1 : 0;
    forrige = nokkel;
    if (likt > 3) break;
    if (naa.ko.length > 0) {
      lagret = svarEn(lagret, strategi, steg);
      continue;
    }
    const rad = nesteSteg(lagret);
    spor.push(`${naa.tid}@${naa.sted}:${rad.handling.slag}:${rad.knapp}`);
    const feil = sjekkSteg(lagret, rad);
    if (feil) return { lagret, brudd: feil };
    if (strategi === "b" || (strategi === "c" && steg % 3 === 0)) lagret = gjorTilfeldig(lagret, steg);
    else lagret = gjorAnbefalt(lagret, rad);
  }
  if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
  const sist = lagret.dagbok.at(-1);
  if (!sist?.avtaler || sist.avtaler.length !== planAvtaler.length) return { lagret, brudd: "kvelden viser ikke alle avtaler" };
  if (strategi === "a") {
    const gjort = new Set(sist.avtaler.filter((avtale) => avtale.gjort).map((avtale) => avtale.aktivitet + ":" + avtale.start));
    for (const id of mulige) {
      const avtale = planAvtaler.find((rad) => rad.id === id);
      if (!avtale) continue;
      const nokkel = `${avtale.aktivitet ?? avtale.navn}:${avtale.start}`;
      if (!gjort.has(nokkel)) {
        const planTekst = planAvtaler.map((avtale) => `${avtale.aktivitet ?? avtale.navn}@${avtale.start}/${avtale.sted}`).join(",");
        return { lagret, brudd: `mistet ${nokkel} start=${dag.tid} [${planTekst}] ${spor.join(" | ")}` };
      }
    }
  }
  return { lagret, brudd: "" };
}

describe("konsistens", () => {
  it("holder løftene gjennom 300 ettermiddager på hvert nivå og hver strategi", () => {
    const strategier = ["a", "b", "c"] as const;
    for (const nivaa of NIVA) {
      for (const strategi of strategier) {
        let lagret = {
          ...standardLagret(),
          dato: { ...STARTDATO },
          innstillinger: { ...standardLagret().innstillinger, nivaa },
        };
        for (let dag = 0; dag < 300; dag++) {
          lagret = utfor(lagret, { slag: "start" }).lagret;
          const etter = spill(lagret, strategi);
          expect(etter.brudd, `${nivaa} ${strategi} dag ${dag}`).toBe("");
          lagret = etter.lagret;
        }
      }
    }
  }, 180000);

  it("bygger brønnen på én ettermiddag og hytta innen tre når barnet følger rådet", () => {
    let lagret = {
      ...standardLagret(),
      dato: { ...STARTDATO },
      innstillinger: { ...standardLagret().innstillinger, nivaa: "forste" as Nivaa },
    };
    for (let dag = 0; dag < 3; dag++) {
      lagret = utfor(lagret, { slag: "start" }).lagret;
      const etter = spill(lagret, "a");
      expect(etter.brudd, `dag ${dag}`).toBe("");
      lagret = etter.lagret;
      if (dag === 0) expect(lagret.by.bygg.some((bygg) => bygg.bygg === "bronn" && bygg.ferdig)).toBe(true);
    }
    expect(lagret.by.bygg.some((bygg) => bygg.bygg === "hytte" && bygg.ferdig)).toBe(true);
  }, 30000);
});
