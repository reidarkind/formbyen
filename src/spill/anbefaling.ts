import { aktivitetKnapp, aktivitetNa, visNavn } from "../dag/aktiviteter";
import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { byggDef } from "../bygg/katalog";
import { ferdigeBygg, kravSomOves, ledigeTomter, nesteByggId } from "../bygg/kart";
import { morgendagensApning } from "../dag/plan";
import { byggBestemt as byggBestemtOrd, mal, navnVare, vareAntall, vareBestemt, vareMedArtikkel, klarFor } from "../tekst/ordbok";
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
  | { slag: "klokke" }
  | { slag: "ov" }
  | { slag: "ekstra" }
  | { slag: "byplan" }
  | { slag: "se" };

export interface NesteSteg {
  handling: Anbefaling;
  knapp: string;
  grunn: string;
  puls: string | null;
  nei?: string;
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
      return dag.tid >= avtale.start - 15 && dag.tid < slutt && erHer(lagret, avtale);
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
  return dag.tid + dit < avtale.start + avtale.varighet && dag.tid + dit < dag.plan.leggetid;
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
  if (butikk.stengtTil !== undefined && dag.tid < butikk.stengtTil) {
    const dit = dag.sted === "butikk" ? 0 : gang(lagret, dag.sted, "butikk");
    if (dag.tid >= (butikk.stengtFra ?? 0) || dag.tid + dit >= (butikk.stengtFra ?? butikk.stenger)) return butikk.stengtTil;
  }
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

const BESTEMT_STED: Record<string, [string, string]> = {
  idrettshall: ["idrettshallen", "idrettshallen"],
  bibliotek: ["biblioteket", "biblioteket"],
  korpslokale: ["korpslokalet", "korpslokalet"],
  musikkskole: ["musikkskolen", "musikkskulen"],
  togstasjon: ["togstasjonen", "togstasjonen"],
  skole: ["skolen", "skulen"],
  kirke: ["kirken", "kyrkja"],
  bakeri: ["bakeriet", "bakeriet"],
};

function stedFrase(lagret: Lagret, sted: StedId): string {
  if (sted === "hjemme") return si(lagret, "hjemme", "heime");
  if (sted === "torg") return si(lagret, "på torget", "på torget");
  if (sted === "tannlege") return si(lagret, "hos tannlegen", "hos tannlækjaren");
  if (sted === "butikk") return si(lagret, "i butikken", "i butikken");
  if (sted === "svommehall") return si(lagret, "i svømmehallen", "i symjehallen");
  if (sted === "barnehage") return si(lagret, "i barnehagen", "i barnehagen");
  if (sted === "byggeplass") return si(lagret, "på tomta", "på tomta");
  return si(lagret, "på stedet", "på staden");
}

function gaaSetning(lagret: Lagret, sted: StedId, navn: string, tid: string): string {
  if (sted === "hjemme") {
    return si(lagret, "Gå hjem. {navn} starter kl. {tid}.", "Gå heim. {navn} startar kl. {tid}.", { navn, tid });
  }
  if (navn.toLowerCase().includes("tann")) {
    return si(lagret, "Tannlegetimen begynner {tid}.", "Tannlegetimen byrjar {tid}.", { tid });
  }
  return si(lagret, "Gå til {sted}. {navn} starter kl. {tid}.", "Gå til {sted}. {navn} startar kl. {tid}.", {
    sted: maalNavn(lagret, sted),
    navn,
    tid,
  });
}

function maalNavn(lagret: Lagret, sted: StedId): string {
  if (sted !== "aktivitet") return stedNavn(lagret, sted);
  const dag = lagret.aktivDag;
  const avtale = dag?.plan.avtaler.find((rad) => stedFor(rad) === "aktivitet" && rad.varighet > 0);
  const id = avtale?.sted ?? "";
  const par = BESTEMT_STED[id];
  if (par) return si(lagret, par[0], par[1]);
  return stedNavn(lagret, sted);
}

function gaaKnapp(lagret: Lagret, sted: StedId, grunn: string): NesteSteg {
  const dag = lagret.aktivDag;
  const minutter = dag ? gang(lagret, dag.sted, sted) : 0;
  const navnSted = maalNavn(lagret, sted);
  const knapp =
    sted === "hjemme"
      ? si(lagret, "Gå hjem", "Gå heim")
      : `${si(lagret, "Gå til {sted}", "Gå til {sted}", { sted: navnSted })} · ${minutter} min`;
  return { handling: { slag: "gaa", sted }, knapp, grunn, puls: sted };
}

function delTekst(lagret: Lagret, vare: VareId): string {
  return vareBestemt(vare, lagret.innstillinger.spraak);
}

function klarOrd(vare: VareId, lagret?: Lagret): string {
  return klarFor(vare, lagret?.innstillinger.spraak ?? "nb");
}

function byggBestemt(lagret: Lagret, id: ByggId, stor = false): string {
  return byggBestemtOrd(id, lagret.innstillinger.spraak, stor);
}

function ferdigDagens(lagret: Lagret): boolean {
  const id = lagret.aktivDag?.dagensBygg;
  if (!id || lagret.aktivDag?.ekstraNei) return false;
  const ferdig = lagret.by.bygg.some((bygg) => bygg.bygg === id && bygg.ferdig);
  const apen = lagret.by.bygg.some((bygg) => bygg.bygg === id && !bygg.ferdig);
  return ferdig && !apen;
}

/** Deler per dag fra bynivå 3. 2. klasse veksler mellom 4 og 5, så slottet nås på 20–25 ettermiddager. */
function kjopTak(nivaa: Nivaa, dag: number): number {
  if (nivaa === "forste") return 4;
  if (nivaa === "andre") return dag % 2 === 0 ? 4 : 5;
  return 5;
}

function kjopStans(lagret: Lagret): boolean {
  const maal = maalBygg(lagret);
  if (!maal || byggDef(maal.id).nivaa < 3) return false;
  return (lagret.aktivDag?.kjopIDag ?? 0) >= kjopTak(lagret.innstillinger.nivaa, lagret.dato.dag);
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

function ventHer(lagret: Lagret, tid: number, grunnKort: string, forklaring: string, puls: string | null): NesteSteg {
  if (lagret.aktivDag?.sted === "byggeplass") return gaaKnapp(lagret, "hjemme", si(lagret, "Gå hjem.", "Gå heim."));
  return ventKnapp(lagret, tid, grunnKort, forklaring, puls);
}

function ovKnapp(lagret: Lagret, krav: "monster" | "klokke" | "rom"): NesteSteg {
  const tekst: Record<typeof krav, { knapp: [string, string]; grunn: [string, string] }> = {
    monster: { knapp: ["Øv på mønstre", "Øv på mønster"], grunn: ["For å bygge videre må vi øve på mønstre.", "For å byggje vidare må vi øve på mønster."] },
    klokke: {
      knapp: ["Øv på klokka", "Øv på klokka"],
      grunn: ["For å bygge videre må vi klare tre klokkeoppgaver på rad.", "For å byggje vidare må vi klare tre klokkeoppgåver på rad."],
    },
    rom: { knapp: ["Øv på klosser", "Øv på klossar"], grunn: ["For å bygge videre må vi lære flere klosser.", "For å byggje vidare må vi lære fleire klossar."] },
  };
  const rad = tekst[krav];
  return { handling: { slag: "ov" }, knapp: si(lagret, rad.knapp[0], rad.knapp[1]), grunn: si(lagret, rad.grunn[0], rad.grunn[1]), puls: "hjemme" };
}

function klokkeKnapp(lagret: Lagret): NesteSteg {
  return {
    handling: { slag: "klokke" },
    knapp: si(lagret, "Klokkeleken", "Klokkeleiken"),
    grunn: si(lagret, "Ingen flere kjøp i dag. Vil du stille tårnuret?", "Ingen fleire kjøp i dag. Vil du stille tårnuret?"),
    puls: null,
  };
}

export function nesteSteg(lagret: Lagret): NesteSteg {
  const dag = lagret.aktivDag;
  if (!dag) {
    return { handling: { slag: "se" }, knapp: si(lagret, "Spill", "Spel"), grunn: si(lagret, "Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka."), puls: null };
  }
  const spraak = lagret.innstillinger.spraak;
  const igjen = dag.plan.leggetid - dag.tid;

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
    const senStart = dag.tid > her.start;
    return {
      handling: { slag: "mot" },
      knapp: aktivitetKnapp(her.aktivitet ?? her.navn, spraak),
      grunn: aktivitetNa(her.aktivitet ?? her.navn, spraak, senStart),
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

  const mangler = manglendeDeler(lagret);
  const del = delIKurv(lagret);
  const apenNaa = butikkVed(lagret, dag.tid);
  const stans = kjopStans(lagret);

  if (dag.sted === "butikk" && !dag.dorLest) {
    return {
      handling: { slag: "handle" },
      knapp: si(lagret, "Les skiltet", "Les skiltet"),
      grunn: si(lagret, "Les skiltet på døra.", "Les skiltet på døra."),
      puls: "butikk",
    };
  }
  if (dag.sted === "butikk" && dag.dorLest && !apenNaa && !dag.plan.butikk.stengtHele) {
    const butikk = dag.plan.butikk;
    const apner = dag.tid < butikk.apner ? butikk.apner : butikk.stengtTil !== undefined && dag.tid < butikk.stengtTil ? butikk.stengtTil : null;
    if (apner !== null && apner > dag.tid) {
      const tid = tidTilDigital24(apner);
      return ventHer(
        lagret,
        apner,
        si(lagret, "butikken åpner", "butikken opnar"),
        si(lagret, "Vent til {tid}. Butikken åpner.", "Vent til {tid}. Butikken opnar.", { tid }),
        "butikk",
      );
    }
  }
  if (dag.sted === "butikk" && apenNaa && mangler.length > 0 && !stans) {
    const vare = mangler[0] ?? "planke";
    return {
      handling: { slag: "handle" },
      knapp: si(lagret, "Kjøp {del}", "Kjøp {del}", { del: navnVare(vare, spraak) }),
      grunn: si(lagret, "{bygg} trenger {del}.", "{bygg} treng {del}.", {
        bygg: byggBestemt(lagret, maalBygg(lagret)?.id ?? "bronn", true),
        del: vareMedArtikkel(vare, spraak),
      }),
      puls: "butikk",
    };
  }
  if (del && dag.sted === "byggeplass" && (del.instans === null || dag.valgtInstans === del.instans) && (lagret.kurv[del.vare] ?? 0) > 0) {
    return {
      handling: { slag: "bygg", bygg: del.bygg, instans: del.instans },
      knapp: si(lagret, "Sett på {del}", "Set på {del}", { del: navnVare(del.vare, spraak) }),
      grunn: si(lagret, "{del} er {klar}.", "{del} er {klar}.", { del: delTekst(lagret, del.vare), klar: klarOrd(del.vare, lagret) }),
      puls: del.instans ? `bygg:${del.instans}` : "tomt",
    };
  }

  const avgang = apne(lagret).find((avtale) => {
    if (erHer(lagret, avtale) || dag.tid > avtale.start) return false;
    const sted = stedFor(avtale);
    const dit = gang(lagret, dag.sted, sted);
    return dag.tid + dit > avtale.start - 1 && dag.tid + dit < avtale.start + avtale.varighet;
  });
  if (avgang) {
    const sted = stedFor(avgang);
    return gaaKnapp(
      lagret,
      sted,
      gaaSetning(lagret, sted, navn(lagret, avgang), tidTilOrd(avgang.start, spraak)),
    );
  }

  if (del && rekkerMotFrist(lagret, "byggeplass", 0)) {
    const tomt = del.instans ? null : ledigeTomter(lagret.by, del.bygg)[0];
    if (del.instans || tomt) {
      return {
        handling: { slag: "bygg", bygg: del.bygg, instans: del.instans },
        knapp: si(lagret, "Gå til tomta", "Gå til tomta"),
        grunn: si(lagret, "{del} er {klar}. Gå til tomta.", "{del} er {klar}. Gå til tomta.", {
          del: delTekst(lagret, del.vare),
          klar: klarOrd(del.vare, lagret),
        }),
        puls: del.instans ? `bygg:${del.instans}` : "tomt",
      };
    }
  }

  const forste = apne(lagret).find((avtale) => avtale.start >= dag.tid && kanMotes(lagret, avtale));
  const tidlig = forste && erHer(lagret, forste) && dag.tid < forste.start ? forste : undefined;

  if (mangler.length > 0 && !stans && dag.sted !== "butikk") {
    const ankomst = dag.tid + gang(lagret, dag.sted, "butikk");
    const apenVedAnkomst = butikkVed(lagret, ankomst);
    if (apenVedAnkomst && rekkerMotFrist(lagret, "butikk", 0)) {
      const vare = mangler[0] ?? "planke";
      return gaaKnapp(
        lagret,
        "butikk",
        si(lagret, "{bygg} trenger {del}. Gå til butikken.", "{bygg} treng {del}. Gå til butikken.", {
          bygg: byggBestemt(lagret, maalBygg(lagret)?.id ?? "bronn", true),
          del: vareMedArtikkel(vare, spraak),
        }),
      );
    }
  }


  const nesteBygg = nesteByggId(lagret.by);
  const ankomstButikk = dag.tid + gang(lagret, dag.sted, "butikk");
  const rekkerButikken =
    butikkVed(lagret, ankomstButikk) && butikkVed(lagret, ankomstButikk + 29) && rekkerMotFrist(lagret, "butikk", 0);
  if (ferdigDagens(lagret) && nesteBygg && lagret.innstillinger.nivaa !== "utfordrende" && rekkerButikken) {
    const oppskrift = byggDef(nesteBygg).oppskrift;
    const forsteDel = oppskrift[0]?.vare ?? "planke";
    const antallForste = oppskrift.filter((trinn) => trinn.vare === forsteDel).length;
    return {
      handling: { slag: "ekstra" },
      knapp: si(lagret, "Ja, gå til butikken", "Ja, gå til butikken"),
      nei: si(lagret, "Nei, ikke i dag", "Nei, ikkje i dag"),
      grunn: si(
        lagret,
        "{ferdig} er ferdig! Vil du begynne på {neste} også? Det trenger {deler}.",
        "{ferdig} er ferdig! Vil du byrje på {neste} også? Det treng {deler}.",
        {
          ferdig: byggBestemtOrd(dag.dagensBygg ?? "bronn", spraak, true),
          neste: byggBestemtOrd(nesteBygg, spraak),
          deler: vareAntall(forsteDel, antallForste, spraak),
        },
      ),
      puls: "butikk",
    };
  }

  const apneIgjen = nesteApneTid(lagret);
  if (mangler.length > 0 && !stans && apneIgjen !== null) {
    const dit = dag.sted === "butikk" ? 0 : gang(lagret, dag.sted, "butikk");
    const tidligSteg = lagret.innstillinger.nivaa === "forste" ? 30 : 15;
    const tidlig = lagret.fro % 5 === 0 && dag.sted !== "butikk" && apneIgjen - dit - tidligSteg >= dag.tid;
    const avreise = Math.max(dag.tid, apneIgjen - dit - (tidlig ? tidligSteg : 0));
    const venterHer = dag.sted === "hjemme" || dag.sted === "butikk";
    const fr = frist(lagret);
    const fremme = apneIgjen + gang(lagret, "butikk", fr.sted);
    const hjemmeEtter = apneIgjen + gang(lagret, "butikk", "hjemme");
    if (venterHer && avreise > dag.tid && fremme <= fr.tid && hjemmeEtter < dag.plan.leggetid) {
      const tidTekst = tidTilDigital24(avreise);
      const fremmeTekst = tidTilDigital24(apneIgjen);
      const tekst =
        dag.sted === "butikk"
          ? si(lagret, "Vent til {tid}. Butikken åpner.", "Vent til {tid}. Butikken opnar.", { tid: fremmeTekst })
          : tidlig
            ? si(lagret, "Vi er tidlig ute. Les skiltet. Vi går kl. {tid}.", "Vi er tidleg ute. Les skiltet. Vi går kl. {tid}.", { tid: tidTekst })
            : si(lagret, "Vi går kl. {tid}, så er vi i butikken kl. {fremme}.", "Vi går kl. {tid}, så er vi i butikken kl. {fremme}.", {
                tid: tidTekst,
                fremme: fremmeTekst,
              });
      const kort = dag.sted === "butikk" ? si(lagret, "butikken åpner", "butikken opnar") : si(lagret, "så går vi", "så går vi");
      return ventHer(lagret, avreise, kort, tekst, dag.sted === "butikk" ? "butikk" : "hjemme");
    }
    if (dag.sted !== "butikk" && !dag.dorLest && avreise <= dag.tid && apneIgjen > dag.tid && fremme <= fr.tid && hjemmeEtter < dag.plan.leggetid && rekkerMotFrist(lagret, "butikk", 0)) {
      // Tiden for å gå er kommet. Vi er tidlig ute og leser skiltet når vi kommer fram.
      return gaaKnapp(
        lagret,
        "butikk",
        si(lagret, "{bygg} trenger {del}. Butikken åpner kl. {tid}. Gå dit og les skiltet.", "{bygg} treng {del}. Butikken opnar kl. {tid}. Gå dit og les skiltet.", {
          bygg: byggBestemt(lagret, maalBygg(lagret)?.id ?? "bronn", true),
          del: vareMedArtikkel(mangler[0] ?? "planke", spraak),
          tid: tidTilDigital24(apneIgjen),
        }),
      );
    }
  }

  if (tidlig) {
    return ventHer(
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

  const neste = apne(lagret).find((avtale) => kanMotes(lagret, avtale) && avtale.start >= dag.tid);
  if (neste && !erHer(lagret, neste)) {
    const sted = stedFor(neste);
    const avreise = neste.start - gang(lagret, dag.sted, sted);
    const samme = dag.sted === sted;
    if (avreise > dag.tid && (dag.sted === "hjemme" || samme)) {
      if (dag.plan.butikk.stengtHele && !dag.klokkeLekt && avreise - dag.tid > 45) return klokkeKnapp(lagret);
      const kort = samme ? navn(lagret, neste) : si(lagret, "gå til {sted}", "gå til {sted}", { sted: maalNavn(lagret, sted) });
      const tekst = samme
        ? si(lagret, "{navn} starter kl. {tid}. Vi venter her.", "{navn} startar kl. {tid}. Vi ventar her.", {
            navn: navn(lagret, neste),
            tid: tidTilOrd(neste.start, spraak),
          })
        : si(lagret, "Vi går kl. {tid}, så er vi {sted} klokka {start}.", "Vi går kl. {tid}, så er vi {sted} klokka {start}.", {
            tid: tidTilDigital24(avreise),
            sted: stedFrase(lagret, sted),
            start: tidTilOrd(neste.start, spraak),
          });
      return ventHer(lagret, avreise, kort, tekst, dag.sted);
    }
    if (dag.tid + gang(lagret, dag.sted, sted) < neste.start + neste.varighet) {
      return gaaKnapp(
        lagret,
        sted,
        gaaSetning(lagret, sted, navn(lagret, neste), tidTilOrd(neste.start, spraak)),
      );
    }
  }

  if (dag.plan.butikk.stengtHele && !dag.klokkeLekt && igjen > 30) return klokkeKnapp(lagret);

  if (dag.sted === "butikk" && stengtResten(lagret)) {
    const apning = tidTilDigital24(
      dag.plan.nesteApning ??
        morgendagensApning({
          fro: lagret.fro,
          dato: lagret.dato,
          nivaa: lagret.innstillinger.nivaa,
          spraak: lagret.innstillinger.spraak,
          ferdige: ferdigeBygg(lagret.by),
          ukerytme: lagret.ukerytme,
          fasteAvtaler: lagret.innstillinger.fasteAvtaler,
          siste: lagret.sistePlaner,
          bursdager: lagret.bursdager,
        }),
    );
    const grunn =
      dag.plan.ukedag === "lordag" || dag.plan.ukedag === "sondag"
        ? si(lagret, "Butikken er stengt. Åpner mandag kl. {tid}.", "Butikken er stengt. Opnar måndag kl. {tid}.", { tid: apning })
        : si(lagret, "Butikken er stengt. Den åpner i morgen kl. {tid}.", "Butikken er stengt. Den opnar i morgon kl. {tid}.", { tid: apning });
    if (dag.tid + gang(lagret, dag.sted, "hjemme") <= dag.plan.leggetid) return gaaKnapp(lagret, "hjemme", grunn);
  }

  if (dag.sted !== "hjemme") {
    return gaaKnapp(lagret, "hjemme", si(lagret, "Gå hjem.", "Gå heim."));
  }
  if (igjen <= 30) return leggKnapp(lagret, si(lagret, "Snart leggetid.", "Snart leggetid."));
  // Alt på nivået er bygget, men et krav for neste nivå mangler. Spillet gir øvingen (gj. 10, C5).
  const krav = kravSomOves(lagret.by);
  if (krav && igjen > 45) return ovKnapp(lagret, krav);
  if (!dag.klokkeLekt) return klokkeKnapp(lagret);
  const ventTil = dag.plan.leggetid - 30;
  const kveldTekst =
    mangler.length > 0
      ? si(lagret, "Butikken stenger før vi rekker dit. Vi kjøper {del} i morgen. Vi venter til kl. {tid}.", "Butikken stengjer før vi rekk dit. Vi kjøper {del} i morgon. Vi ventar til kl. {tid}.", {
          del: navnVare(mangler[0] ?? "planke", spraak),
          tid: tidTilDigital24(ventTil),
        })
      : ferdigDagens(lagret) && nesteBygg
        ? si(lagret, "{neste} kan vi begynne på i morgen. Vi venter hjemme til leggetid.", "{neste} kan vi byrje på i morgon. Vi ventar heime til leggetid.", {
            neste: byggBestemtOrd(nesteBygg, spraak, true),
          })
        : si(lagret, "Vi har gjort alt vi rakk i dag. Vi venter hjemme til leggetid.", "Vi har gjort alt vi rakk i dag. Vi ventar heime til leggetid.");
  return ventHer(
    lagret,
    ventTil,
    si(lagret, "leggetid", "leggetid"),
    kveldTekst,
    "hjemme",
  );
}
