import { byggDef, type Plass } from "../bygg/katalog";
import type { ByggId } from "../typer";
import { FARGER } from "./stil";
import { svgDokument } from "./svg";

function boks(x: number, y: number, b: number, h: number, fyll: string, stiplet: boolean, bredde: 2 | 3 = 3): string {
  const ekstra = stiplet ? ' stroke-dasharray="5 4" fill-opacity="0.25"' : "";
  return `<rect x="${x}" y="${y}" width="${b}" height="${h}" fill="${fyll}" stroke="${FARGER.kontur}" stroke-width="${bredde}"${ekstra}/>`;
}

/** Én del, tegnet i sin boks. Samme tegning på bygget, i kurven og i handlelista. */
export function delFragment(vare: string, plass: Plass, stiplet: boolean, kveld = false): string {
  const { x, y, b, h } = plass;
  const strek = stiplet ? ' stroke-dasharray="5 4" fill-opacity="0.25"' : "";
  if (vare.startsWith("tak")) {
    const fyll = vare.includes("bla") || vare.includes("blatt") ? FARGER.takBlatt : FARGER.takRodt;
    const topp = `${x + b / 2},${y}`;
    return `<polygon points="${x},${y + h} ${topp} ${x + b},${y + h}" fill="${fyll}" stroke="${FARGER.kontur}" stroke-width="3" stroke-linejoin="round"${strek}/>`;
  }
  if (vare.startsWith("dor")) {
    const knott = `<circle cx="${x + b - 5}" cy="${y + h / 2}" r="2" fill="${FARGER.kontur}"/>`;
    return `${boks(x, y, b, h, FARGER.papirSkygge, stiplet, 2)}${stiplet ? "" : knott}`;
  }
  if (vare.startsWith("vindu")) {
    const fyll = kveld ? FARGER.vinduslys : FARGER.glass;
    if (vare.includes("sirkel")) {
      const r = Math.min(b, h) / 2;
      return `<circle cx="${x + b / 2}" cy="${y + h / 2}" r="${r}" fill="${fyll}" stroke="${FARGER.kontur}" stroke-width="2"${strek}/>`;
    }
    return boks(x, y, b, h, fyll, stiplet, 2);
  }
  if (vare === "planke") return boks(x, y, b, h, FARGER.tre, stiplet, 2);
  if (vare === "kloss-sylinder" || (vare === "vegg-stein" && h <= 24)) {
    if (vare === "vegg-stein") {
      const r = Math.min(6, h / 2);
      const antall = Math.max(3, Math.floor(b / (r * 2 + 2)));
      return Array.from({ length: antall }, (_, i) => {
        const cx = x + r + 1 + i * ((b - r * 2) / Math.max(1, antall - 1));
        return `<circle cx="${cx.toFixed(1)}" cy="${y + h / 2}" r="${r}" fill="${FARGER.stein}" stroke="${FARGER.kontur}" stroke-width="2"${strek}/>`;
      }).join("");
    }
    const ry = Math.max(4, h * 0.16);
    const topp = y + ry;
    const bunn = y + h - ry;
    return [
      `<rect x="${x}" y="${topp}" width="${b}" height="${Math.max(1, bunn - topp)}" fill="${FARGER.stein}" stroke="${FARGER.kontur}" stroke-width="3"${strek}/>`,
      `<ellipse cx="${x + b / 2}" cy="${bunn}" rx="${b / 2}" ry="${ry}" fill="${FARGER.steinSkygge}" stroke="${FARGER.kontur}" stroke-width="3"${strek}/>`,
      `<ellipse cx="${x + b / 2}" cy="${topp}" rx="${b / 2}" ry="${ry}" fill="${FARGER.stein}" stroke="${FARGER.kontur}" stroke-width="3"${strek}/>`,
    ].join("");
  }
  if (vare.startsWith("vegg")) {
    const fyll = vare.includes("stein") ? FARGER.stein : vare.includes("mur") ? FARGER.mur : FARGER.tre;
    return boks(x, y, b, h, fyll, stiplet);
  }
  if (vare === "kloss-kjegle" || vare === "kloss-pyramide") {
    return `<polygon points="${x + b / 2},${y} ${x},${y + h} ${x + b},${y + h}" fill="${FARGER.takRodt}" stroke="${FARGER.kontur}" stroke-width="3" stroke-linejoin="round"${strek}/>`;
  }
  if (vare.startsWith("kloss")) return boks(x, y, b, h, FARGER.mur, stiplet);
  return boks(x, y, b, h, FARGER.tre, stiplet, 2);
}

export function delSvg(vare: string, stor = 64): string {
  return svgDokument(delFragment(vare, { x: 4, y: 4, b: stor - 8, h: stor - 8 }, false), stor, stor);
}

/** Fasade sett forfra. Ferdige deler er heltrukket. Neste del er stiplet. */
export function fasadeInnhold(id: ByggId, steg: number, kveld = false): string {
  const def = byggDef(id);
  const deler = def.oppskrift.map((trinn, indeks) => {
    if (!trinn.plass) return "";
    if (indeks < steg) return delFragment(trinn.vare, trinn.plass, false, kveld);
    if (indeks === steg) return delFragment(trinn.vare, trinn.plass, true, kveld);
    return "";
  });
  return deler.join("");
}

export function fasadeSvg(id: ByggId, steg: number, kveld = false): string {
  return svgDokument(fasadeInnhold(id, steg, kveld), 100, 120);
}
