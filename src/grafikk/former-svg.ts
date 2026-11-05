import { FARGER, type Farge } from "./stil";
import { kvadratPunkter, regulær } from "./geometri";
import { polygon, svgDokument } from "./svg";
import type { Form2dId, Form3dId } from "../former/definisjoner";

const FORMFARGE: Record<string, Farge> = {
  sirkel: FARGER.takBlatt,
  oval: FARGER.vann,
  halvsirkel: FARGER.vannSkygge,
  trekant: FARGER.takRodt,
  kvadrat: FARGER.tre,
  rektangel: FARGER.mur,
  femkant: FARGER.aksentGronn,
  sekskant: FARGER.takBlattSkygge,
  kule: FARGER.vann,
  kube: FARGER.mur,
  sylinder: FARGER.stein,
  kjegle: FARGER.takRodt,
  pyramide: FARGER.tre,
  prisme: FARGER.gress,
};

function fargeFor(id: string): Farge {
  return FORMFARGE[id] ?? FARGER.tre;
}

export function formSvg(id: Form2dId | Form3dId | string, stor = 96, rotasjon = -Math.PI / 2, fyll?: Farge): string {
  const cx = stor / 2;
  const cy = stor / 2;
  const r = stor * 0.36;
  const farge = fyll ?? fargeFor(id);
  if (id === "kule") {
    return svgDokument(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>
      <ellipse cx="${cx - r * 0.28}" cy="${cy - r * 0.28}" rx="${r * 0.28}" ry="${r * 0.18}" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>`,
      stor,
      stor,
    );
  }
  if (id === "sirkel") {
    return svgDokument(
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "oval") {
    return svgDokument(
      `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.62}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "halvsirkel") {
    const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`;
    return svgDokument(`<path d="${d}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>`, stor, stor);
  }
  if (id === "kube") {
    const s = r * 1.15;
    const topp: [number, number][] = [
      [cx, cy - s],
      [cx + s * 0.85, cy - s * 0.45],
      [cx, cy],
      [cx - s * 0.85, cy - s * 0.45],
    ];
    const venstre: [number, number][] = [
      [cx - s * 0.85, cy - s * 0.45],
      [cx, cy],
      [cx, cy + s * 0.85],
      [cx - s * 0.85, cy + s * 0.4],
    ];
    const hoyre: [number, number][] = [
      [cx, cy],
      [cx + s * 0.85, cy - s * 0.45],
      [cx + s * 0.85, cy + s * 0.4],
      [cx, cy + s * 0.85],
    ];
    return svgDokument(
      `${polygon(venstre, FARGER.murSkygge, 2)}${polygon(hoyre, farge, 2)}${polygon(topp, FARGER.papir, 2)}`,
      stor,
      stor,
    );
  }
  if (id === "rektangel") {
    const punkter: [number, number][] = [
      [cx - r, cy - r * 0.62],
      [cx + r, cy - r * 0.62],
      [cx + r, cy + r * 0.62],
      [cx - r, cy + r * 0.62],
    ];
    return svgDokument(polygon(punkter, farge), stor, stor);
  }
  if (id === "kvadrat") {
    const side = r * 1.5;
    return svgDokument(polygon(kvadratPunkter(cx - side / 2, cy - side / 2, side), farge), stor, stor);
  }
  if (id === "sylinder") {
    const rx = r * 0.72;
    const ry = r * 0.28;
    const topp = cy - r * 0.5;
    const bunn = cy + r * 0.5;
    return svgDokument(
      `<rect x="${cx - rx}" y="${topp}" width="${rx * 2}" height="${bunn - topp}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${bunn}" rx="${rx}" ry="${ry}" fill="${FARGER.steinSkygge}" stroke="${FARGER.kontur}" stroke-width="3"/>
      <ellipse cx="${cx}" cy="${topp}" rx="${rx}" ry="${ry}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "kjegle") {
    const topp = cy - r;
    const bunn = cy + r * 0.45;
    return svgDokument(
      `<polygon points="${cx},${topp} ${cx - r},${bunn} ${cx + r},${bunn}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="${cx}" cy="${bunn}" rx="${r}" ry="${r * 0.28}" fill="${FARGER.takRodtSkygge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      stor,
      stor,
    );
  }
  if (id === "pyramide") {
    const topp = cy - r;
    const bunn = cy + r * 0.55;
    const midt = cx;
    return svgDokument(
      `<polygon points="${midt},${topp} ${cx - r},${bunn} ${midt},${bunn - r * 0.15}" fill="${FARGER.treSkygge}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <polygon points="${midt},${topp} ${midt},${bunn - r * 0.15} ${cx + r},${bunn}" fill="${farge}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
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
    const ende: [number, number][] = [
      [cx - r, cy - r * 0.2],
      [cx - r * 0.2, cy - r * 0.7],
      [cx - r * 0.2, cy + r * 0.15],
    ];
    return svgDokument(`${polygon(punkter, farge)}${polygon(ende, FARGER.gressSkygge, 2)}`, stor, stor);
  }
  const n = id === "trekant" ? 3 : id === "femkant" ? 5 : 6;
  return svgDokument(polygon(regulær(n, cx, cy, r, rotasjon), farge), stor, stor);
}
