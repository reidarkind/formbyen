import type { Oppgave } from "../typer";

export type Representasjon = "analog" | "ord" | "digital" | "full";

function erDigital(tekst: string): boolean {
  return /\d{1,2}:\d{2}/.test(tekst);
}

/** Det barnet skal lese. Aldri den samme formen som svarene. */
export function sporsmalViser(oppgave: Oppgave): Representasjon {
  if (oppgave.type === "still-klokka") {
    if (oppgave.digital) return "digital";
    return erDigital(oppgave.prompt) ? "digital" : "ord";
  }
  if (oppgave.type === "les-klokka" && oppgave.digital) return "digital";
  if (
    oppgave.type === "les-klokka" ||
    oppgave.type === "hvor-lenge" ||
    oppgave.type === "rekker-jeg" ||
    oppgave.type === "apningstider" ||
    oppgave.type === "koble"
  ) {
    return "analog";
  }
  if (oppgave.maalKlokke !== undefined) return "analog";
  return "full";
}

/** Det barnet skal svare med. */
export function svarViser(oppgave: Oppgave): Representasjon {
  if (oppgave.type === "still-klokka") return "analog";
  const tekst = oppgave.valg.map((valg) => valg.tekst ?? "").join(" ");
  if (oppgave.prompt.startsWith("Hvilken klokke") || oppgave.prompt.startsWith("Kva for klokke")) return "analog";
  if (tekst.includes("·")) return "ord";
  if (oppgave.type === "les-klokka" || oppgave.type === "koble") return erDigital(tekst) ? "digital" : "ord";
  const harKlokke = oppgave.valg.some((valg) => valg.klokke !== undefined);
  if (harKlokke && !erDigital(tekst)) return "analog";
  if (erDigital(tekst)) return "digital";
  return "ord";
}
