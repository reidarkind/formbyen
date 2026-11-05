import { FARGER } from "./stil";
import { svgDokument } from "./svg";
import type { Kjaeledyr } from "../typer";

const HUD = ["#E8B27A", "#D9CBB8", "#CC9058", "#BCAB94", "#E6D3B3", "#F2C14E"] as const;
const HAR = ["#3B2F2A", "#C8553D", "#4F7CAC", "#3E8E5E", "#E0A43A", "#6FA862"] as const;
const KLAR = ["#4F7CAC", "#C8553D", "#3E8E5E", "#E0A43A"] as const;

/** Byggmester. Hodet er en tredjedel. To prikkøyne, votter, ingen fingre. */
export function byggmester(variant = 0, speil = false, glad = true): string {
  const hud = HUD[variant % HUD.length] ?? HUD[0];
  const har = HAR[variant % HAR.length] ?? HAR[0];
  const klar = KLAR[variant % KLAR.length] ?? KLAR[0];
  const munn = glad ? `<path d="M46 38 Q50 42 54 38" fill="none" stroke="${FARGER.kontur}" stroke-width="2" stroke-linecap="round"/>` : `<circle cx="50" cy="40" r="2" fill="${FARGER.kontur}"/>`;
  const kropp = `
    <rect x="38" y="48" width="24" height="28" fill="${klar}" stroke="${FARGER.kontur}" stroke-width="3"/>
    <circle cx="50" cy="28" r="16" fill="${hud}" stroke="${FARGER.kontur}" stroke-width="3"/>
    <path d="M36 24 Q50 8 64 24 Q50 16 36 24" fill="${har}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <circle cx="44" cy="30" r="2" fill="${FARGER.kontur}"/>
    <circle cx="56" cy="30" r="2" fill="${FARGER.kontur}"/>
    ${munn}
    <rect x="30" y="54" width="10" height="8" fill="${hud}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="60" y="54" width="10" height="8" fill="${hud}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="40" y="76" width="8" height="16" fill="${FARGER.kontur}"/>
    <rect x="52" y="76" width="8" height="16" fill="${FARGER.kontur}"/>
  `;
  const indre = speil ? `<g transform="translate(100 0) scale(-1 1)">${kropp}</g>` : kropp;
  return svgDokument(indre, 100, 100);
}

export function kjaeledyr(slag: Kjaeledyr, speil = false): string {
  const kropp = slag === "katt" ? FARGER.aksentRav : slag === "kanin" ? FARGER.papir : FARGER.tre;
  const orer =
    slag === "kanin"
      ? `<rect x="38" y="8" width="6" height="16" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/><rect x="56" y="8" width="6" height="16" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/>`
      : slag === "katt"
        ? `<polygon points="36,28 42,14 48,28" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/><polygon points="52,28 58,14 64,28" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/>`
        : `<ellipse cx="34" cy="30" rx="6" ry="4" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/><ellipse cx="66" cy="30" rx="6" ry="4" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  const figur = `
    ${orer}
    <ellipse cx="50" cy="48" rx="18" ry="14" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="3"/>
    <circle cx="50" cy="34" r="12" fill="${kropp}" stroke="${FARGER.kontur}" stroke-width="3"/>
    <circle cx="46" cy="34" r="1.5" fill="${FARGER.kontur}"/>
    <circle cx="54" cy="34" r="1.5" fill="${FARGER.kontur}"/>
    <path d="M47 38 Q50 41 53 38" fill="none" stroke="${FARGER.kontur}" stroke-width="2" stroke-linecap="round"/>
  `;
  const indre = speil ? `<g transform="translate(100 0) scale(-1 1)">${figur}</g>` : figur;
  return svgDokument(indre, 100, 80);
}

export function ikon(navn: string): string {
  const s = `stroke="${FARGER.kontur}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  const motiver: Record<string, string> = {
    still: `<circle cx="10" cy="12" r="7" ${s}/><line x1="10" y1="12" x2="10" y2="8" ${s}/><path d="M16 16 L21 21" ${s}/>`,
    les: `<circle cx="12" cy="12" r="7" ${s}/><circle cx="12" cy="12" r="2" fill="${FARGER.kontur}"/>`,
    koble: `<circle cx="6" cy="12" r="4" ${s}/><circle cx="18" cy="12" r="4" ${s}/><line x1="10" y1="12" x2="14" y2="12" ${s}/>`,
    sorter: `<rect x="2" y="8" width="8" height="10" ${s}/><rect x="14" y="8" width="8" height="10" ${s}/><path d="M10 6 L14 6" ${s}/>`,
    tell: `<circle cx="6" cy="16" r="2" fill="${FARGER.kontur}"/><circle cx="12" cy="16" r="2" fill="${FARGER.kontur}"/><circle cx="18" cy="16" r="2" fill="${FARGER.kontur}"/><path d="M12 4 L12 12" ${s}/>`,
    tegn: `<path d="M4 20 L16 8 L19 11 L7 23 Z" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="2"/>`,
    velg: `<rect x="2" y="6" width="6" height="12" ${s}/><rect x="9" y="6" width="6" height="12" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="2"/><rect x="16" y="6" width="6" height="12" ${s}/>`,
    feil: `<circle cx="10" cy="10" r="6" ${s}/><line x1="14" y1="14" x2="20" y2="20" ${s}/>`,
    ja: `<path d="M4 12 L9 17 L20 6" ${s}/><path d="M4 20 L12 12" ${s}/>`,
    mal: `<rect x="3" y="8" width="18" height="8" ${s}/>`,
    vekt: `<path d="M12 4 L12 20 M6 20 L18 20 M4 8 L12 4 L20 8" ${s}/>`,
  };
  return svgDokument(motiver[navn] ?? motiver.velg ?? "", 24, 24);
}
