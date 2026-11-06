import type { VareId } from "../typer";
import { FARGER } from "./stil";
import { svgDokument } from "./svg";

/**
 * Pynten i samme stil som byggene: kontur, to–tre toner og tydelig silhuett (gj. 10, C4).
 * Hver tegning ligger i en boks på 48 × 48 med bunnen nederst, så den står på bakken.
 */
const K = `stroke="${FARGER.kontur}" stroke-width="2.5" stroke-linejoin="round"`;
const T = `stroke="${FARGER.kontur}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

function blomst(): string {
  return `<path d="M24 40 V22" ${T}/>
    <path d="M24 33 C17 33 14 28 15 25 C20 25 24 28 24 33 Z" fill="${FARGER.aksentGronn}" ${T}/>
    <path d="M24 31 C31 31 34 26 33 23 C28 23 24 26 24 31 Z" fill="${FARGER.aksentGronn}" ${T}/>
    ${[0, 72, 144, 216, 288].map((v) => `<ellipse cx="24" cy="10" rx="4.5" ry="6.5" fill="${FARGER.takRodt}" ${T} transform="rotate(${v} 24 16)"/>`).join("")}
    <circle cx="24" cy="16" r="4" fill="${FARGER.aksentGul}" ${T}/>
    <path d="M15 38 H33 L31 46 H17 Z" fill="${FARGER.takRodtSkygge}" ${K}/>`;
}

function tre(): string {
  return `<rect x="21" y="30" width="6" height="16" fill="${FARGER.treSkygge}" ${K}/>
    <circle cx="24" cy="18" r="15" fill="${FARGER.aksentGronn}" ${K}/>
    <circle cx="19" cy="14" r="4" fill="${FARGER.gress}"/>`;
}

function busk(): string {
  return `<path d="M6 44 C3 36 8 28 15 30 C15 22 26 20 28 27 C33 21 43 26 41 33 C46 36 45 44 40 44 Z" fill="${FARGER.aksentGronn}" ${K}/>
    <circle cx="16" cy="36" r="2.5" fill="${FARGER.takRodt}" ${T}/><circle cx="30" cy="31" r="2.5" fill="${FARGER.takRodt}" ${T}/><circle cx="36" cy="39" r="2.5" fill="${FARGER.takRodt}" ${T}/>`;
}

function lykt(kveld: boolean): string {
  const lys = kveld ? `<circle cx="24" cy="14" r="12" fill="${FARGER.vinduslys}" opacity="0.45"/>` : "";
  return `${lys}<rect x="22" y="20" width="4" height="24" fill="${FARGER.stein}" ${K}/>
    <rect x="18" y="44" width="12" height="3" fill="${FARGER.steinSkygge}" ${T}/>
    <path d="M17 8 H31 L29 21 H19 Z" fill="${kveld ? FARGER.vinduslys : FARGER.glass}" ${K}/>
    <path d="M15 8 L24 2 L33 8 Z" fill="${FARGER.kontur}" ${T}/>`;
}

function benk(): string {
  return `<path d="M5 22 L37 18 L43 24 L11 28 Z" fill="${FARGER.tre}" ${K}/>
    <path d="M5 22 V14 L37 10 V18" fill="${FARGER.treSkygge}" ${K}/>
    <path d="M11 28 V40 M41 25 V37 M7 24 V35 M36 24 V34" ${T}/>
    <path d="M11 28 L43 24 V27 L11 31 Z" fill="${FARGER.treSkygge}" ${T}/>`;
}

function flagg(): string {
  return `<path d="M12 46 V6" stroke="${FARGER.kontur}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="12" cy="5" r="3" fill="${FARGER.aksentGul}" ${T}/>
    <path d="M13 8 C21 5 27 12 39 8 L39 24 C28 28 21 21 13 24 Z" fill="${FARGER.takRodt}" ${K}/>
    <path d="M19 9.5 V23 M13 15 H39" stroke="${FARGER.papir}" stroke-width="2.5"/>`;
}

function postkasse(): string {
  return `<rect x="22" y="26" width="4" height="20" fill="${FARGER.treSkygge}" ${K}/>
    <path d="M10 26 V16 A8 8 0 0 1 18 8 H30 A8 8 0 0 1 38 16 V26 Z" fill="${FARGER.takRodt}" ${K}/>
    <path d="M18 8 A8 8 0 0 1 26 16 V26" ${T}/>
    <rect x="31" y="4" width="3" height="12" fill="${FARGER.aksentGul}" ${T}/>`;
}

function fontene(): string {
  return `<ellipse cx="24" cy="38" rx="20" ry="7" fill="${FARGER.stein}" ${K}/>
    <ellipse cx="24" cy="37" rx="15" ry="4.5" fill="${FARGER.vann}" ${T}/>
    <rect x="21" y="18" width="6" height="18" fill="${FARGER.stein}" ${K}/>
    <path d="M24 18 C24 8 16 8 14 16 M24 18 C24 8 32 8 34 16" stroke="${FARGER.vannSkygge}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="14" cy="20" r="1.8" fill="${FARGER.vann}"/><circle cx="34" cy="20" r="1.8" fill="${FARGER.vann}"/>`;
}

