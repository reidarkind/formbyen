import { aktivitetKnapp, visNavn } from "../dag/aktiviteter";
import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { byggDef } from "../bygg/katalog";
import { ledigeTomter } from "../bygg/kart";
import { mal, navnVare } from "../tekst/ordbok";
import { erApen, tidTilDigital24, tidTilOrd } from "../tid/tid";
import type { Avtale, ByggId, Dagsplan, Lagret, Nivaa, StedId, VareId } from "../typer";

export function gangMinutter(fra: StedId, til: StedId, nivaa: Nivaa = "andre"): number {
  const langt = (sted: StedId) => sted === "tannlege" || sted === "svommehall";
  const grunn = langt(fra) || langt(til) ? 30 : 15;
  return nivaa === "forste" ? Math.max(30, grunn) : grunn;
}

export function stedForAvtale(sted: string): StedId {
  if (
    sted === "butikk" ||
    sted === "torg" ||
    sted === "tannlege" ||
    sted === "svommehall" ||
    sted === "byggeplass" ||
    sted === "aktivitet" ||
    sted === "barnehage"
  ) {
    return sted;
  }
  if (sted === "hjemme" || sted === "") return "hjemme";
  return "aktivitet";
}

/** Neste tidspunkt vent-knappen skal lande på. Middag er med. Avreisen er slik at barnet kommer frem i tide. */
export function ventMaalTid(lagret: Lagret): number | null {
  const steg = nesteSteg(lagret);
  if (steg.handling.slag === "vent" && steg.handling.tid > (lagret.aktivDag?.tid ?? 0)) return steg.handling.tid;
  return null;
}

export type Anbefaling =
  | { slag: "mot" }
  | { slag: "handle" }
  | { slag: "spis" }
  | { slag: "bygg"; bygg: ByggId; instans: string | null }
  | { slag: "gaa"; sted: StedId }
  | { slag: "vent"; tid: number }
  | { slag: "legg" }
  | { slag: "byplan" }
  | { slag: "se" };

export interface NesteSteg {
  handling: Anbefaling;
  knapp: string;
  grunn: string;
  puls: string | null;
}

export function anbefalt(lagret: Lagret): Anbefaling {
  return nesteSteg(lagret).handling;
}

/** Første klokkeslett det er noe å gjøre. Hopper over lange tomme timer. */
export function startTidFor(plan: Dagsplan, nivaa: Nivaa): number {
  const start = plan.start;
  const tider: number[] = [];
  if (!plan.butikk.stengtHele) {
    tider.push(Math.max(start, plan.butikk.apner - gangMinutter("hjemme", "butikk", nivaa)));
  }
  for (const avtale of plan.avtaler) {
    if (avtale.varighet <= 0) continue;
    const sted = stedFor(avtale);
    const gang = sted === "hjemme" ? 0 : gangMinutter("hjemme", sted, nivaa);
    tider.push(Math.max(start, avtale.start - gang));
  }
  if (!tider.length) return start;
  const forste = Math.min(...tider);
  return forste - start > 60 ? forste : start;
}

function si(lagret: Lagret, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(lagret.innstillinger.spraak, nb, nn, verdier);
}

function stedFor(avtale: Avtale): StedId {
  if (avtale.slag === "middag") return "hjemme";
  return stedForAvtale(avtale.sted);
}

function apne(lagret: Lagret): Avtale[] {
  const dag = lagret.aktivDag;
  if (!dag) return [];
  return dag.plan.avtaler
    .filter((avtale) => avtale.varighet > 0 && !dag.besokt.includes(avtale.id) && !dag.forSent.includes(avtale.id))
    .sort((a, b) => a.start - b.start || a.id.localeCompare(b.id, "nb"));
}

function erHer(lagret: Lagret, avtale: Avtale): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return false;
  return dag.sted === stedFor(avtale);
}

