import type { ByggId, ByTilstand } from "../typer";
import { byggDef } from "../bygg/katalog";
import { celle } from "../bygg/kart";
import { LANDMERKE } from "../bygg/landemerker";
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

export interface KartValg {
  figur?: { x: number; y: number };
  garFra?: { x: number; y: number };
  puls?: string | null;
  aktivitet?: string | null;
  tomter?: { x: number; y: number }[];
}

export function tegnKart(by: ByTilstand, tid: number, leggetid = 20 * 60, valg: KartValg = {}): string {
  const kveld = tid >= 18 * 60 && tid < leggetid;
  const flater: string[] = [];
  const punkter: [number, number][] = [];
  const lag: { sum: number; svg: string }[] = [];
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
  for (const tomt of valg.tomter ?? []) {
    const a = iso(tomt.x, tomt.y, 0);
    const b = iso(tomt.x + 1, tomt.y, 0);
    const c = iso(tomt.x + 1, tomt.y + 1, 0);
    const d = iso(tomt.x, tomt.y + 1, 0);
    const klasse = valg.puls === "tomt" ? "puls" : "";
    lag.push({
      sum: tomt.x + tomt.y - 0.1,
      svg: `<g data-sted="tomt:${tomt.x},${tomt.y}" class="${klasse}">${polygon([a, b, c, d], FARGER.papir, 2, ' stroke-dasharray="6 4" fill-opacity="0.55"')}</g>`,
    });
  }
  for (const [sted, punkt] of Object.entries(LANDMERKE)) {
    const mur = sted === "tannlege";
    const mat = materialeFarger(mur ? "mur" : "tre");
    const tak = sted === "butikk" ? takFarger("bla").lys : takFarger("rod").lys;
    const hoyde = sted === "torg" ? 1.6 : sted === "svommehall" ? 0.55 : 0.9;
    punkter.push(iso(punkt.x, punkt.y, 0));
    const klasse = valg.puls === sted ? "puls" : "";
    lag.push({
      sum: punkt.x + punkt.y,
      svg: `<g data-sted="${sted}" class="${klasse}">${boks(punkt.x, punkt.y, 1, 1, hoyde, mat.lys, mat.skygge, tak, false)}</g>`,
    });
  }
  for (const plassert of by.bygg) {
    const def = byggDef(plassert.bygg);
    const mat = materialeFarger(def.materiale);
    const tak = def.tak === "bla" ? takFarger("bla").lys : takFarger("rod").lys;
    const h = plassert.ferdig ? def.etasjer : Math.max(0.4, def.etasjer * (plassert.steg / def.oppskrift.length));
    punkter.push(iso(plassert.x, plassert.y, 0));
    const merke = def.hjem && !plassert.uthus ? "hjemme" : !plassert.ferdig ? `bygg:${plassert.instans}` : valg.aktivitet === plassert.bygg ? "aktivitet" : `bygg:${plassert.instans}`;
    const klasse = valg.puls === merke ? "puls" : "";
    lag.push({
      sum: plassert.x + plassert.y,
      svg: `<g data-sted="${merke}" class="${klasse}">${boks(plassert.x, plassert.y, def.bredde, def.dybde, h, mat.lys, mat.skygge, tak, false)}${vinduPaVegg(plassert.x, plassert.y, def.dybde, Math.max(h, 0.8), kveld && plassert.ferdig, false)}</g>`,
    });
  }
  lag.sort((a, b) => a.sum - b.sum);
  for (const rad of lag) flater.push(rad.svg);
  const minX = Math.min(...punkter.map((p) => p[0])) - 16;
  const minY = Math.min(...punkter.map((p) => p[1])) - 80;
  const maxX = Math.max(...punkter.map((p) => p[0])) + 16;
  const maxY = Math.max(...punkter.map((p) => p[1])) + 16;
  const flytt = (punkt: [number, number]) => [(punkt[0] - minX).toFixed(1), (punkt[1] - minY).toFixed(1)];
  const innhold = flater.join("").replaceAll(/(-?\d+\.\d),(-?\d+\.\d)/g, (_, x: string, y: string) => {
    return `${(Number(x) - minX).toFixed(1)},${(Number(y) - minY).toFixed(1)}`;
  });
  let figur = "";
  if (valg.figur) {
    const [cx, cy] = flytt(iso(valg.figur.x + 0.55, valg.figur.y + 0.55, 0.35));
    const fra = valg.garFra ? flytt(iso(valg.garFra.x + 0.55, valg.garFra.y + 0.55, 0.35)) : null;
    const anim = fra
      ? `<animate attributeName="cx" from="${fra[0]}" to="${cx}" dur="1s" fill="freeze"/><animate attributeName="cy" from="${fra[1]}" to="${cy}" dur="1s" fill="freeze"/>`
      : "";
    const [px, py] = flytt(iso(valg.figur.x + 0.85, valg.figur.y + 0.3, 0.15));
    figur = `<circle class="figur" cx="${cx}" cy="${cy}" r="8" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="3">${anim}</circle><circle cx="${px}" cy="${py}" r="5" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  }
  const himmelF = himmelFarge(himmel(tid));
  return svgDokument(`<rect width="100%" height="100%" fill="${himmelF}"/>${innhold}${figur}`, Math.ceil(maxX - minX), Math.ceil(maxY - minY));
}

export function tegnFremdrift(id: ByggId, steg: number, maks: number): string {
  const def = byggDef(id);
  const mat = materialeFarger(def.materiale);
  const tak = def.tak === "bla" ? takFarger("bla").lys : takFarger("rod").lys;
  const full = boks(0, 0, def.bredde, def.dybde, def.etasjer, mat.lys, mat.skygge, tak, false).replaceAll(
    "<polygon ",
    '<polygon fill-opacity="0.2" stroke-dasharray="5 4" ',
  );
  const hoyde = Math.max(0.35, def.etasjer * (steg / Math.max(1, maks)));
  const delvis = steg > 0 ? boks(0, 0, def.bredde, def.dybde, hoyde, mat.lys, mat.skygge, tak, false) : "";
  const alle = `${full}${delvis}`;
  const utenFarge = alle.replace(/#[0-9A-Fa-f]{3,8}/g, " ");
  const tall = [...utenFarge.matchAll(/-?\d+\.?\d*/g)].map(Number).filter((n) => Number.isFinite(n));
  const minX = Math.min(...tall, 0) - 8;
  const minY = Math.min(...tall, 0) - 8;
  const maxX = Math.max(...tall, 64) + 8;
  const maxY = Math.max(...tall, 64) + 8;
  const innhold = alle.replaceAll(/(-?\d+\.\d),(-?\d+\.\d)/g, (_, x: string, y: string) => {
    return `${(Number(x) - minX).toFixed(1)},${(Number(y) - minY).toFixed(1)}`;
  });
  return svgDokument(innhold, Math.ceil(maxX - minX), Math.ceil(maxY - minY));
}
