import { FARGER } from "./stil";
import { kvadratPunkter, regulær } from "./geometri";
import { polygon, svgDokument } from "./svg";
import type { Form2dId, Form3dId } from "../former/definisjoner";

export function formSvg(id: Form2dId | Form3dId | string, stor = 96, rotasjon = -Math.PI / 2): string {
  const cx = stor / 2;
  const cy = stor / 2;
  const r = stor * 0.36;
  if (id === "sirkel" || id === "kule") {
    return svgDokument(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "oval") {
    return svgDokument(
      `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "halvsirkel") {
    const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
    return svgDokument(`<path d="${d}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3"/>`, stor, stor);
  }
  if (id === "rektangel") {
    const punkter: [number, number][] = [
      [cx - r, cy - r * 0.62],
      [cx + r, cy - r * 0.62],
      [cx + r, cy + r * 0.62],
      [cx - r, cy + r * 0.62],
    ];
    return svgDokument(polygon(punkter, FARGER.aksentGul), stor, stor);
  }
  if (id === "kvadrat" || id === "kube") {
    const side = r * 1.5;
    return svgDokument(polygon(kvadratPunkter(cx - side / 2, cy - side / 2, side), FARGER.aksentGul), stor, stor);
  }
  if (id === "sylinder") {
    const rx = r * 0.72;
    const ry = r * 0.28;
    const topp = cy - r * 0.5;
    const bunn = cy + r * 0.5;
    return svgDokument(
      `<rect x="${cx - rx}" y="${topp}" width="${rx * 2}" height="${bunn - topp}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${bunn}" rx="${rx}" ry="${ry}" fill="${FARGER.aksentGulSkygge}" stroke="${FARGER.kontur}" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${topp}" rx="${rx}" ry="${ry}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "kjegle" || id === "pyramide") {
    const topp = cy - r;
    const bunn = cy + r * 0.45;
    return svgDokument(
      `<polygon points="${cx},${topp} ${cx - r},${bunn} ${cx + r},${bunn}" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="${cx}" cy="${bunn}" rx="${r}" ry="${r * 0.28}" fill="${FARGER.aksentGulSkygge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "prisme") {
    const punkter: [number, number][] = [
      [cx - r, cy - r * 0.2],
      [cx - r * 0.2, cy - r * 0.7],
      [cx + r, cy - r * 0.7],
      [cx + r * 0.2, cy - r * 0.2],
      [cx + r * 0.2, cy + r * 0.7],
      [cx - r, cy + r * 0.7],
    ];
    return svgDokument(polygon(punkter, FARGER.aksentGul), stor, stor);
  }
  const n = id === "trekant" || id === "kjegle" || id === "pyramide" ? 3 : id === "femkant" ? 5 : id === "prisme" ? 3 : 6;
  const fyll = id === "sylinder" || id === "prisme" ? FARGER.aksentGulSkygge : FARGER.aksentGul;
  return svgDokument(polygon(regulær(n, cx, cy, r, rotasjon), fyll), stor, stor);
}
