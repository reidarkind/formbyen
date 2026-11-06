import { minuttviserVinkel, timeviserVinkel } from "../tid/tid";

/** Hvilken viser barnet styrer på en klokke som kan stilles. */
export type Viser = "time" | "minutt";

const DOGN = 24 * 60;

/** Vinkel i grader med klokka fra tolv, ut fra avstanden fra sentrum (skjermkoordinater, y nedover). */
export function vinkelFra(dx: number, dy: number): number {
  const grader = (Math.atan2(dx, -dy) * 180) / Math.PI;
  return grader < 0 ? grader + 360 : grader;
}

/**
 * Stiller én viser etter en vinkel. Timeviseren går til nærmeste hele time og beholder minuttene og døgnhalvdelen.
 * Minuttviseren går til nærmeste trinn for nivået. Timen endres ikke ved trykk.
 */
export function settMedVinkel(tid: number, grader: number, viser: Viser, steg: number): number {
  const time = Math.floor(tid / 60);
  const minutt = tid % 60;
  if (viser === "time") {
    const tolv = Math.round(grader / 30) % 12;
    const halvdel = time >= 12 ? 12 : 0;
    return (halvdel + tolv) * 60 + minutt;
  }
  const ny = (Math.round(grader / (6 * steg)) * steg) % 60;
  return time * 60 + ny;
}

/** Forskjellen mellom to vinkler, den korteste veien (−180 til 180). */
export function vinkelSteg(fra: number, til: number): number {
  const d = (((til - fra) % 360) + 540) % 360 - 180;
  return d === -180 ? 180 : d;
}

/**
 * Minuttviseren følger fingeren mens barnet drar. `sum` er hvor mange grader fingeren har gått siden `startGrader`.
 * En hel runde med klokka flytter timen én fram, og en runde mot klokka én tilbake.
 */
export function draMinutt(startTid: number, startGrader: number, sum: number, steg: number): number {
  const timeStart = Math.floor(startTid / 60) * 60;
  const minutter = Math.round((startGrader + sum) / (6 * steg)) * steg;
  return (((timeStart + minutter) % DOGN) + DOGN) % DOGN;
}

function avvik(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Viseren under fingeren, eller null. `avstand` er andel av urskivas radius (0 i sentrum, 1 ved kanten). */
export function gripViser(tid: number, grader: number, avstand: number): Viser | null {
  const time = avvik(grader, timeviserVinkel(tid)) < 20 && avstand <= 0.6;
  const minutt = avvik(grader, minuttviserVinkel(tid)) < 20 && avstand <= 0.9;
  if (time && minutt) return avstand > 0.5 ? "minutt" : "time";
  if (minutt) return "minutt";
  if (time) return "time";
  return null;
}
