import { mal } from "../tekst/ordbok";
import { erHalvFelle, halvveisTekst, tidTilDigital24, tidTilOrd } from "../tid/tid";
import type { Oppgave, Spraak } from "../typer";

function si(spraak: Spraak, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(spraak, nb, nn, verdier);
}

export function forklaring(oppgave: Oppgave, svar: string, spraak: Spraak): string {
  const valgt = oppgave.valg.find((valg) => valg.id === svar);
  const svarKlokke = valgt?.klokke ?? (Number.isFinite(Number(svar)) ? Number(svar) : undefined);
  if (oppgave.maalKlokke !== undefined && svarKlokke !== undefined && erHalvFelle(oppgave.maalKlokke, svarKlokke)) {
    return halvveisTekst(oppgave.maalKlokke, spraak);
  }
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "rekker-jeg" && oppgave.type !== "hvor-lenge") {
    return si(spraak, "Klokka er {ord}. Digitalt er det {digital}.", "Klokka er {ord}. Digitalt er det {digital}.", {
      ord: tidTilOrd(oppgave.maalKlokke, spraak),
      digital: tidTilDigital24(oppgave.maalKlokke),
    });
  }
  if (oppgave.tall !== undefined && oppgave.type === "tell") {
    return si(spraak, "Det er {tall}. Følg med når de lyses opp.", "Det er {tall}. Følg med når dei lyser opp.", {
      tall: String(oppgave.tall),
    });
  }
  if (oppgave.type === "rekker-jeg") {
    return si(spraak, "Se tidslinjen. Den korte veien rekker, den lange gjør ikke det.", "Sjå tidslinja. Den korte vegen rekk, den lange gjer ikkje det.");
  }
  return si(spraak, "Se på bildet en gang til. Det riktige er markert.", "Sjå på biletet ein gong til. Det rette er merkt.");
}