/** Avtalen den gule knappen gjelder, når barnet står på rett sted i tide. */
export function avtaleHer(lagret: Lagret): Avtale | null {
  const dag = lagret.aktivDag;
  if (!dag) return null;
  return (
    apne(lagret).find((avtale) => {
      const slutt = avtale.start + avtale.varighet;
      return dag.tid >= avtale.start - 15 && dag.tid <= slutt && erHer(lagret, avtale);
    }) ?? null
  );
}

function navn(lagret: Lagret, avtale: Avtale): string {
  return visNavn(avtale.aktivitet ?? avtale.navn, lagret.innstillinger.spraak);
}

function gang(lagret: Lagret, fra: StedId, til: StedId): number {
  if (fra === til) return 0;
  return gangMinutter(fra, til, lagret.innstillinger.nivaa);
}

/** Nå + gange dit + varighet + gange til fristen rekker fristen. */
function rekker(lagret: Lagret, maal: StedId, varighet: number, fristTid: number, fristSted: StedId): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return false;
  const dit = gang(lagret, dag.sted, maal);
  const videre = gang(lagret, maal, fristSted);
  return dag.tid + dit + varighet + videre <= fristTid;
}

function frist(lagret: Lagret): { tid: number; sted: StedId } {
  const dag = lagret.aktivDag;
  if (!dag) return { tid: 20 * 60, sted: "hjemme" };
  const neste = apne(lagret).find((avtale) => kanMotes(lagret, avtale) && avtale.start >= dag.tid);
  if (neste) return { tid: neste.start, sted: stedFor(neste) };
  return { tid: dag.plan.leggetid, sted: "hjemme" };
}

function rekkerMotFrist(lagret: Lagret, maal: StedId, varighet: number): boolean {
  const maalFrist = frist(lagret);
  const dag = lagret.aktivDag;
  if (!dag) return false;
  if (!rekker(lagret, maal, varighet, maalFrist.tid, maalFrist.sted)) return false;
  const hjem = gang(lagret, maal, "hjemme");
  return dag.tid + gang(lagret, dag.sted, maal) + varighet + hjem <= dag.plan.leggetid;
}

function kanMotes(lagret: Lagret, avtale: Avtale): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return false;
  const sted = stedFor(avtale);
  const dit = gang(lagret, dag.sted, sted);
  return dag.tid + dit <= avtale.start + avtale.varighet && dag.tid + dit < dag.plan.leggetid;
}

function butikkVed(lagret: Lagret, tid: number): boolean {
  const dag = lagret.aktivDag;
  if (!dag || dag.plan.butikk.stengtHele) return false;
  return erApen(tid, dag.plan.butikk);
}

function stengtResten(lagret: Lagret): boolean {
  const dag = lagret.aktivDag;
  if (!dag) return true;
  const butikk = dag.plan.butikk;
  if (butikk.stengtHele || dag.tid >= butikk.stenger) return true;
  if (butikk.stengtTil !== undefined && dag.tid >= (butikk.stengtFra ?? 0) && dag.tid < butikk.stengtTil) return false;
  return false;
}

function nesteApneTid(lagret: Lagret): number | null {
  const dag = lagret.aktivDag;
  if (!dag || dag.plan.butikk.stengtHele) return null;
  const butikk = dag.plan.butikk;
  if (dag.tid < butikk.apner) return butikk.apner;
  if (butikk.stengtTil !== undefined && dag.tid < butikk.stengtTil && dag.tid >= (butikk.stengtFra ?? 0)) return butikk.stengtTil;
  return null;
}

function delIKurv(lagret: Lagret): { bygg: ByggId; instans: string | null; vare: VareId } | null {
  const maal = maalBygg(lagret);
  if (!maal) return null;
  const trinn = byggDef(maal.id).oppskrift[maal.steg];
  if (!trinn || (lagret.kurv[trinn.vare] ?? 0) <= 0) return null;
  const plassert = lagret.by.bygg.find((bygg) => bygg.bygg === maal.id && !bygg.ferdig);
  return { bygg: maal.id, instans: plassert?.instans ?? null, vare: trinn.vare };
}

