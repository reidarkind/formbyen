import { MALER, malFerdighet } from "../oppgaver/maler";
import { mal } from "../tekst/ordbok";
import type { Ferdighet, FerdighetsTilstand, Nivaa, OppgaveType, Spraak } from "../typer";

/** Oppgavetypene spillet faktisk gir i butikken, i oppdrag og ved avtaler. */
const TYPER_I_SPILLET: OppgaveType[] = [
  "les-klokka",
  "still-klokka",
  "koble",
  "hvor-lenge",
  "rekker-jeg",
  "apningstider",
  "finn-formen",
  "hvem-passer-ikke",
  "sorter",
  "tell",
  "tegn",
  "monster",
  "stempel",
  "ukeplan",
  "kalender",
  "lengde",
  "masse",
  "areal",
  "koordinater",
  "likevekt",
];

const OVES = new Set<Ferdighet>([
  ...MALER.filter((rad) => TYPER_I_SPILLET.includes(rad.type)).map((rad) => malFerdighet(rad).ferdighet),
  "former-3d",
  "sortere",
  "tidsrom",
]);

export function ovesISpillet(ferdighet: Ferdighet): boolean {
  return OVES.has(ferdighet);
}

export interface Omrade {
  id: "klokke" | "former" | "tid" | "maling";
  navn: [string, string];
  ferdigheter: Ferdighet[];
}

