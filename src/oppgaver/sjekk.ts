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
  return svar === oppgave.fasit;
}
