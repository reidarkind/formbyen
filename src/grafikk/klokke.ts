import { FARGER } from "./stil";
import { minuttviserVinkel, timeviserVinkel } from "../tid/tid";
import { polygon, svgDokument } from "./svg";

export interface TallPos {
  tall: number;
  x: number;
  y: number;
}

export function viserPunkter(cx: number, cy: number, lengde: number, bredde: number, grader: number): [number, number][] {
  const rad = (grader * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  const px = -dy;
  const py = dx;
  const hw = bredde / 2;
  return [
    [cx + px * hw, cy + py * hw],
    [cx - px * hw, cy - py * hw],
    [cx + dx * lengde - px * hw * 0.25, cy + dy * lengde - py * hw * 0.25],
    [cx + dx * lengde + px * hw * 0.25, cy + dy * lengde + py * hw * 0.25],
  ];
}

export function viserRetning(punkter: readonly (readonly [number, number])[]): number {
  const cx = ((punkter[0]?.[0] ?? 0) + (punkter[1]?.[0] ?? 0)) / 2;
  const cy = ((punkter[0]?.[1] ?? 0) + (punkter[1]?.[1] ?? 0)) / 2;
  const tx = ((punkter[2]?.[0] ?? 0) + (punkter[3]?.[0] ?? 0)) / 2;
  const ty = ((punkter[2]?.[1] ?? 0) + (punkter[3]?.[1] ?? 0)) / 2;
  const grader = (Math.atan2(tx - cx, -(ty - cy)) * 180) / Math.PI;
  return (grader + 360) % 360;
}

export function tallPosisjoner(cx = 120, cy = 120, radius = 96): TallPos[] {
  return Array.from({ length: 12 }, (_, i) => {
    const tall = i + 1;
    const rad = (tall * 30 * Math.PI) / 180;
    return { tall, x: cx + Math.sin(rad) * radius * 0.78, y: cy - Math.cos(rad) * radius * 0.78 };
  });
}

/** Urskive uten <text>. Tallene legges i UI-laget. */
export function urskive(minutter: number | null): string {
  const cx = 120;
  const cy = 120;
  const deler: string[] = [];
  deler.push(
    `<circle cx="${cx}" cy="${cy}" r="100" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="6" data-ramme="ur"/>`,
  );
  for (let i = 0; i < 60; i++) {
    const rad = (i * 6 * Math.PI) / 180;
    const lang = i % 5 === 0;
    const indre = lang ? 78 : 88;
    const ytre = 96;
    const x1 = cx + Math.sin(rad) * indre;
    const y1 = cy - Math.cos(rad) * indre;
    const x2 = cx + Math.sin(rad) * ytre;
    const y2 = cy - Math.cos(rad) * ytre;
    deler.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${FARGER.kontur}" stroke-width="${lang ? 3 : 2}" stroke-linecap="round"/>`,
    );
  }
  if (minutter !== null) {
    const time = viserPunkter(cx, cy, 48, 10, timeviserVinkel(minutter));
    const minutt = viserPunkter(cx, cy, 77, 6, minuttviserVinkel(minutter));
    deler.push(polygon(time, FARGER.kontur, 2));
    deler.push(polygon(minutt, FARGER.kontur, 2));
  }
  deler.push(`<circle cx="${cx}" cy="${cy}" r="7" fill="${FARGER.kontur}" stroke="${FARGER.kontur}" stroke-width="2"/>`);
  return svgDokument(deler.join(""), 240, 240);
}
