import type { Himmel } from "../grafikk/stil";

const DOGN = 24 * 60;

export { halvveisTekst, tidTilOrd } from "./ord";

export function normaliser(minutter: number): number {
  const dogn = ((Math.round(minutter) % DOGN) + DOGN) % DOGN;
  return dogn;
}

export function timer(minutter: number): number {
  return Math.floor(normaliser(minutter) / 60);
}

export function minutt(minutter: number): number {
  return normaliser(minutter) % 60;
}

export function klokke(timerDel: number, minuttDel: number): number {
  return normaliser(timerDel * 60 + minuttDel);
}

export function tidTilDigital24(minutter: number): string {
  return `${String(timer(minutter)).padStart(2, "0")}:${String(minutt(minutter)).padStart(2, "0")}`;
}

export function tidTilDigital12(minutter: number): string {
  const time12 = timer(minutter) % 12 || 12;
  return `${time12}:${String(minutt(minutter)).padStart(2, "0")}`;
}

export type Dogn = "natt" | "morgen" | "formiddag" | "ettermiddag" | "kveld";

export function dogn(minutter: number): Dogn {
  const time = timer(minutter);
  if (time >= 5 && time < 9) return "morgen";
  if (time >= 9 && time < 12) return "formiddag";
  if (time >= 12 && time < 18) return "ettermiddag";
  if (time >= 18 && time < 23) return "kveld";
  return "natt";
}

/** Flate himmelsteg. 17:00 er ettermiddag, 20:00 er natt. */
export function himmel(minutter: number): Himmel {
  const verdi = normaliser(minutter);
  if (verdi < 17 * 60) return "dag";
  if (verdi < 18 * 60) return "ettermiddag";
  if (verdi < 19 * 60) return "kveld";
  if (verdi < 20 * 60) return "skumring";
  return "natt";
}

export function leggTil(minutter: number, delta: number): number {
  return normaliser(minutter + delta);
}

export function minutterMellom(fra: number, til: number): number {
  return (normaliser(til) - normaliser(fra) + DOGN) % DOGN;
}

export interface Aapning {
  apner: number;
  stenger: number;
  stengtHele?: boolean;
  stengtFra?: number;
  stengtTil?: number;
}

export function erApen(naa: number, aapning: Aapning): boolean {
  if (aapning.stengtHele) return false;
  const tid = normaliser(naa);
  if (
    aapning.stengtFra !== undefined &&
    aapning.stengtTil !== undefined &&
    tid >= normaliser(aapning.stengtFra) &&
    tid < normaliser(aapning.stengtTil)
  ) {
    return false;
  }
  const apner = normaliser(aapning.apner);
  const stenger = normaliser(aapning.stenger);
  if (apner === stenger) return false;
  if (apner < stenger) return tid >= apner && tid < stenger;
  return tid >= apner || tid < stenger;
}

/** Timeviser i grader med klokka fra 12. Ved halv tre står den midt mellom 2 og 3. */
export function timeviserVinkel(minutter: number): number {
  const time = timer(minutter) % 12;
  return time * 30 + minutt(minutter) * 0.5;
}

export function minuttviserVinkel(minutter: number): number {
  return minutt(minutter) * 6;
}

/** Timen ved siden av et halv-klokkeslett, uansett om språket peker fram eller bak. */
export function erHalvFelle(fasit: number, svar: number): boolean {
  const f = normaliser(fasit);
  const s = normaliser(svar);
  if (minutt(f) !== 30 && minutt(s) !== 30) return false;
  return Math.abs(f - s) === 60 || Math.abs(f - s) === DOGN - 60;
}
