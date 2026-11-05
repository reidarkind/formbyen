export type Tilfeldig = () => number;

/** Samme generator som i Bananmatte: injiserbar, uten Math.random. */
export function froTilfeldig(fro: number): Tilfeldig {
  let tilstand = fro >>> 0;
  return () => {
    tilstand = (Math.imul(1664525, tilstand) + 1013904223) >>> 0;
    return tilstand / 4294967296;
  };
}

export function heltall(tilfeldig: Tilfeldig, min: number, maks: number): number {
  if (maks < min) return min;
  return min + Math.floor(tilfeldig() * (maks - min + 1));
}

export function trekk<T>(tilfeldig: Tilfeldig, liste: readonly T[]): T {
  if (liste.length === 0) throw new Error("tom liste");
  return liste[Math.floor(tilfeldig() * liste.length)] as T;
}

export function stokk<T>(tilfeldig: Tilfeldig, liste: readonly T[]): T[] {
  const kopi = [...liste];
  for (let i = kopi.length - 1; i > 0; i--) {
    const j = Math.floor(tilfeldig() * (i + 1));
    const a = kopi[i] as T;
    kopi[i] = kopi[j] as T;
    kopi[j] = a;
  }
  return kopi;
}