function and(x: number, y: number, s: number): string {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 6 C0 12 14 13 18 7 C14 4 9 6 6 4 Z" fill="${FARGER.aksentGul}" ${T}/>
    <circle cx="4" cy="0" r="4.5" fill="${FARGER.aksentGul}" ${T}/>
    <path d="M-1 -1 L-6 0.5 L-1 2 Z" fill="${FARGER.aksentRav}" ${T}/>
    <circle cx="3" cy="-1" r="0.9" fill="${FARGER.kontur}"/></g>`;
}

function ender(): string {
  return `<ellipse cx="24" cy="36" rx="22" ry="10" fill="${FARGER.vann}" ${K}/>
    <path d="M8 38 C12 36 15 40 19 38 M28 40 C32 38 35 42 39 40" stroke="${FARGER.vannSkygge}" stroke-width="2" stroke-linecap="round"/>
    ${and(10, 28, 1)}${and(28, 32, 0.8)}`;
}

/** Tegningen som SVG-innhold (uten svg-element), i en boks på 48 × 48. */
export function pyntInnhold(vare: VareId | string, kveld = false): string {
  if (vare === "pynt-blomst") return blomst();
  if (vare === "pynt-tre") return tre();
  if (vare === "pynt-busk") return busk();
  if (vare === "pynt-lykt") return lykt(kveld);
  if (vare === "pynt-benk") return benk();
  if (vare === "pynt-flagg") return flagg();
  if (vare === "pynt-postkasse") return postkasse();
  if (vare === "pynt-fontene") return fontene();
  if (vare === "pynt-ender") return ender();
  return blomst();
}

export function pyntSvg(vare: VareId | string, stor = 48, kveld = false): string {
  return svgDokument(`<g transform="scale(${stor / 48})">${pyntInnhold(vare, kveld)}</g>`, stor, stor);
}

/** Formene gjenstanden er laget av, for «Trykk på pynten» (gj. 7, 11.2). */
export const PYNT_FORMER: Record<string, string[]> = {
  "pynt-blomst": ["sirkel", "oval", "trekant"],
  "pynt-tre": ["sirkel", "rektangel"],
  "pynt-busk": ["sirkel", "halvsirkel"],
  "pynt-lykt": ["rektangel", "trekant"],
  "pynt-benk": ["rektangel"],
  "pynt-flagg": ["rektangel", "sirkel"],
  "pynt-postkasse": ["rektangel", "halvsirkel"],
  "pynt-fontene": ["oval", "rektangel"],
  "pynt-ender": ["oval", "sirkel", "trekant"],
};
