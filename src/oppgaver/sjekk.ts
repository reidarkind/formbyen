import type { Oppgave } from "../typer";

function liste(svar: string): string {
  return svar
    .split(",")
    .map((del) => del.trim())
    .filter(Boolean)
    .sort()
    .join(",");
}

export function sjekkSvar(oppgave: Oppgave, svar: string): boolean {
  if (oppgave.type === "finn-formen" || oppgave.type === "sorter") {
    return liste(svar) === liste(oppgave.fasit);
  }
  if (oppgave.type === "still-klokka" && /^\d+$/.test(svar) && /^\d+$/.test(oppgave.fasit)) {
    // En analog skive viser ikke forskjell på formiddag og ettermiddag (gj. 9, 6.7).
    return Number(svar) % 720 === Number(oppgave.fasit) % 720;
  }
  if (oppgave.form3d === "pyramide" && (svar === "kvadrat" || svar === "trekant")) return true;
  return svar === oppgave.fasit;
}
