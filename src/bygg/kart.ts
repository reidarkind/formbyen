import type { ByggId, ByTilstand, Omrade, PlassertBygg } from "../typer";
import { BYGG, HJEM_FOR_NIVAA, byggDef } from "./katalog";
import { erLandemerke } from "./landemerker";

export interface Rute {
  x: number;
  y: number;
  slag: "gress" | "vann" | "sti";
  omrade: Omrade;
}

const BOKSTAV = "ABCDEFGHIJKL";

export function ruteNavn(x: number, y: number): string {
  return `${BOKSTAV[x] ?? "?"}${y + 1}`;
}

export function lesRute(kode: string): { x: number; y: number } | null {
  const treff = /^([A-La-l])(\d{1,2})$/.exec(kode.trim());
  if (!treff) return null;
  const x = (treff[1] ?? "A").toUpperCase().charCodeAt(0) - 65;
  const y = Number(treff[2]) - 1;
  if (x < 0 || x > 11 || y < 0 || y > 11) return null;
  return { x, y };
}

export function omradeFor(x: number, y: number): Omrade | null {
  if (x < 0 || y < 0 || x > 11 || y > 11) return null;
  if (x < 8 && y < 8) return "dalen";
  if (x >= 8 && y < 8) return "bekken";
  if (x < 8 && y >= 8) return "asen";
  return "havna";
}

export function erVann(x: number, y: number): boolean {
  if (y === 3 && x >= 8 && x <= 11) return true;
  if (x === 11 && y >= 8 && y <= 11) return true;
  return false;
}

export function erSti(x: number, y: number): boolean {
  return y === 2 && x >= 0 && x <= 7;
}

export function celle(x: number, y: number): Rute | null {
  const omrade = omradeFor(x, y);
  if (!omrade) return null;
  const slag = erVann(x, y) ? "vann" : erSti(x, y) ? "sti" : "gress";
  return { x, y, slag, omrade };
}

export function omraderForNivaa(nivaa: number): Omrade[] {
  const liste: Omrade[] = ["dalen"];
  if (nivaa >= 2) liste.push("bekken");
  if (nivaa >= 3) liste.push("asen");
  if (nivaa >= 5) liste.push("havna");
  return liste;
}

function dekker(bygg: PlassertBygg, x: number, y: number): boolean {
  const def = byggDef(bygg.bygg);
  return x >= bygg.x && x < bygg.x + def.bredde && y >= bygg.y && y < bygg.y + def.dybde;
}

export function opptatt(by: ByTilstand, x: number, y: number, unntatt?: string): boolean {
  if (erLandemerke(x, y)) return true;
  return by.bygg.some((bygg) => bygg.instans !== unntatt && dekker(bygg, x, y));
}

function innenfor(by: ByTilstand, x: number, y: number): boolean {
  const omrade = omradeFor(x, y);
  return omrade !== null && by.omrader.includes(omrade) && !erVann(x, y);
}

export function kanPlassere(by: ByTilstand, id: ByggId, x: number, y: number, unntatt?: string): boolean {
  const def = byggDef(id);
  const oppgradering = def.hjem && id === nesteHjem(by);
  if (def.nivaa > by.nivaa && !oppgradering) return false;
  let motVann = false;
  let motHavn = false;
  for (let dx = 0; dx < def.bredde; dx++) {
    for (let dy = 0; dy < def.dybde; dy++) {
      const cx = x + dx;
      const cy = y + dy;
      if (!innenfor(by, cx, cy)) return false;
      if (!def.vann && erSti(cx, cy)) return false;
      if (opptatt(by, cx, cy, unntatt)) return false;
      if (erVann(cx, cy + 1) || erVann(cx, cy - 1) || erVann(cx + 1, cy) || erVann(cx - 1, cy)) motVann = true;
      if (omradeFor(cx, cy) === "havna") motHavn = true;
    }
  }
  if (def.vann && !motVann) return false;
  if (def.havn && !motHavn) return false;
  return true;
}

const DALEN = { x0: 0, y0: 0, x1: 8, y1: 8 };

export function utsnittForPunkt(x: number, y: number): { x0: number; y0: number; x1: number; y1: number } {
  if (x >= 8 && y >= 8) return { x0: 8, y0: 8, x1: 12, y1: 12 };
  if (x >= 8) return { x0: 8, y0: 0, x1: 12, y1: 8 };
  if (y >= 8) return { x0: 0, y0: 8, x1: 8, y1: 12 };
  return { ...DALEN };
}

