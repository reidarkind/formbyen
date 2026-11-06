import type { Lagret, StedId } from "../typer";
import { byggDef } from "./katalog";

export const LANDMERKE = {
  butikk: { x: 6, y: 1 },
  torg: { x: 3, y: 6 },
  tannlege: { x: 0, y: 6 },
  svommehall: { x: 7, y: 6 },
  barnehage: { x: 1, y: 7 },
} as const;

export function erLandemerke(x: number, y: number): boolean {
  return Object.values(LANDMERKE).some((punkt) => punkt.x === x && punkt.y === y);
}

/** Hjemmet barnet bor i: det ferdige hjemmet. Et nytt hjem under bygging er ikke hjemme ennå (gj. 10, C6). */
export function boligen(by: Lagret["by"]): Lagret["by"]["bygg"][number] | undefined {
  const hjem = by.bygg.filter((bygg) => byggDef(bygg.bygg).hjem && !bygg.uthus);
  return hjem.find((bygg) => bygg.ferdig) ?? hjem[0];
}

export function celleFor(lagret: Lagret, sted: StedId = lagret.aktivDag?.sted ?? "hjemme"): { x: number; y: number } {
  if (sted in LANDMERKE) return LANDMERKE[sted as keyof typeof LANDMERKE];
  if (sted === "byggeplass") {
    const valgt = lagret.by.bygg.find((bygg) => bygg.instans === lagret.aktivDag?.valgtInstans);
    if (valgt) return { x: valgt.x, y: valgt.y };
  }
  if (sted === "aktivitet") {
    const avtale = lagret.aktivDag?.plan.avtaler.find((rad) => lagret.by.bygg.some((bygg) => bygg.bygg === rad.sted && bygg.ferdig));
    const bygg = lagret.by.bygg.find((rad) => rad.bygg === avtale?.sted);
    if (bygg) return { x: bygg.x, y: bygg.y };
  }
  const hjem = boligen(lagret.by) ?? lagret.by.bygg[0];
  return hjem ? { x: hjem.x, y: hjem.y } : { x: 2, y: 4 };
}
