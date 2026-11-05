import type { Ferdighet, FerdighetsTilstand, Nivaa } from "../typer";

export const FERDIGHETER: Ferdighet[] = [
  "hele-timer",
  "halv",
  "kvart",
  "fem-minutter",
  "digital-24",
  "tidsrom",
  "periode",
  "ukedager",
  "maneder",
  "former-grunn",
  "former-flere",
  "sortere",
  "telle-2d",
  "former-3d",
  "telle-3d",
  "rette-vinkler",
  "stempel",
  "monster",
  "tegne",
  "lengde",
  "masse",
  "areal",
  "koordinater",
  "likevekt",
];

const MIN_NIVAA: Record<Ferdighet, 0 | 1 | 2> = {
  "hele-timer": 0,
  halv: 0,
  kvart: 1,
  "fem-minutter": 1,
  "digital-24": 1,
  tidsrom: 0,
  periode: 0,
  ukedager: 0,
  maneder: 1,
  "former-grunn": 0,
  "former-flere": 1,
  sortere: 0,
  "telle-2d": 0,
  "former-3d": 0,
  "telle-3d": 1,
  "rette-vinkler": 2,
  stempel: 1,
  monster: 0,
  tegne: 0,
  lengde: 1,
  masse: 1,
  areal: 2,
  koordinater: 2,
  likevekt: 2,
};

/** Ferdigheter som først åpnes mot slutten av forrige steg. */
const MOT_SLUTTEN: Partial<Record<Ferdighet, Ferdighet>> = {
  halv: "hele-timer",
  "fem-minutter": "kvart",
};

function nivaaTall(nivaa: Nivaa): 0 | 1 | 2 | 3 {
  if (nivaa === "forste") return 0;
  if (nivaa === "andre") return 1;
  if (nivaa === "utfordrende") return 2;
  return 3;
}

export function tomFerdighet(): FerdighetsTilstand {
  return { trinn: 0, riktigePaRad: 0, feilPaRad: 0, riktige: 0, forsok: 0 };
}

export function hentFerdighet(
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>,
  ferdighet: Ferdighet,
): FerdighetsTilstand {
  return mestring[ferdighet] ?? tomFerdighet();
}

export function maksTrinn(ferdighet: Ferdighet, nivaa: Nivaa): number {
  const niva = nivaaTall(nivaa);
  if (niva === 3) return 2;
  if (niva < MIN_NIVAA[ferdighet]) return -1;
  if (niva === 0) return ferdighet === "halv" ? 1 : 1;
  if (niva === 1 && ferdighet === "fem-minutter") return 1;
  if (niva === 1 && ferdighet === "digital-24") return 1;
  return 2;
}

export function ferdighetApent(
  ferdighet: Ferdighet,
  nivaa: Nivaa,
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>,
): boolean {
  if (maksTrinn(ferdighet, nivaa) < 0) return false;
  const krever = MOT_SLUTTEN[ferdighet];
  if (!krever) return true;
  if (nivaaTall(nivaa) > MIN_NIVAA[ferdighet]) return true;
  const grunn = hentFerdighet(mestring, krever);
  return grunn.trinn >= 1 || grunn.riktige >= 6;
}

export function registrerSvar(
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>,
  ferdighet: Ferdighet,
  riktig: boolean,
  nivaa: Nivaa,
): Partial<Record<Ferdighet, FerdighetsTilstand>> {
  const forrige = hentFerdighet(mestring, ferdighet);
  const tak = Math.max(0, maksTrinn(ferdighet, nivaa));
  let trinn = forrige.trinn;
  let riktigePaRad = riktig ? forrige.riktigePaRad + 1 : 0;
  let feilPaRad = riktig ? 0 : forrige.feilPaRad + 1;
  if (riktigePaRad >= 3) {
    trinn = Math.min(tak, trinn + 1);
    riktigePaRad = 0;
  }
  if (feilPaRad >= 2) {
    trinn = Math.max(0, trinn - 1);
    feilPaRad = 0;
  }
  return {
    ...mestring,
    [ferdighet]: {
      trinn,
      riktigePaRad,
      feilPaRad,
      riktige: forrige.riktige + (riktig ? 1 : 0),
      forsok: forrige.forsok + 1,
    },
  };
}

export function tillatteMinutter(
  nivaa: Nivaa,
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>,
): number[] {
  const fem = ferdighetApent("fem-minutter", nivaa, mestring) && (nivaa === "utfordrende" || nivaa === "blandet" || hentFerdighet(mestring, "fem-minutter").trinn >= 1 || hentFerdighet(mestring, "kvart").riktige >= 6);
  if (fem) return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const kvart = ferdighetApent("kvart", nivaa, mestring);
  if (kvart) return [0, 15, 30, 45];
  const halv = ferdighetApent("halv", nivaa, mestring);
  if (halv) return [0, 30];
  return [0];
}
