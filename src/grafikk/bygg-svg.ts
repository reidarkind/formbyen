import type { ByggId, ByTilstand } from "../typer";
import { byggDef } from "../bygg/katalog";
import { celle } from "../bygg/kart";
import { FARGER, himmelFarge, materialeFarger, takFarger, type Farge } from "./stil";
import { himmel } from "../tid/tid";
import { polygon, svgDokument } from "./svg";

export function iso(x: number, y: number, z: number, speil = false): [number, number] {
  const X = speil ? y : x;
  const Y = speil ? x : y;
  return [(X - Y) * 32, (X + Y) * 16 - z * 48];
}

function boks(
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  lys: Farge,
  skygge: Farge,
  tak: Farge,
  speil: boolean,
): string {
  const venstre = [iso(x, y + d, 0, speil), iso(x + w, y + d, 0, speil), iso(x + w, y + d, h, speil), iso(x, y + d, h, speil)];
  const hoyre = [iso(x + w, y, 0, speil), iso(x + w, y + d, 0, speil), iso(x + w, y + d, h, speil), iso(x + w, y, h, speil)];
  const topp = [iso(x, y, h, speil), iso(x + w, y, h, speil), iso(x + w, y + d, h, speil), iso(x, y + d, h, speil)];
  const skyggeFlate = [iso(x, y + d, 0, speil), iso(x + w + 0.25, y + d + 0.25, 0, speil), iso(x + w + 0.25, y + 0.25, 0, speil), iso(x, y, 0, speil)];
  return [
    polygon(skyggeFlate, FARGER.kontur, 2, ` fill-opacity="0.2"`),
    polygon(speil ? venstre : hoyre, skygge),
    polygon(speil ? hoyre : venstre, lys),
    polygon(topp, tak),
  ].join("");
}

function vinduPaVegg(x: number, y: number, d: number, h: number, kveld: boolean, speil: boolean): string {
  const z0 = h * 0.45;
  const z1 = h * 0.75;
  const u0 = x + 0.55;
  const u1 = x + 0.85;
  const farge = kveld ? FARGER.vinduslys : FARGER.glass;
  const punkter = [iso(u0, y + d, z0, speil), iso(u1, y + d, z0, speil), iso(u1, y + d, z1, speil), iso(u0, y + d, z1, speil)];
  return polygon(punkter, farge, 2);
}

export function tegnBygg(id: ByggId, kveld = false, speil = false): string {
  const def = byggDef(id);
  const mat = materialeFarger(def.materiale);
  const tak = def.tak === "bla" ? takFarger("bla") : takFarger("rod");
  const hoyde = def.etasjer;
  const deler: string[] = [];
  if (id === "bronn" || id === "vanntaarn" || id === "fyrtarn") {
    const topp = iso(0.5, 0.5, hoyde, speil);
    const bunn = iso(0.5, 0.5, 0, speil);
    deler.push(
      `<rect x="${bunn[0] - 18}" y="${topp[1]}" width="36" height="${bunn[1] - topp[1]}" fill="${mat.lys}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
      `<ellipse cx="${topp[0]}" cy="${topp[1]}" rx="18" ry="8" fill="${tak.lys}" stroke="${FARGER.kontur}" stroke-width="3"/>`,
    );
    if (kveld && id === "fyrtarn") {
      deler.push(`<circle cx="${topp[0]}" cy="${topp[1] - 10}" r="6" fill="${FARGER.vinduslys}" stroke="${FARGER.kontur}" stroke-width="2"/>`);
    }
  } else {
    deler.push(boks(0, 0, def.bredde, def.dybde, hoyde, mat.lys, mat.skygge, tak.lys, speil));
    if (def.tak !== "ingen") {
      const peak = hoyde + 0.7;
      const mote = iso(def.bredde / 2, def.dybde / 2, peak, speil);
      const a = iso(0, def.dybde, hoyde, speil);
      const b = iso(def.bredde, def.dybde, hoyde, speil);
      const c = iso(def.bredde, 0, hoyde, speil);
      const d = iso(0, 0, hoyde, speil);
      deler.push(polygon([a, b, mote], tak.lys, 3));
      deler.push(polygon([b, c, mote], tak.skygge, 3));
      deler.push(polygon([c, d, mote], tak.lys, 3));
      deler.push(polygon([d, a, mote], tak.skygge, 3));
    }
    deler.push(vinduPaVegg(0, 0, def.dybde, hoyde, kveld, speil));
  }
  const alle = deler.join("");
  const utenFarge = alle.replace(/#[0-9A-Fa-f]{3,8}/g, " ");
  const tall = [...utenFarge.matchAll(/-?\d+\.?\d*/g)].map(Number).filter((n) => Number.isFinite(n));
  const minX = Math.min(...tall, 0) - 8;
  const minY = Math.min(...tall, 0) - 8;
  const maxX = Math.max(...tall, 64) + 8;
  const maxY = Math.max(...tall, 64) + 8;
  return svgDokument(alle, Math.ceil(maxX - minX), Math.ceil(maxY - minY), Math.floor(minX), Math.floor(minY));
}

export function tegnKart(by: ByTilstand, tid: number, leggetid = 20 * 60): string {
  const kveld = tid >= 18 * 60 && tid < leggetid;
  const flater: string[] = [];
  const punkter: [number, number][] = [];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const rute = celle(x, y);
      if (!rute || !by.omrader.includes(rute.omrade)) continue;
      const a = iso(x, y, 0);
      const b = iso(x + 1, y, 0);
      const c = iso(x + 1, y + 1, 0);
      const d = iso(x, y + 1, 0);
      punkter.push(a, b, c, d);
      const farge = rute.slag === "vann" ? FARGER.vann : rute.slag === "sti" ? FARGER.vei : FARGER.gress;
      flater.push(polygon([a, b, c, d], farge, 2));
    }
  }
  for (const plassert of by.bygg) {
    const def = byggDef(plassert.bygg);
    const mat = materialeFarger(def.materiale);
    const tak = def.tak === "bla" ? takFarger("bla").lys : takFarger("rod").lys;
    const h = plassert.ferdig ? def.etasjer : Math.max(0.4, def.etasjer * (plassert.steg / def.oppskrift.length));
    const origin = iso(plassert.x, plassert.y, 0);
    punkter.push(origin);
    flater.push(
      boks(plassert.x, plassert.y, def.bredde, def.dybde, h, mat.lys, mat.skygge, tak, false),
      vinduPaVegg(plassert.x, plassert.y, def.dybde, Math.max(h, 0.8), kveld && plassert.ferdig, false),
    );
  }
  const minX = Math.min(...punkter.map((p) => p[0])) - 16;
  const minY = Math.min(...punkter.map((p) => p[1])) - 80;
  const maxX = Math.max(...punkter.map((p) => p[0])) + 16;
  const maxY = Math.max(...punkter.map((p) => p[1])) + 16;
  const innhold = flater.join("").replaceAll(/(-?\d+\.\d),(-?\d+\.\d)/g, (_, x: string, y: string) => {
    return `${(Number(x) - minX).toFixed(1)},${(Number(y) - minY).toFixed(1)}`;
  });
  const himmelF = himmelFarge(himmel(tid));
  return svgDokument(`<rect width="100%" height="100%" fill="${himmelF}"/>${innhold}`, Math.ceil(maxX - minX), Math.ceil(maxY - minY));
}
