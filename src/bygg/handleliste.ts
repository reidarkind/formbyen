import type { ByggId, Lagret, VareId } from "../typer";
import { nesteByggId } from "./kart";
import { byggDef } from "./katalog";

export function maalBygg(lagret: Lagret): { id: ByggId; steg: number } | null {
  const valgt = lagret.by.bygg.find((bygg) => bygg.instans === lagret.aktivDag?.valgtInstans && !bygg.ferdig);
  if (valgt) return { id: valgt.bygg, steg: valgt.steg };
  const id = nesteByggId(lagret.by);
  if (!id) return null;
  const plassert = lagret.by.bygg.find((bygg) => bygg.bygg === id && !bygg.ferdig);
  return { id, steg: plassert?.steg ?? 0 };
}

/** Delene som gjenstår når kurven er trukket fra oppskriften. */
export function manglendeDeler(lagret: Lagret): VareId[] {
  const maal = maalBygg(lagret);
  if (!maal) return [];
  const kurv: Partial<Record<VareId, number>> = { ...lagret.kurv };
  const mangler: VareId[] = [];
  for (const trinn of byggDef(maal.id).oppskrift.slice(maal.steg)) {
    const har = kurv[trinn.vare] ?? 0;
    if (har > 0) kurv[trinn.vare] = har - 1;
    else mangler.push(trinn.vare);
  }
  return mangler;
}
