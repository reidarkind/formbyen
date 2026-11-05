import { formNavn, mal } from "../tekst/ordbok";
import { erHalvFelle, halvveisTekst, tidTilDigital24, tidTilOrd } from "../tid/tid";
import type { Oppgave, Spraak } from "../typer";

function si(spraak: Spraak, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(spraak, nb, nn, verdier);
}

function sorterHint(oppgave: Oppgave, spraak: Spraak, fasit: boolean): string {
  const kasser = oppgave.kasser ?? [];
  if (kasser.some((kasse) => kasse.id === "tre")) {
    return fasit
      ? si(spraak, "Tre hjørner er en trekant. Fire hjørner er et kvadrat eller et rektangel.", "Tre hjørne er ein trekant. Fire hjørne er eit kvadrat eller eit rektangel.")
      : si(spraak, "Se etter hjørner. En trekant har tre.", "Sjå etter hjørne. Ein trekant har tre.");
  }
  if (kasser.some((kasse) => kasse.id === "triller")) {
    return fasit
      ? si(spraak, "Kule, sylinder og kjegle kan trille. Kuben kan ikke.", "Kule, sylinder og kjegle kan trille. Kuben kan ikkje.")
      : si(spraak, "Se om formen kan trille.", "Sjå om forma kan trille.");
  }
  return fasit
    ? si(spraak, "Runde former har ingen hjørner.", "Runde former har ingen hjørne.")
    : si(spraak, "Se etter hjørner. Har sirkelen noen hjørner?", "Sjå etter hjørne. Har sirkelen nokon hjørne?");
}

export function forklaring(oppgave: Oppgave, svar: string, spraak: Spraak, gang = 2): string {
  if (gang < 2) {
    if (oppgave.type === "apningstider") {
      return si(spraak, "Sammenlign skiltet med klokka.", "Samanlikn skiltet med klokka.");
    }
    if (oppgave.type === "rekker-jeg") return si(spraak, "Se hvor lang tid veien tar.", "Sjå kor lang tid vegen tek.");
    if (oppgave.type === "monster") return si(spraak, "Se hva som gjentar seg.", "Sjå kva som gjentar seg.");
    if (oppgave.maalKlokke !== undefined) {
      return si(spraak, "Se på den lille viseren. Den viser timen.", "Sjå på den vesle visaren. Han viser timen.");
    }
    if (oppgave.type === "finn-formen" || oppgave.type === "hvem-passer-ikke") {
      return si(spraak, "Se på formen, ikke fargen.", "Sjå på forma, ikkje fargen.");
    }
    if (oppgave.type === "sorter") return sorterHint(oppgave, spraak, false);
    return si(spraak, "Se på bildet en gang til.", "Sjå på biletet ein gong til.");
  }
  if (oppgave.type === "sorter") return sorterHint(oppgave, spraak, true);
  const valgt = oppgave.valg.find((valg) => valg.id === svar);
  const svarKlokke = valgt?.klokke ?? (Number.isFinite(Number(svar)) ? Number(svar) : undefined);
  if (oppgave.maalKlokke !== undefined && svarKlokke !== undefined && erHalvFelle(oppgave.maalKlokke, svarKlokke)) {
    return halvveisTekst(oppgave.maalKlokke, spraak);
  }
  if (oppgave.type === "apningstider") {
    if (oppgave.fasit === "ja") {
      const skilt = oppgave.skilt;
      const stenger = skilt?.stengtFra !== undefined && skilt.naa < skilt.stengtFra ? skilt.stengtFra : (skilt?.stenger ?? oppgave.tall ?? 0);
      return si(spraak, "Butikken er åpen. Den stenger {tid}.", "Butikken er open. Den stengjer {tid}.", { tid: tidTilDigital24(stenger) });
    }
    const rett = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
    const apner = rett?.klokke ?? oppgave.skilt?.neste ?? oppgave.tall ?? 0;
    return si(spraak, "Butikken er stengt. Den åpner {tid}.", "Butikken er stengt. Den opnar {tid}.", { tid: tidTilDigital24(apner) });
  }
  if (oppgave.koordinat) {
    return si(spraak, "Det riktige er rute {rute}.", "Det rette er rute {rute}.", { rute: oppgave.koordinat });
  }
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "rekker-jeg" && oppgave.type !== "hvor-lenge") {
    const fasitTid = oppgave.valg.find((valg) => valg.id === oppgave.fasit)?.klokke ?? oppgave.maalKlokke;
    return si(spraak, "Klokka er {ord}. Digitalt er det {digital}.", "Klokka er {ord}. Digitalt er det {digital}.", {
      ord: tidTilOrd(fasitTid, spraak),
      digital: tidTilDigital24(fasitTid),
    });
  }
  if (oppgave.type === "tegn") {
    return si(spraak, "Følg kanten rundt hele formen.", "Følg kanten rundt heile forma.");
  }
  if (oppgave.tall !== undefined && oppgave.type === "tell") {
    return si(spraak, "Det er {tall}.", "Det er {tall}.", { tall: String(oppgave.tall) });
  }
  if (oppgave.type === "rekker-jeg") {
    return oppgave.fasit === "ja"
      ? si(spraak, "Du rekker fram.", "Du rekk fram.")
      : si(spraak, "Du rekker ikke fram.", "Du rekk ikkje fram.");
  }
  if (oppgave.type === "monster") return si(spraak, "Neste form er {form}.", "Neste form er {form}.", { form: formNavn(oppgave.fasit, spraak) });
  if (oppgave.type === "finn-formen" && oppgave.form) {
    return si(spraak, "Se etter {form}.", "Sjå etter {form}.", { form: formNavn(oppgave.form, spraak) });
  }
  const rett = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
  if (rett?.tekst) return si(spraak, "Det riktige er {svar}.", "Det rette er {svar}.", { svar: rett.tekst });
  return si(spraak, "Se på bildet en gang til.", "Sjå på biletet ein gong til.");
}
