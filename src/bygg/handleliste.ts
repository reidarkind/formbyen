import type { ByggId, Lagret, VareId } from "../typer";
import { byggSomKanStartes } from "./kart";
import { byggDef } from "./katalog";

const REKKEFOLGE: ByggId[] = ["bronn", "gjerde", "vedskjul", "lekeplass", "hytte", "hus", "villa", "borg", "slott"];

export function maalBygg(lagret: Lagret): { id: ByggId; steg: number } | null {
  const valgt = lagret.by.bygg.find((bygg) => bygg.instans === lagret.aktivDag?.valgtInstans && !bygg.ferdig);
  if (valgt) return { id: valgt.bygg, steg: valgt.steg };
  const uferdig = lagret.by.bygg.find((bygg) => !bygg.ferdig && !bygg.uthus);
  if (uferdig) return { id: uferdig.bygg, steg: uferdig.steg };
  const kan = byggSomKanStartes(lagret.by);
  const neste = REKKEFOLGE.find((id) => kan.includes(id)) ?? kan[0];
  if (!neste) return null;
  return { id: neste, steg: 0 };
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
