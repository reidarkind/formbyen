/** Farger og mål. Samme tall som i STIL.md. */

export const FARGER = {
  kontur: "#3B2F2A",
  papir: "#F7F0E3",
  papirSkygge: "#EADFCB",
  gress: "#8CC47A",
  gressSkygge: "#6FA862",
  vei: "#E6D3B3",
  veiSkygge: "#D2BC96",
  vann: "#6BB7D6",
  vannSkygge: "#4E9BBD",
  tre: "#E8B27A",
  treSkygge: "#CC9058",
  mur: "#D9CBB8",
  murSkygge: "#BCAB94",
  stein: "#B7B2A8",
  steinSkygge: "#98928A",
  takRodt: "#C8553D",
  takRodtSkygge: "#A8432F",
  takBlatt: "#4F7CAC",
  takBlattSkygge: "#3D6490",
  glass: "#CFE9F5",
  glassSkygge: "#B0D6E8",
  vinduslys: "#FFD66B",
  vinduslysSkygge: "#F2BE3D",
  aksentGul: "#F2C14E",
  aksentGulSkygge: "#D9A62E",
  aksentGronn: "#3E8E5E",
  aksentGronnSkygge: "#2F7149",
  aksentRav: "#E0A43A",
  aksentRavSkygge: "#C4882A",
  himmelDag: "#BFE3F2",
  himmelEttermiddag: "#F2D6A8",
  himmelKveld: "#F2B38A",
  himmelSkumring: "#8C6BA8",
  himmelNatt: "#2F3A5F",
} as const;

export type Farge = (typeof FARGER)[keyof typeof FARGER];

export const PALETT: ReadonlySet<string> = new Set(
  Object.values(FARGER).map((farge) => farge.toUpperCase()),
);

export const MAAL = {
  ruteBredde: 64,
  ruteHoyde: 32,
  etasje: 48,
  kontur: 3,
  konturDetalj: 2,
  rammeUr: 6,
  dorBredde: 0.4,
  dorHoyde: 0.75,
  skyggeOpasitet: 0.2,
  trykk: 48,
  kortRadius: 12,
  knappeRadius: 999,
} as const;

export type Materiale = "tre" | "mur" | "stein";
export type TakFarge = "rod" | "bla";
export type Himmel = "dag" | "ettermiddag" | "kveld" | "skumring" | "natt";

export function materialeFarger(materiale: Materiale): { lys: Farge; skygge: Farge } {
  if (materiale === "tre") return { lys: FARGER.tre, skygge: FARGER.treSkygge };
  if (materiale === "mur") return { lys: FARGER.mur, skygge: FARGER.murSkygge };
  return { lys: FARGER.stein, skygge: FARGER.steinSkygge };
}

export function takFarger(farge: TakFarge): { lys: Farge; skygge: Farge } {
  if (farge === "rod") return { lys: FARGER.takRodt, skygge: FARGER.takRodtSkygge };
  return { lys: FARGER.takBlatt, skygge: FARGER.takBlattSkygge };
}

export function himmelFarge(himmel: Himmel): Farge {
  if (himmel === "dag") return FARGER.himmelDag;
  if (himmel === "ettermiddag") return FARGER.himmelEttermiddag;
  if (himmel === "kveld") return FARGER.himmelKveld;
  if (himmel === "skumring") return FARGER.himmelSkumring;
  return FARGER.himmelNatt;
}

export function erIPalett(farge: string): boolean {
  return PALETT.has(farge.toUpperCase());
}