function innenRamme(ramme: { x0: number; y0: number; x1: number; y1: number }, x: number, y: number, bredde: number, dybde: number): boolean {
  return x >= ramme.x0 && y >= ramme.y0 && x + bredde <= ramme.x1 && y + dybde <= ramme.y1;
}

function alleTomter(by: ByTilstand, id: ByggId): { x: number; y: number; areal: number }[] {
  const def = byggDef(id);
  const funnet: { x: number; y: number; areal: number }[] = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (kanPlassere(by, id, x, y)) funnet.push({ x, y, areal: def.bredde * def.dybde });
    }
  }
  const hjem = by.bygg.find((bygg) => byggDef(bygg.bygg).hjem && !bygg.uthus);
  const hx = hjem?.x ?? 2;
  const hy = hjem?.y ?? 4;
  funnet.sort((a, b) => {
    const an = vedSidenAv(by, a.x, a.y, def.bredde, def.dybde) ? 0 : 1;
    const bn = vedSidenAv(by, b.x, b.y, def.bredde, def.dybde) ? 0 : 1;
    if (an !== bn) return an - bn;
    return Math.abs(a.x - hx) + Math.abs(a.y - hy) - (Math.abs(b.x - hx) + Math.abs(b.y - hy));
  });
  return funnet;
}

const REKKEFOLGE: ByggId[] = ["bronn", "gjerde", "vedskjul", "lekeplass", "hytte", "hus", "villa", "borg", "slott"];

/** Neste bygg barnet skal jobbe med, samme rekkefølge som handlelisten. */
export function byenErFerdig(by: ByTilstand): boolean {
  return by.bygg.some((bygg) => bygg.bygg === "slott" && bygg.ferdig);
}

export function nesteByggId(by: ByTilstand): ByggId | null {
  if (byenErFerdig(by)) return null;
  const uferdig = by.bygg.find((bygg) => !bygg.ferdig && !bygg.uthus);
  if (uferdig) return uferdig.bygg;
  const kan = byggSomKanStartes(by);
  return REKKEFOLGE.find((id) => kan.includes(id)) ?? kan[0] ?? null;
}

/** Bydelen som tegnes. Et uferdig bygg vinner. Ellers bydelen der neste bygg får plass. */
export function heleByen(by: ByTilstand): { x0: number; y0: number; x1: number; y1: number } {
  return {
    x0: 0,
    y0: 0,
    x1: by.omrader.includes("bekken") || by.omrader.includes("havna") ? 12 : 8,
    y1: by.omrader.includes("asen") || by.omrader.includes("havna") ? 12 : 8,
  };
}

/** Hele byen vises alltid (gj. 9, B3). Faste steder skal aldri falle utenfor kartet. */
export function kartUtsnitt(by: ByTilstand): { x0: number; y0: number; x1: number; y1: number } {
  return heleByen(by);
}

/** Bydelen nye bygg settes i. Holder bygg innenfor én bydel, så det blir plass til slottet. */
function byggeOmrade(by: ByTilstand): { x0: number; y0: number; x1: number; y1: number } {
  if (by.nivaa <= 2) return { ...DALEN };
  const uferdig = by.bygg.find((bygg) => !bygg.ferdig && !bygg.uthus);
  if (uferdig) return utsnittForPunkt(uferdig.x, uferdig.y);
  const hjem = by.bygg.find((bygg) => byggDef(bygg.bygg).hjem && !bygg.uthus);
  const hjemme = utsnittForPunkt(hjem?.x ?? 2, hjem?.y ?? 4);
  const maal = nesteByggId(by);
  if (!maal) return hjemme;
  const def = byggDef(maal);
  const tomter = alleTomter(by, maal);
  const passer = (ramme: { x0: number; y0: number; x1: number; y1: number }, tomt: { x: number; y: number }) =>
    innenRamme(ramme, tomt.x, tomt.y, def.bredde, def.dybde);
  if (tomter.some((tomt) => passer(hjemme, tomt))) return hjemme;
  const forste = tomter.find((tomt) => passer(utsnittForPunkt(tomt.x, tomt.y), tomt));
  return forste ? utsnittForPunkt(forste.x, forste.y) : hjemme;
}

export function ledigeTomter(by: ByTilstand, id: ByggId): { x: number; y: number; areal: number }[] {
  const def = byggDef(id);
  const ramme = byggeOmrade(by);
  return alleTomter(by, id).filter((tomt) => innenRamme(ramme, tomt.x, tomt.y, def.bredde, def.dybde));
}