const ALLE_OMRADER: Omrade[] = [
  { id: "klokke", navn: ["Klokke", "Klokke"], ferdigheter: ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24"] },
  {
    id: "former",
    navn: ["Former", "Former"],
    ferdigheter: ["former-grunn", "former-flere", "sortere", "telle-2d", "rette-vinkler", "former-3d", "telle-3d", "stempel", "monster", "tegne"],
  },
  { id: "tid", navn: ["Tid og kalender", "Tid og kalender"], ferdigheter: ["tidsrom", "periode", "ukedager", "maneder"] },
  { id: "maling", navn: ["Måling og kart", "Måling og kart"], ferdigheter: ["lengde", "masse", "likevekt", "areal", "koordinater"] },
];

/** Områdene på voksensiden. Ferdigheter spillet ikke øver på, vises ikke. */
export const OMRADER: Omrade[] = ALLE_OMRADER.map((omrade) => ({ ...omrade, ferdigheter: omrade.ferdigheter.filter(ovesISpillet) })).filter(
  (omrade) => omrade.ferdigheter.length > 0,
);

export const FERDIGHET_NAVN: Record<Ferdighet, [string, string]> = {
  "hele-timer": ["hele timer", "heile timar"],
  halv: ["halve timer", "halve timar"],
  kvart: ["kvart over og kvart på", "kvart over og kvart på"],
  "fem-minutter": ["fem minutter", "fem minutt"],
  "digital-24": ["digital klokke", "digital klokke"],
  tidsrom: ["hvor lang tid noe tar", "kor lang tid noko tek"],
  periode: ["tid på døgnet", "tid på døgeret"],
  ukedager: ["ukedager", "vekedagar"],
  maneder: ["måneder", "månader"],
  "former-grunn": ["sirkel, trekant og kvadrat", "sirkel, trekant og kvadrat"],
  "former-flere": ["flere former", "fleire former"],
  sortere: ["sortere former", "sortere former"],
  "telle-2d": ["telle sider og hjørner", "telje sider og hjørne"],
  "rette-vinkler": ["rette hjørner", "rette hjørne"],
  "former-3d": ["romformer", "romformer"],
  "telle-3d": ["telle på romformer", "telje på romformer"],
  stempel: ["flater på romformer", "flater på romformer"],
  monster: ["mønster", "mønster"],
  tegne: ["tegne former", "teikne former"],
  lengde: ["lengde", "lengd"],
  masse: ["masse", "masse"],
  areal: ["areal", "areal"],
  koordinater: ["koordinater", "koordinatar"],
  likevekt: ["likevekt", "likevekt"],
};

export type Status = "ikke" | "over" | "sikker";

/** «Sikker» er minst 8 av de 10 siste riktige, over minst 2 dager. */
export function ferdighetStatus(tilstand: FerdighetsTilstand | undefined): { status: Status; riktige: number; forsok: number } {
  if (!tilstand || tilstand.forsok === 0) return { status: "ikke", riktige: 0, forsok: 0 };
  const siste = tilstand.siste ?? [];
  const riktige = siste.length ? siste.filter((rad) => rad.r === 1).length : tilstand.riktige;
  const forsok = siste.length ? siste.length : tilstand.forsok;
  const dager = new Set(siste.map((rad) => rad.d)).size;
  const sikker = siste.length >= 8 && riktige >= 8 && dager >= 2;
  return { status: sikker ? "sikker" : "over", riktige, forsok };
}

function liste(spraak: Spraak, ord: string[]): string {
  if (ord.length <= 1) return ord[0] ?? "";
  return `${ord.slice(0, -1).join(", ")} ${mal(spraak, "og", "og")} ${ord.at(-1)}`;
}

function linje(spraak: Spraak, omrade: Omrade, mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>): string {
  const navn = (id: Ferdighet) => mal(spraak, FERDIGHET_NAVN[id][0], FERDIGHET_NAVN[id][1]);
  const sikre = omrade.ferdigheter.filter((id) => ferdighetStatus(mestring[id]).status === "sikker").map(navn);
  const over = omrade.ferdigheter.filter((id) => ferdighetStatus(mestring[id]).status === "over").map(navn);
  const ikke = omrade.ferdigheter.filter((id) => ferdighetStatus(mestring[id]).status === "ikke").map(navn);
  const deler: string[] = [];
  if (sikre.length) deler.push(mal(spraak, "sikker på {liste}", "sikker på {liste}", { liste: liste(spraak, sikre) }));
  if (over.length) deler.push(mal(spraak, "øver på {liste}", "øver på {liste}", { liste: liste(spraak, over) }));
  if (!deler.length) deler.push(mal(spraak, "ikke øvd ennå", "ikkje øvd enno"));
  else if (ikke.length) deler.push(mal(spraak, "ikke øvd ennå: {liste}", "ikkje øvd enno: {liste}", { liste: liste(spraak, ikke) }));
  const tittel = mal(spraak, omrade.navn[0], omrade.navn[1]);
  return `${tittel}: ${deler.join(", ")}.`;
}

/** Ferdighetene spillet øver på på et nivå (gj. 10, 7.2.2). Blandet gir alle. */
export function ferdigheterForNivaa(nivaa: Nivaa): Set<Ferdighet> {
  const tak = nivaa === "forste" ? 0 : nivaa === "andre" ? 1 : 2;
  const ut = new Set<Ferdighet>(["sortere", "tidsrom", "former-3d"]);
  for (const rad of MALER) {
    if (!TYPER_I_SPILLET.includes(rad.type)) continue;
    const justert = malFerdighet(rad);
    if (nivaa === "blandet" || justert.niva <= tak) ut.add(justert.ferdighet);
  }
  return new Set([...ut].filter(ovesISpillet));
}

/** Områdene med bare ferdighetene nivået øver på. */
export function omraderForNivaa(nivaa: Nivaa): Omrade[] {
  const lov = ferdigheterForNivaa(nivaa);
  return OMRADER.map((omrade) => ({ ...omrade, ferdigheter: omrade.ferdigheter.filter((id) => lov.has(id)) })).filter((omrade) => omrade.ferdigheter.length > 0);
}

/** To linjer i klartekst øverst på voksensiden: klokka (med tid og kalender) og former (med måling) (gj. 10, 7.2.1). */
export function oversiktLinjer(mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>, spraak: Spraak, nivaa: Nivaa = "blandet"): { klokke: string; former: string } {
  const omrader = omraderForNivaa(nivaa);
  const samle = (ider: Omrade["id"][], navn: [string, string]): Omrade => ({
    id: ider[0] ?? "klokke",
    navn,
    ferdigheter: omrader.filter((omrade) => ider.includes(omrade.id)).flatMap((omrade) => omrade.ferdigheter),
  });
  return {
    klokke: linje(spraak, samle(["klokke", "tid"], ["Klokka", "Klokka"]), mestring),
    former: linje(spraak, samle(["former", "maling"], ["Former og måling", "Former og måling"]), mestring),
  };
}