function stedNavn(lagret: Lagret, sted: StedId): string {
  if (sted === "hjemme") return si(lagret, "hjem", "heim");
  if (sted === "butikk") return si(lagret, "butikken", "butikken");
  if (sted === "tannlege") return si(lagret, "tannlegen", "tannlækjaren");
  if (sted === "svommehall") return si(lagret, "svømmehallen", "symjehallen");
  if (sted === "torg") return si(lagret, "torget", "torget");
  if (sted === "barnehage") return si(lagret, "barnehagen", "barnehagen");
  if (sted === "byggeplass") return si(lagret, "tomta", "tomta");
  return si(lagret, "stedet", "staden");
}

function gaaKnapp(lagret: Lagret, sted: StedId, grunn: string): NesteSteg {
  const dag = lagret.aktivDag;
  const minutter = dag ? gang(lagret, dag.sted, sted) : 0;
  const navnSted = stedNavn(lagret, sted);
  const knapp =
    sted === "hjemme"
      ? `${si(lagret, "Gå hjem", "Gå heim")} · ${minutter} min`
      : `${si(lagret, "Gå til {sted}", "Gå til {sted}", { sted: navnSted })} · ${minutter} min`;
  return { handling: { slag: "gaa", sted }, knapp, grunn, puls: sted };
}

function ventKnapp(lagret: Lagret, tid: number, grunnKort: string, grunn: string, puls: string | null): NesteSteg {
  const knapp = si(lagret, "Vent til {tid} · {grunn}", "Vent til {tid} · {grunn}", {
    tid: tidTilDigital24(tid),
    grunn: grunnKort,
  });
  return { handling: { slag: "vent", tid }, knapp, grunn, puls };
}

function leggKnapp(lagret: Lagret, grunn: string): NesteSteg {
  return { handling: { slag: "legg" }, knapp: si(lagret, "Legg deg", "Legg deg"), grunn, puls: "hjemme" };
}

function timeIgjen(lagret: Lagret, tekst: string): string {
  const dag = lagret.aktivDag;
  if (!dag) return tekst;
  const igjen = dag.plan.leggetid - dag.tid;
  if (igjen > 45 && igjen <= 75) return `${si(lagret, "En time til leggetid.", "Ein time til leggetid.")} ${tekst}`;
  return tekst;
}

