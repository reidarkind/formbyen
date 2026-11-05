import { froTilfeldig, heltall } from "./felles/tilfeldig";

/** Tosifret ganget med ensifret. Porten inn til voksensiden. */
export function lagVoksenStykke(fro: number): { tekst: string; svar: number } {
  const tilfeldig = froTilfeldig(fro + 17);
  const a = 12 + heltall(tilfeldig, 0, 7);
  const b = 6 + heltall(tilfeldig, 0, 3);
  return { tekst: `${a} × ${b}`, svar: a * b };
}
