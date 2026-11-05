import type { Ferdighet, OppgaveType } from "../typer";

export interface Mal {
  id: string;
  type: OppgaveType;
  ferdighet: Ferdighet;
  /** 0 = 1. klasse, 1 = 2. klasse, 2 = utfordrende. */
  niva: 0 | 1 | 2;
  overraskelse: boolean;
}

function mange(type: OppgaveType, ferdighet: Ferdighet, niva: 0 | 1 | 2, navn: string, antall = 12): Mal[] {
  return Array.from({ length: antall }, (_, indeks) => ({
    id: `${navn}-${indeks + 1}`,
    type,
    ferdighet,
    niva,
    overraskelse: indeks >= 10,
  }));
}

export const MALER: Mal[] = [
  ...mange("still-klokka", "hele-timer", 0, "still"),
  ...mange("les-klokka", "hele-timer", 0, "les"),
  ...mange("koble", "hele-timer", 0, "koble"),
  ...mange("rekker-jeg", "tidsrom", 0, "rekker"),
  ...mange("hvor-lenge", "tidsrom", 0, "lenge"),
  ...mange("apningstider", "hele-timer", 0, "apen"),
  ...mange("ukeplan", "ukedager", 0, "uke"),
  ...mange("kalender", "ukedager", 0, "kal"),
  ...mange("finn-formen", "former-grunn", 0, "finn"),
  ...mange("hvem-passer-ikke", "sortere", 0, "odd"),
  ...mange("sorter", "sortere", 0, "sort"),
  ...mange("tegn", "tegne", 0, "tegn"),
  ...mange("tell", "telle-2d", 0, "tell"),
  ...mange("monster", "monster", 0, "mon"),
  ...mange("stempel", "stempel", 1, "stempel"),
  ...mange("lengde", "lengde", 1, "lengde"),
  ...mange("masse", "masse", 1, "masse"),
  ...mange("areal", "areal", 2, "areal"),
  ...mange("koordinater", "koordinater", 2, "koord"),
  ...mange("likevekt", "likevekt", 2, "vekt"),
];

const FERDIGHET_FOR_VARIANT: Partial<Record<OppgaveType, { v: number; ferdighet: Ferdighet; niva: 0 | 1 | 2 }[]>> = {
  "still-klokka": [
    { v: 6, ferdighet: "halv", niva: 0 },
    { v: 7, ferdighet: "fem-minutter", niva: 1 },
    { v: 8, ferdighet: "kvart", niva: 1 },
    { v: 9, ferdighet: "digital-24", niva: 2 },
  ],
  "les-klokka": [
    { v: 6, ferdighet: "halv", niva: 0 },
    { v: 7, ferdighet: "fem-minutter", niva: 1 },
    { v: 2, ferdighet: "digital-24", niva: 1 },
  ],
  kalender: [
    { v: 3, ferdighet: "maneder", niva: 1 },
    { v: 4, ferdighet: "maneder", niva: 1 },
    { v: 5, ferdighet: "maneder", niva: 1 },
  ],
  tell: [
    { v: 3, ferdighet: "telle-3d", niva: 1 },
    { v: 4, ferdighet: "telle-3d", niva: 1 },
    { v: 6, ferdighet: "rette-vinkler", niva: 2 },
  ],
};

export function malFerdighet(mal: Mal): { ferdighet: Ferdighet; niva: 0 | 1 | 2 } {
  const v = Number(mal.id.slice(mal.id.lastIndexOf("-") + 1));
  const treff = FERDIGHET_FOR_VARIANT[mal.type]?.find((rad) => rad.v === v);
  if (!treff) return { ferdighet: mal.ferdighet, niva: mal.niva };
  return treff;
}

export function malerFor(type: OppgaveType): Mal[] {
  return MALER.filter((mal) => mal.type === type);
}