export function nesteSteg(lagret: Lagret): NesteSteg {
  const dag = lagret.aktivDag;
  if (!dag) {
    return { handling: { slag: "se" }, knapp: si(lagret, "Spill", "Spel"), grunn: si(lagret, "Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka."), puls: null };
  }
  const spraak = lagret.innstillinger.spraak;

  const her = avtaleHer(lagret);
  if (her) {
    if (her.slag === "middag") {
      return {
        handling: { slag: "spis" },
        knapp: aktivitetKnapp("middag", spraak),
        grunn: si(lagret, "Middagen er klar.", "Middagen er klar."),
        puls: "hjemme",
      };
    }
    return {
      handling: { slag: "mot" },
      knapp: aktivitetKnapp(her.aktivitet ?? her.navn, spraak),
      grunn: si(lagret, "{navn} er nå.", "{navn} er no.", { navn: navn(lagret, her) }),
      puls: dag.sted,
    };
  }

  const sen = apne(lagret).find((avtale) => dag.tid > avtale.start && kanMotes(lagret, avtale) && !erHer(lagret, avtale));
  if (sen) {
    const sted = stedFor(sen);
    const grunn =
      sted === "hjemme"
        ? si(lagret, "{navn} venter! Gå hjem nå.", "{navn} ventar! Gå heim no.", { navn: navn(lagret, sen) })
        : si(lagret, "{navn} venter. Gå dit nå.", "{navn} ventar. Gå dit no.", { navn: navn(lagret, sen) });
    return gaaKnapp(lagret, sted, grunn);
  }

  const avgang = apne(lagret).find((avtale) => {
    if (erHer(lagret, avtale) || dag.tid > avtale.start) return false;
    const sted = stedFor(avtale);
    const dit = gang(lagret, dag.sted, sted);
    return dag.tid + dit > avtale.start - 1 && dag.tid + dit <= avtale.start + avtale.varighet;
  });
  if (avgang) {
    const sted = stedFor(avgang);
    const grunn = si(lagret, "Gå til {sted}. {navn} starter kl. {tid}.", "Gå til {sted}. {navn} startar kl. {tid}.", {
      sted: stedNavn(lagret, sted),
      navn: navn(lagret, avgang),
      tid: tidTilOrd(avgang.start, spraak),
    });
    return gaaKnapp(lagret, sted, grunn);
  }

  const forste = apne(lagret).find((avtale) => avtale.start >= dag.tid && kanMotes(lagret, avtale));
  const tidlig = forste && erHer(lagret, forste) && dag.tid < forste.start ? forste : undefined;
  if (tidlig) {
    const slakk = tidlig.start - dag.tid;
    const tur = gang(lagret, dag.sted, "butikk") + gang(lagret, "butikk", stedFor(tidlig));
    const apnerSenere = nesteApneTid(lagret);
    const rekkerButikk =
      manglendeDeler(lagret).length > 0 &&
      tur < slakk &&
      (butikkVed(lagret, dag.tid + gang(lagret, dag.sted, "butikk")) ||
        (apnerSenere !== null && apnerSenere + gang(lagret, "butikk", stedFor(tidlig)) <= tidlig.start));
    if (!rekkerButikk) return ventKnapp(
      lagret,
      tidlig.start,
      navn(lagret, tidlig),
      si(lagret, "{navn} starter kl. {tid}. Vi venter her.", "{navn} startar kl. {tid}. Vi ventar her.", {
        navn: navn(lagret, tidlig),
        tid: tidTilOrd(tidlig.start, spraak),
      }),
      dag.sted,
    );
  }

  const mangler = manglendeDeler(lagret);
  const del = delIKurv(lagret);
  const apenNaa = butikkVed(lagret, dag.tid);

  if (dag.sted === "butikk" && !dag.dorLest && apenNaa) {
    return {
      handling: { slag: "handle" },
      knapp: si(lagret, "Les skiltet", "Les skiltet"),
      grunn: si(lagret, "Les skiltet.", "Les skiltet."),
      puls: "butikk",
    };
  }
  if (dag.sted === "butikk" && apenNaa && mangler.length > 0 && rekkerMotFrist(lagret, "butikk", 0)) {
    const vare = mangler[0] ?? "planke";
    return {
      handling: { slag: "handle" },
      knapp: si(lagret, "Kjøp {del}", "Kjøp {del}", { del: navnVare(vare, spraak) }),
      grunn: si(lagret, "Vi trenger {del}.", "Vi treng {del}.", { del: navnVare(vare, spraak) }),
      puls: "butikk",
    };
  }

  if (del && rekkerMotFrist(lagret, "byggeplass", 0)) {
    const paTomta = dag.sted === "byggeplass" && (del.instans === null || dag.valgtInstans === del.instans);
    if (paTomta && (lagret.kurv[del.vare] ?? 0) > 0) {
      return {
        handling: { slag: "bygg", bygg: del.bygg, instans: del.instans },
        knapp: si(lagret, "Sett på {del}", "Set på {del}", { del: navnVare(del.vare, spraak) }),
        grunn: si(lagret, "{del} er klar.", "{del} er klar.", { del: navnVare(del.vare, spraak) }),
        puls: del.instans ? `bygg:${del.instans}` : "tomt",
      };
    }
    if (!paTomta) {
      const tomt = del.instans ? null : ledigeTomter(lagret.by, del.bygg)[0];
      if (del.instans || tomt) {
        return {
          handling: { slag: "bygg", bygg: del.bygg, instans: del.instans },
          knapp: si(lagret, "Gå til tomta", "Gå til tomta"),
          grunn: si(lagret, "{del} er klar. Gå til tomta.", "{del} er klar. Gå til tomta.", { del: navnVare(del.vare, spraak) }),
          puls: del.instans ? `bygg:${del.instans}` : "tomt",
        };
      }
    }
  }

  if (mangler.length > 0 && dag.sted !== "butikk") {
    const dit = gang(lagret, dag.sted, "butikk");
    const ankomst = dag.tid + dit;
    if (butikkVed(lagret, ankomst) && rekkerMotFrist(lagret, "butikk", 0)) {
      const vare = mangler[0] ?? "planke";
      return gaaKnapp(
        lagret,
        "butikk",
        si(lagret, "{del} finnes i butikken. Gå til butikken.", "{del} finst i butikken. Gå til butikken.", {
          del: navnVare(vare, spraak),
        }),
      );
    }
  }

  const apneIgjen = nesteApneTid(lagret);
  if (mangler.length > 0 && apneIgjen !== null) {
    const dit = dag.sted === "butikk" ? 0 : gang(lagret, dag.sted, "butikk");
    const avreise = apneIgjen - dit;
    const venterHer = dag.sted === "hjemme" || (dag.sted === "butikk" && dit === 0);
    const fr = frist(lagret);
    const fremme = apneIgjen + gang(lagret, "butikk", fr.sted);
    const hjemmeEtter = apneIgjen + gang(lagret, "butikk", "hjemme");
    if (venterHer && avreise > dag.tid && fremme <= fr.tid && hjemmeEtter <= dag.plan.leggetid) {
      return ventKnapp(
        lagret,
        avreise,
        si(lagret, "butikken åpner", "butikken opnar"),
        si(lagret, "Butikken åpner kl. {tid}.", "Butikken opnar kl. {tid}.", { tid: tidTilDigital24(apneIgjen) }),
        dag.sted === "butikk" ? "butikk" : "hjemme",
      );
    }
  }

  const neste = apne(lagret).find((avtale) => kanMotes(lagret, avtale));
  if (neste && !erHer(lagret, neste) && dag.tid <= neste.start) {
    const sted = stedFor(neste);
    const avreise = neste.start - gang(lagret, dag.sted, sted);
    const venterHer = dag.sted === "hjemme" || dag.sted === sted;
    if (avreise > dag.tid && venterHer) {
      return ventKnapp(
        lagret,
        avreise,
        navn(lagret, neste),
        si(lagret, "{navn} starter kl. {tid}. Vi venter her.", "{navn} startar kl. {tid}. Vi ventar her.", {
          navn: navn(lagret, neste),
          tid: tidTilOrd(neste.start, spraak),
        }),
        dag.sted,
      );
    }
    if (dag.tid + gang(lagret, dag.sted, sted) <= neste.start + neste.varighet) {
      return gaaKnapp(
        lagret,
        sted,
        si(lagret, "Gå til {sted}. {navn} starter kl. {tid}.", "Gå til {sted}. {navn} startar kl. {tid}.", {
          sted: stedNavn(lagret, sted),
          navn: navn(lagret, neste),
          tid: tidTilOrd(neste.start, spraak),
        }),
      );
    }
  }

  if (dag.sted === "butikk" && stengtResten(lagret)) {
    const grunn =
      dag.plan.ukedag === "lordag" || dag.plan.ukedag === "sondag"
        ? si(lagret, "Butikken er stengt. Åpner mandag kl. {tid}.", "Butikken er stengt. Opnar måndag kl. {tid}.", { tid: "14:00" })
        : si(lagret, "Butikken er stengt. Den åpner i morgen kl. {tid}.", "Butikken er stengt. Den opnar i morgon kl. {tid}.", { tid: "14:00" });
    if (dag.tid + gang(lagret, dag.sted, "hjemme") < dag.plan.leggetid) return gaaKnapp(lagret, "hjemme", grunn);
  }

  if (dag.sted !== "hjemme") {
    return gaaKnapp(lagret, "hjemme", timeIgjen(lagret, si(lagret, "Gå hjem.", "Gå heim.")));
  }
  return leggKnapp(lagret, timeIgjen(lagret, si(lagret, "Snart leggetid.", "Snart leggetid.")));
}