function vedSidenAv(by: ByTilstand, x: number, y: number, w: number, d: number): boolean {
  for (let cx = x - 1; cx <= x + w; cx++) {
    for (let cy = y - 1; cy <= y + d; cy++) {
      if (cx >= x && cx < x + w && cy >= y && cy < y + d) continue;
      if (erLandemerke(cx, cy) || by.bygg.some((bygg) => dekker(bygg, cx, cy))) return true;
    }
  }
  return false;
}

export function tomterMedPlass(by: ByTilstand, ruter: number): { id: string; x: number; y: number; areal: number }[] {
  const svar: { id: string; x: number; y: number; areal: number }[] = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (!innenfor(by, x, y) || opptatt(by, x, y)) continue;
      let bredde = 0;
      while (innenfor(by, x + bredde, y) && !opptatt(by, x + bredde, y) && bredde < 4) bredde += 1;
      let dybde = 0;
      let ok = true;
      while (ok && dybde < 4) {
        for (let dx = 0; dx < bredde; dx++) {
          if (!innenfor(by, x + dx, y + dybde) || opptatt(by, x + dx, y + dybde)) ok = false;
        }
        if (ok) dybde += 1;
      }
      const areal = bredde * dybde;
      if (areal > 0) svar.push({ id: ruteNavn(x, y), x, y, areal });
    }
  }
  return svar.filter((tomt) => tomt.areal >= ruter).slice(0, 12);
}

/** En rute pynt kan stå på: innenfor byen, ikke vann, ikke sti, ikke under et bygg eller annen pynt. */
export function ledigPyntRute(by: ByTilstand, x: number, y: number): boolean {
  if (!innenfor(by, x, y) || erSti(x, y) || opptatt(by, x, y)) return false;
  if (x === 4 && y === 1) return false;
  return !(by.pynt ?? []).some((pynt) => pynt.x === x && pynt.y === y);
}

/** Ledige ruter ved siden av ferdige bygg, der barnet kan sette pynt. */
export function pyntRuter(by: ByTilstand, antall = 6): [number, number][] {
  const ut: [number, number][] = [];
  for (const bygg of by.bygg.filter((rad) => rad.ferdig)) {
    const def = byggDef(bygg.bygg);
    for (let dy = -1; dy <= def.dybde; dy++) {
      for (let dx = -1; dx <= def.bredde; dx++) {
        const x = bygg.x + dx;
        const y = bygg.y + dy;
        if (!ledigPyntRute(by, x, y) || ut.some((rad) => rad[0] === x && rad[1] === y)) continue;
        ut.push([x, y]);
        if (ut.length >= antall) return ut;
      }
    }
  }
  return ut;
}

export function ferdigeBygg(by: ByTilstand): ByggId[] {
  return by.bygg.filter((bygg) => bygg.ferdig).map((bygg) => bygg.bygg);
}

export function antallFerdige(by: ByTilstand): number {
  return by.bygg.filter((bygg) => bygg.ferdig).length;
}

export function kravOppfylt(by: ByTilstand): boolean {
  const antall = antallFerdige(by);
  if (by.nivaa === 1) return antall >= 3;
  if (by.nivaa === 2) return antall >= 6 && by.monsterFullfort >= 1;
  if (by.nivaa === 3) return antall >= 10 && by.besteKlokkePaRad >= 3;
  if (by.nivaa === 4) return antall >= 15 && by.kjente3d.length >= 3;
  if (by.nivaa === 5) return antall >= 21 && by.dagerAlleAvtaler >= 5;
  return by.bygg.some((bygg) => bygg.bygg === "slott" && bygg.ferdig);
}

export function nesteHjem(by: ByTilstand): ByggId | null {
  if (!kravOppfylt(by) || by.nivaa >= 6) return null;
  const neste = (by.nivaa + 1) as 2 | 3 | 4 | 5 | 6;
  return HJEM_FOR_NIVAA[neste];
}

export function byggSomKanStartes(by: ByTilstand): ByggId[] {
  const harHjem = by.bygg.some((bygg) => BYGG[bygg.bygg].hjem && !bygg.uthus && !bygg.ferdig);
  return (Object.keys(BYGG) as ByggId[]).filter((id) => {
    const def = BYGG[id];
    if (def.hjem && nesteHjem(by) === id) return !harHjem;
    if (def.nivaa > by.nivaa) return false;
    if (def.hjem) return false;
    return !by.bygg.some((bygg) => bygg.bygg === id);
  });
}
