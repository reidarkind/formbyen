import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { byggDef } from "../bygg/katalog";
import { erApen } from "../tid/tid";
import type { ByggId, Lagret, StedId } from "../typer";

export function gangMinutter(fra: StedId, til: StedId): number {
  const langt = (sted: StedId) => sted === "tannlege" || sted === "svommehall";
  return langt(fra) || langt(til) ? 30 : 15;
}

export function stedForAvtale(sted: string): StedId {
  if (
    sted === "butikk" ||
    sted === "torg" ||
    sted === "tannlege" ||
    sted === "svommehall" ||
    sted === "byggeplass" ||
    sted === "aktivitet"
  ) {
    return sted;
  }
  if (sted === "hjemme" || sted === "") return "hjemme";
  return "aktivitet";
}

/** Neste tidspunkt vent-knappen skal lande på. Ikke et hopp på 30 minutter. */
export function ventMaalTid(lagret: Lagret): number | null {
  const dag = lagret.aktivDag;
  if (!dag) return null;
  const tider: number[] = [];
  for (const avtale of dag.plan.avtaler) {
    if (avtale.start > dag.tid && !dag.besokt.includes(avtale.id) && !dag.forSent.includes(avtale.id)) tider.push(avtale.start);
  }
  const butikk = dag.plan.butikk;
  if (!butikk.stengtHele && dag.tid < butikk.apner) tider.push(butikk.apner);
  if (butikk.stengtTil !== undefined && dag.tid < butikk.stengtTil && dag.tid >= (butikk.stengtFra ?? 0)) tider.push(butikk.stengtTil);
  const kommende = tider.filter((tid) => tid > dag.tid);
  if (kommende.length) return Math.min(...kommende);
  if (dag.tid >= 18 * 60 && dag.tid < dag.plan.leggetid) return dag.plan.leggetid;
  return null;
}

function avtaleNaa(lagret: Lagret): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return false;
  return dag.plan.avtaler.some((avtale) => {
    if (avtale.slag === "middag" || avtale.varighet <= 0) return false;
    if (dag.besokt.includes(avtale.id) || dag.forSent.includes(avtale.id)) return false;
    if (dag.tid < avtale.start - 15 || dag.tid > avtale.start + Math.max(15, avtale.varighet)) return false;
    return stedForAvtale(avtale.sted) === dag.sted;
  });
}

function skalGaaTil(lagret: Lagret, sted: StedId, start: number): boolean {
  const dag = lagret.aktivDag;
  if (!dag || sted === dag.sted) return false;
  const gang = gangMinutter(dag.sted, sted);
  return dag.tid + gang <= start + 15 && start - dag.tid <= gang + 15;
}

export type Anbefaling =
  | { slag: "mot" }
  | { slag: "handle" }
  | { slag: "spis" }
  | { slag: "bygg"; bygg: ByggId; instans: string | null }
  | { slag: "gaa"; sted: StedId }
  | { slag: "vent"; tid: number }
  | { slag: "legg" }
  | { slag: "byplan" }
  | { slag: "se" };

function delIKurv(lagret: Lagret): { bygg: ByggId; instans: string | null } | null {
  const maal = maalBygg(lagret);
  if (!maal) return null;
  const trinn = byggDef(maal.id).oppskrift[maal.steg];
  if (!trinn || (lagret.kurv[trinn.vare] ?? 0) <= 0) return null;
  const plassert = lagret.by.bygg.find((bygg) => bygg.bygg === maal.id && !bygg.ferdig);
  return { bygg: maal.id, instans: plassert?.instans ?? null };
}

export function anbefalt(lagret: Lagret): Anbefaling {
  const dag = lagret.aktivDag;
  if (!dag) return { slag: "se" };
  if (avtaleNaa(lagret)) return { slag: "mot" };
  const kommende = dag.plan.avtaler.find(
    (avtale) =>
      avtale.varighet > 0 &&
      avtale.slag !== "middag" &&
      !dag.besokt.includes(avtale.id) &&
      !dag.forSent.includes(avtale.id) &&
      skalGaaTil(lagret, stedForAvtale(avtale.sted), avtale.start),
  );
  if (kommende) return { slag: "gaa", sted: stedForAvtale(kommende.sted) };
  const middag = dag.plan.avtaler.find((avtale) => avtale.slag === "middag" && !dag.besokt.includes(avtale.id) && !dag.forSent.includes(avtale.id));
  if (middag && dag.sted === "hjemme" && dag.tid >= middag.start - 15 && dag.tid <= middag.start + 15) return { slag: "spis" };
  if (middag && skalGaaTil(lagret, "hjemme", middag.start)) return { slag: "gaa", sted: "hjemme" };
  const mangler = manglendeDeler(lagret).length > 0;
  const apen = erApen(dag.tid, dag.plan.butikk);
  const kanHandle = apen && mangler && !dag.plan.butikk.stengtHele;
  if (dag.sted === "butikk" && (!dag.dorLest || kanHandle)) return { slag: "handle" };
  const del = delIKurv(lagret);
  if (del) return { slag: "bygg", bygg: del.bygg, instans: del.instans };
  if (kanHandle) return { slag: "gaa", sted: "butikk" };
  if (mangler && !apen) {
    const vent = ventMaalTid(lagret);
    if (vent) return { slag: "vent", tid: vent };
    return { slag: "gaa", sted: "torg" };
  }
  if (!maalBygg(lagret)) return { slag: "byplan" };
  const igjen = dag.plan.avtaler.some(
    (avtale) => avtale.varighet > 0 && avtale.start >= dag.tid && !dag.besokt.includes(avtale.id) && !dag.forSent.includes(avtale.id),
  );
  if (dag.tid >= dag.plan.leggetid - 30 && !igjen) return dag.sted === "hjemme" ? { slag: "legg" } : { slag: "gaa", sted: "hjemme" };
  const vent = ventMaalTid(lagret);
  if (vent) return { slag: "vent", tid: vent };
  return { slag: "se" };
}
