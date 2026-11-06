import type { ByggId, ByTilstand } from "../typer";
import { byggDef } from "../bygg/katalog";
import { celle, heleByen, kartUtsnitt, PYNTEBU, ruteNavn, TAARN } from "../bygg/kart";
import { boligen, LANDMERKE } from "../bygg/landemerker";
import { FARGER, himmelFarge } from "./stil";
import { himmel } from "../tid/tid";
import { fasadeInnhold, fasadeSvg } from "./fasade";
import { svgDokument } from "./svg";
import { pyntInnhold } from "./pynt-svg";

const RUTE = 44;

export function tegnBygg(id: ByggId, kveld = false): string {
  const def = byggDef(id);
  return fasadeSvg(id, def.oppskrift.length, kveld);
}

export interface KartValg {
  figur?: { x: number; y: number };
  garFra?: { x: number; y: number };
  puls?: string | null;
  aktivitet?: string | null;
  tomter?: { x: number; y: number }[];
  hele?: boolean;
  /** Navn på skiltene, hentet fra ordboka på språket som er valgt. */
  navn?: Partial<Record<string, string>>;
  /** Steder med ledige plasser for pynt, med pulserende «+» (gj. 10, C4). */
  pyntOmrader?: { id: string; ramme: { x0: number; y0: number; x1: number; y1: number } }[];
  /** Bare dette utsnittet, uten akser og skilt. Brukes når et sted vises forstørret. */
  ramme?: { x0: number; y0: number; x1: number; y1: number };
}

const STANDARD_NAVN: Record<string, string> = {
  butikk: "Butikk",
  torg: "Torget",
  tannlege: "Tannlege",
  svommehall: "Svømmehall",
  barnehage: "Barnehage",
  hjemme: "Hjem",
  pynt: "Pyntebu",
  taarn: "Tårnet",
};


/** Trykkflate rundt (x, y, b, h) med 26 ekstra på hver side. Ved kanten skyves den inn, så den aldri går utenfor kartet (gj. 10, C6). */
function treff(x: number, y: number, b: number, h: number, bredde: number, hoyde: number, dx = 0, dy = 0): string {
  const w = Math.min(b + 52, bredde);
  const hh = Math.min(h + 52, hoyde);
  const x0 = Math.min(Math.max(-dx, x - 26), bredde - dx - w);
  const y0 = Math.min(Math.max(-dy, y - 26), hoyde - dy - hh);
  return `<rect class="treff" x="${x0}" y="${y0}" width="${w}" height="${hh}" fill="${FARGER.papir}" fill-opacity="0"/>`;
}

function innen(x: number, y: number, ramme: { x0: number; y0: number; x1: number; y1: number }): boolean {
  return x >= ramme.x0 && x < ramme.x1 && y >= ramme.y0 && y < ramme.y1;
}

function merkeFor(by: ByTilstand, instans: string, valg: KartValg): string {
  const plassert = by.bygg.find((bygg) => bygg.instans === instans);
  if (!plassert) return "hjemme";
  if (!plassert.ferdig) return `bygg:${plassert.instans}`;
  const def = byggDef(plassert.bygg);
  if (def.hjem && !plassert.uthus) return "hjemme";
  if (valg.aktivitet && valg.aktivitet === plassert.bygg) return "aktivitet";
  return `bygg:${plassert.instans}`;
}

