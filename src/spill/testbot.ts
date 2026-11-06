import { ledigeTomter } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import type { ByggId, Lagret, Oppgave } from "../typer";
import { anbefalt } from "./anbefaling";
import { utfor } from "./okt";

/** Brukes bare av tester: følger den gule knappen gjennom en hel dag. */
export type Svarer = (oppgave: Oppgave) => string;

export const riktigSvar: Svarer = (oppgave) => oppgave.fasit;
export const feilSvar: Svarer = (oppgave) => {
  const annet = oppgave.valg.find((valg) => valg.id !== oppgave.fasit);
  return annet?.id ?? "feil";
};

export interface Logg {
  steg: number;
  /** Anbefalingene underveis, med lagret tilstand før handlingen. */
  spor: { lagret: Lagret; slag: string; sted?: string }[];
}

export function spillDag(lagret: Lagret, svar: Svarer = riktigSvar, maks = 600): { lagret: Lagret; logg: Logg } {
  const logg: Logg = { steg: 0, spor: [] };
  if (!lagret.aktivDag) lagret = utfor(lagret, { slag: "start" }).lagret;
  for (; logg.steg < maks && lagret.aktivDag; logg.steg++) {
    const dag = lagret.aktivDag;
    const oppgave = dag.ko[dag.aktiv];
    if (oppgave && dag.ko.length > 0) {
      if (dag.forklaring) {
        lagret = utfor(lagret, { slag: "fortsett" }).lagret;
        continue;
      }
      lagret = utfor(lagret, { slag: "svar", svar: svar(oppgave) }).lagret;
      continue;
    }
    const valg = anbefalt(lagret);
    logg.spor.push({ lagret, slag: valg.slag, sted: valg.slag === "gaa" ? valg.sted : undefined });
    if (valg.slag === "gaa") lagret = utfor(lagret, { slag: "ga", sted: valg.sted }).lagret;
    else if (valg.slag === "vent") {
      const etter = utfor(lagret, { slag: "vent" }).lagret;
      if (etter.aktivDag?.tid === dag.tid) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      else lagret = etter;
    } else if (valg.slag === "bygg") lagret = bygg(lagret, valg.bygg, valg.instans);
    else if (valg.slag === "handle" || valg.slag === "mot" || valg.slag === "spis") lagret = utfor(lagret, { slag: valg.slag }).lagret;
    else if (valg.slag === "klokke") lagret = utfor(lagret, { slag: "klokke" }).lagret;
    else if (valg.slag === "ekstra") lagret = utfor(lagret, { slag: "ekstra", ja: true }).lagret;
    else lagret = utfor(lagret, { slag: "avslutt" }).lagret;
  }
  return { lagret, logg };
}

function bygg(lagret: Lagret, id: ByggId, instans: string | null): Lagret {
  if (!lagret.aktivDag) return lagret;
  if (!instans) {
    const tomt = ledigeTomter(lagret.by, id)[0];
    if (!tomt) return utfor(lagret, { slag: "avslutt" }).lagret;
    if (lagret.aktivDag.sted !== "byggeplass") lagret = utfor(lagret, { slag: "ga", sted: "byggeplass" }).lagret;
    if (!lagret.aktivDag) return lagret;
    return utfor(lagret, { slag: "velg-bygg", bygg: id, x: tomt.x, y: tomt.y }).lagret;
  }
  const valgt = utfor(lagret, { slag: "velg", instans }).lagret;
  const naa = valgt.by.bygg.find((rad) => rad.instans === instans);
  const trinn = naa ? byggDef(id).oppskrift[naa.steg] : undefined;
  if (!trinn || (valgt.kurv[trinn.vare] ?? 0) < 1) return utfor(valgt, { slag: "avslutt" }).lagret;
  if (valgt.aktivDag && valgt.aktivDag.sted !== "byggeplass") {
    const gikk = utfor(valgt, { slag: "ga", sted: "byggeplass" }).lagret;
    if (!gikk.aktivDag) return gikk;
    return utfor(utfor(gikk, { slag: "velg", instans }).lagret, { slag: "steg" }).lagret;
  }
  return utfor(valgt, { slag: "steg" }).lagret;
}