function landemerke(sted: string): string {
  if (sted === "butikk") {
    return `<polygon points="4,20 22,4 40,20" fill="${FARGER.takBlatt}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <rect x="6" y="20" width="32" height="18" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <rect x="10" y="24" width="10" height="8" fill="${FARGER.glass}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <rect x="24" y="24" width="10" height="8" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  }
  if (sted === "torg") {
    return `<rect x="18" y="6" width="8" height="22" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <circle cx="22" cy="6" r="4" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <ellipse cx="16" cy="34" rx="12" ry="5" fill="${FARGER.vann}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  }
  if (sted === "barnehage") {
    // Lite hus med lekestativ (gj. 10, C6).
    return `<polygon points="4,18 14,8 24,18" fill="${FARGER.aksentGronn}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <rect x="6" y="18" width="16" height="18" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <rect x="11" y="26" width="6" height="10" fill="${FARGER.takRodt}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <path d="M27 36 L32 16 L37 36 M29 28 H35" fill="none" stroke="${FARGER.kontur}" stroke-width="2" stroke-linecap="round"/>
      <path d="M32 16 L40 30" stroke="${FARGER.takBlatt}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (sted === "tannlege") {
    return `<rect x="6" y="16" width="32" height="22" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <circle cx="16" cy="18" r="6" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>
      <circle cx="28" cy="18" r="6" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  }
  return `<rect x="4" y="14" width="36" height="22" fill="${FARGER.vann}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <path d="M6 24 Q14 18 22 24 T38 24" fill="none" stroke="${FARGER.papir}" stroke-width="2"/>
    <path d="M6 30 Q14 24 22 30 T38 30" fill="none" stroke="${FARGER.kontur}" stroke-width="2"/>`;
}

function figurVedSiden(by: ByTilstand, x: number, y: number, ramme: { x0: number; y0: number; x1: number; y1: number }): { x: number; y: number } {
  const bygg = by.bygg.find((rad) => rad.x === x && rad.y === y);
  if (!bygg) return { x, y };
  const def = byggDef(bygg.bygg);
  if (innen(x + def.bredde, y, ramme)) return { x: x + def.bredde, y };
  if (innen(x, y + def.dybde, ramme)) return { x, y: y + def.dybde };
  return { x, y };
}

function figurGruppe(x: number, y: number, fra: { x: number; y: number } | null, ramme: { x0: number; y0: number }): string {
  const tx = (x - ramme.x0) * RUTE + 2;
  const ty = (y - ramme.y0) * RUTE;
  const person = `<circle cx="16" cy="10" r="6" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="8" y="16" width="16" height="14" fill="${FARGER.takBlatt}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="10" y="30" width="5" height="10" fill="${FARGER.kontur}"/>
    <rect x="17" y="30" width="5" height="10" fill="${FARGER.kontur}"/>
    <ellipse cx="34" cy="26" rx="6" ry="4" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  if (!fra) return `<g class="figur" transform="translate(${tx} ${ty})">${person}</g>`;
  const fx = (fra.x - ramme.x0) * RUTE + 2;
  const fy = (fra.y - ramme.y0) * RUTE;
  return `<g class="figur" transform="translate(${tx} ${ty})"><animateTransform attributeName="transform" type="translate" from="${fx} ${fy}" to="${tx} ${ty}" dur="1s" fill="freeze"/>${person}</g>`;
}

export function tegnKart(by: ByTilstand, tid: number, leggetid = 20 * 60, valg: KartValg = {}): string {
  const ramme = valg.ramme ?? (valg.hele ? heleByen(by) : kartUtsnitt(by));
  const kolonner = ramme.x1 - ramme.x0;
  const rader = ramme.y1 - ramme.y0;
  const kveld = tid >= 18 * 60 && tid < leggetid;
  const dekket = new Set<string>();
  for (const plassert of by.bygg) {
    const def = byggDef(plassert.bygg);
    for (let dy = 0; dy < def.dybde; dy++) {
      for (let dx = 0; dx < def.bredde; dx++) dekket.add(`${plassert.x + dx},${plassert.y + dy}`);
    }
  }
  const flater: string[] = [];
  for (let y = ramme.y0; y < ramme.y1; y++) {
    for (let x = ramme.x0; x < ramme.x1; x++) {
      const rute = celle(x, y);
      const farge = rute?.slag === "vann" ? FARGER.vann : rute?.slag === "sti" ? FARGER.vei : FARGER.gress;
      const px = (x - ramme.x0) * RUTE;
      const py = (y - ramme.y0) * RUTE;
      const strek = dekket.has(`${x},${y}`) ? "" : ` stroke="${FARGER.kontur}" stroke-width="2"`;
      flater.push(`<rect x="${px}" y="${py}" width="${RUTE}" height="${RUTE}" fill="${farge}"${strek}/>`);
    }
  }
  for (const tomt of valg.tomter ?? []) {
    if (!innen(tomt.x, tomt.y, ramme)) continue;
    const px = (tomt.x - ramme.x0) * RUTE + 6;
    const py = (tomt.y - ramme.y0) * RUTE + 6;
    const klasse = valg.puls === "tomt" ? "puls" : "";
    flater.push(
      `<g data-sted="tomt:${tomt.x},${tomt.y}" class="${klasse}">${treff(px - 6, py - 6, RUTE, RUTE, kolonner * RUTE, rader * RUTE)}<rect x="${px}" y="${py}" width="${RUTE - 12}" height="${RUTE - 12}" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2" stroke-dasharray="5 4"/><rect x="${px + 14}" y="${py + 8}" width="4" height="16" fill="${FARGER.kontur}"/><rect x="${px + 8}" y="${py + 14}" width="16" height="4" fill="${FARGER.kontur}"/></g>`,
    );
  }
  for (const [sted, punkt] of Object.entries(LANDMERKE)) {
    if (!innen(punkt.x, punkt.y, ramme)) continue;
    const px = (punkt.x - ramme.x0) * RUTE;
    const py = (punkt.y - ramme.y0) * RUTE;
    const klasse = valg.puls === sted ? "puls" : "";
    flater.push(`<g data-sted="${sted}" class="${klasse}" transform="translate(${px} ${py})">${treff(0, 0, RUTE, RUTE, kolonner * RUTE, rader * RUTE, px, py)}${landemerke(sted)}</g>`);
  }
  for (const plassert of by.bygg) {
    if (!innen(plassert.x, plassert.y, ramme)) continue;
    const def = byggDef(plassert.bygg);
    const px = (plassert.x - ramme.x0) * RUTE + 4;
    const py = (plassert.y - ramme.y0) * RUTE + 4;
    const sx = (def.bredde * RUTE - 8) / 100;
    const sy = (def.dybde * RUTE - 8) / 120;
    const merke = merkeFor(by, plassert.instans, valg);
    const klasse = valg.puls === merke ? "puls" : "";
    const synlig = plassert.ferdig ? def.oppskrift.length : plassert.steg;
    const rx = (plassert.x - ramme.x0) * RUTE;
    const ry = (plassert.y - ramme.y0) * RUTE;
    flater.push(
      `<rect x="${rx}" y="${ry}" width="${def.bredde * RUTE}" height="${def.dybde * RUTE}" fill="none" stroke="${FARGER.kontur}" stroke-width="2" stroke-opacity="0.35"/>`,
    );
    flater.push(
      `<g data-sted="${merke}" class="${klasse}">${treff(rx, ry, def.bredde * RUTE, def.dybde * RUTE, kolonner * RUTE, rader * RUTE)}<g transform="translate(${px} ${py}) scale(${sx} ${sy})">${fasadeInnhold(plassert.bygg, synlig, kveld && plassert.ferdig)}</g></g>`,
    );
  }
  // Pynten står i hagene og tegnes liten, med bunnen på plassen sin (gj. 10, C4).
  const skala = (0.42 * RUTE) / 48;
  for (const pynt of by.pynt ?? []) {
    if (pynt.x < ramme.x0 || pynt.x > ramme.x1 || pynt.y < ramme.y0 || pynt.y > ramme.y1) continue;
    const px = (pynt.x - ramme.x0) * RUTE - 24 * skala;
    const py = (pynt.y - ramme.y0) * RUTE - 44 * skala;
    flater.push(`<g data-pynt-tegning="${pynt.id}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${skala.toFixed(3)})">${pyntInnhold(pynt.vare, kveld)}</g>`);
  }
  for (const omrade of valg.pyntOmrader ?? []) {
    const r = omrade.ramme;
    const rx = (r.x0 - ramme.x0) * RUTE;
    const ry = (r.y0 - ramme.y0) * RUTE;
    const w = (r.x1 - r.x0) * RUTE;
    const h = (r.y1 - r.y0) * RUTE;
    const cx = rx + w - 10;
    const cy = ry + 10;
    flater.push(
      `<g data-pynt-omrade="${omrade.id}" class="puls">${treff(rx, ry, w, h, kolonner * RUTE, rader * RUTE)}<circle cx="${cx}" cy="${cy}" r="9" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="2"/><path d="M${cx - 5} ${cy} H${cx + 5} M${cx} ${cy - 5} V${cy + 5}" stroke="${FARGER.kontur}" stroke-width="2.5" stroke-linecap="round"/></g>`,
    );
  }
  const bronnFerdig = by.bygg.some((bygg) => bygg.bygg === "bronn" && bygg.ferdig);
  if (bronnFerdig && innen(PYNTEBU.x, PYNTEBU.y, ramme)) {
    const px = (PYNTEBU.x - ramme.x0) * RUTE;
    const py = (PYNTEBU.y - ramme.y0) * RUTE;
    flater.push(
      `<g data-sted="pynt" transform="translate(${px} ${py})">${treff(0, 0, RUTE, RUTE, kolonner * RUTE, rader * RUTE, px, py)}<rect x="6" y="16" width="32" height="22" fill="${FARGER.takBlatt}" stroke="${FARGER.kontur}" stroke-width="2"/><polygon points="4,16 22,2 40,16" fill="${FARGER.takRodt}" stroke="${FARGER.kontur}" stroke-width="2"/><rect x="18" y="24" width="10" height="14" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/></g>`,
    );
  }
  if (innen(TAARN.x, TAARN.y, ramme)) {
    const px = (TAARN.x - ramme.x0) * RUTE;
    const py = (TAARN.y - ramme.y0) * RUTE;
    const feilTid = (tid + 60) % (24 * 60);
    const vinkel = ((feilTid / 60) % 12) * 30 * (Math.PI / 180);
    const x2 = (22 + Math.sin(vinkel) * 5).toFixed(1);
    const y2 = (16 - Math.cos(vinkel) * 5).toFixed(1);
    flater.push(
      `<g data-sted="taarn" transform="translate(${px} ${py})">${treff(0, 0, RUTE, RUTE, kolonner * RUTE, rader * RUTE, px, py)}<rect x="14" y="10" width="16" height="28" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/><polygon points="12,10 22,0 32,10" fill="${FARGER.takRodt}" stroke="${FARGER.kontur}" stroke-width="2"/><circle cx="22" cy="20" r="6" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/><line x1="22" y1="20" x2="${x2}" y2="${y2}" stroke="${FARGER.kontur}" stroke-width="2"/></g>`,
    );
  }
  if (valg.figur && innen(valg.figur.x, valg.figur.y, ramme)) {
    const vedSiden = figurVedSiden(by, valg.figur.x, valg.figur.y, ramme);
    flater.push(figurGruppe(vedSiden.x, vedSiden.y, valg.garFra && innen(valg.garFra.x, valg.garFra.y, ramme) ? valg.garFra : null, ramme));
  }
  const bokstaver = Array.from({ length: kolonner }, (_, i) => `<span>${ruteNavn(ramme.x0 + i, 0).slice(0, 1)}</span>`).join("");
  const tall = Array.from({ length: rader }, (_, i) => `<span>${ramme.y0 + i + 1}</span>`).join("");
  const himmelF = himmelFarge(himmel(tid));
  const skilt = skiltHtml(by, ramme, kolonner, rader, { ...STANDARD_NAVN, ...valg.navn });
  const svg = svgDokument(
    `<rect width="100%" height="100%" fill="${himmelF}"/>${flater.join("")}`,
    kolonner * RUTE,
    rader * RUTE,
  );
  if (valg.ramme) return svg;
  return `<div class="brett" style="--k:${(kolonner / rader).toFixed(3)}"><div class="akse-x"><span></span>${bokstaver}</div><div class="akse-rad"><div class="akse-y">${tall}</div><div class="kartflate">${svg}${skilt}</div></div></div>`;
}

function skiltHtml(
  by: ByTilstand,
  ramme: { x0: number; y0: number; x1: number; y1: number },
  kolonner: number,
  rader: number,
  navn: Partial<Record<string, string>>,
): string {
  // Rekkefølgen er prioriteten når skilt kolliderer: hjem og butikk først (gj. 10, C6).
  const punkter: { sted: string; x: number; y: number }[] = [];
  const hjem = boligen(by);
  if (hjem) punkter.push({ sted: "hjemme", x: hjem.x, y: hjem.y });
  punkter.push(...Object.entries(LANDMERKE).map(([sted, punkt]) => ({ sted, x: punkt.x, y: punkt.y })));
  if (by.bygg.some((bygg) => bygg.bygg === "bronn" && bygg.ferdig)) punkter.push({ sted: "pynt", x: PYNTEBU.x, y: PYNTEBU.y });
  punkter.push({ sted: "taarn", x: TAARN.x, y: TAARN.y });
  return punkter
    .filter((punkt) => innen(punkt.x, punkt.y, ramme))
    .map((punkt) => {
      const left = ((punkt.x - ramme.x0 + 0.5) / kolonner) * 100;
      const top = ((punkt.y - ramme.y0 + 0.92) / rader) * 100;
      // Tårnet og pyntebua står ved siden av hverandre på stien: tårnets skilt står over ruta (gj. 10, C6).
      const over = punkt.sted === "taarn" && punkt.y > ramme.y0;
      const kant = (punkt.x === ramme.x0 ? " venstre" : punkt.x === ramme.x1 - 1 ? " hoyre" : "") + (punkt.y === ramme.y1 - 1 || over ? " nederst" : "");
      const topp = over ? ((punkt.y - ramme.y0 + 0.12) / rader) * 100 : top;
      return `<span class="skilt${kant}" style="left:${left.toFixed(1)}%;top:${topp.toFixed(1)}%" data-sted="${punkt.sted}">${navn[punkt.sted] ?? punkt.sted}</span>`;
    })
    .join("");
}

export function tegnFremdrift(id: ByggId, steg: number, _maks: number): string {
  return fasadeSvg(id, steg, false);
}
