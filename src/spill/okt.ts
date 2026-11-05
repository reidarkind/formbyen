import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { ferdigeBygg, kanPlassere, nesteHjem, omraderForNivaa } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { lagDagsplan, nesteDato, utvidRytme } from "../dag/plan";
import { froTilfeldig, stokk } from "../felles/tilfeldig";
import { forklaring } from "../oppgaver/forklaring";
import { trekkOppgave, type OppgaveKontekst } from "../oppgaver/lag";
import { sjekkSvar } from "../oppgaver/sjekk";
import { registrerSvar } from "../tilpasning/mestring";
import { erApen, leggTil, nesteApning, tidTilDigital24, tidTilOrd } from "../tid/tid";
import { aktivitetSporsmal, visNavn } from "../dag/aktiviteter";
import { tegnKart } from "../grafikk/bygg-svg";
import { mal, navnVare } from "../tekst/ordbok";
import { ukedagTekst } from "../tekst/spraak";
import type { AktivDag, ByggId, Ferdighet, Hylle, Lagret, Nivaa, Oppgave, SkiltTid, StedId, Valg, VareId } from "../typer";
import { avtaleHer, gangMinutter, nesteSteg, startTidFor } from "./anbefaling";

export type Handling =
  | { slag: "start" }
  | { slag: "ga"; sted: StedId }
  | { slag: "vent"; tid?: number }
  | { slag: "dor" }
  | { slag: "handle" }
  | { slag: "svar"; svar: string }
  | { slag: "fortsett" }
  | { slag: "velg-bygg"; bygg: ByggId; x: number; y: number }
  | { slag: "velg"; instans: string }
  | { slag: "steg" }
  | { slag: "angre" }
  | { slag: "pynt"; vare: VareId }
  | { slag: "flytt"; instans: string; x: number; y: number }
  | { slag: "mot" }
  | { slag: "spis" }
  | { slag: "klokke" }
  | { slag: "avslutt" };

const KLOKKE: Ferdighet[] = ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24", "tidsrom", "periode", "ukedager", "maneder"];
const PYNT: VareId[] = ["pynt-blomst", "pynt-flagg", "pynt-benk", "pynt-lykt"];

function si(lagret: Lagret, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(lagret.innstillinger.spraak, nb, nn, verdier);
}

function kontekst(lagret: Lagret): OppgaveKontekst {
  return {
    tilfeldig: froTilfeldig(lagret.fro),
    spraak: lagret.innstillinger.spraak,
    nivaa: lagret.innstillinger.nivaa,
    mestring: lagret.mestring,
    plan: lagret.aktivDag?.plan ?? null,
    naa: lagret.aktivDag?.tid,
    unngaMal: lagret.sisteMaler,
    unngaNokkel: lagret.sisteNokkel,
    tidsromPa: lagret.innstillinger.tidsromPa,
    ukedagNavn: (dag) => ukedagTekst(lagret.innstillinger.spraak, dag),
  };
}

function huskOppgave(lagret: Lagret, oppgave: Oppgave): Lagret {
  return {
    ...lagret,
    fro: lagret.fro + 1,
    sisteMaler: [...lagret.sisteMaler, oppgave.mal].slice(-10),
    sisteNokkel: oppgave.nokkel || lagret.sisteNokkel,
  };
}

function stedPasser(sted: StedId, avtaleSted: string): boolean {
  if (avtaleSted === "hjemme" || avtaleSted === "") return sted === "hjemme";
  if (avtaleSted === "butikk") return sted === "butikk";
  if (avtaleSted === "torg") return sted === "torg";
  if (avtaleSted === "tannlege") return sted === "tannlege";
  if (avtaleSted === "svommehall") return sted === "svommehall";
  if (avtaleSted === "barnehage") return sted === "barnehage";
  return sted === "aktivitet";
}

/** Avtalen som pågår der barnet står. Middag møtes med Spis. */
export function aktuellAvtale(lagret: Lagret) {
  const avtale = avtaleHer(lagret);
  if (!avtale || avtale.slag === "middag") return null;
  return avtale;
}

function merkTid(lagret: Lagret, tid: number): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const besokt = [...dag.besokt];
  const forSent = [...dag.forSent];
  const sent = [...(dag.sent ?? [])];
  let melding: string | null = null;
  for (const avtale of dag.plan.avtaler) {
    if (avtale.varighet <= 0 || besokt.includes(avtale.id) || forSent.includes(avtale.id)) continue;
    const slutt = avtale.start + avtale.varighet;
    if (tid > slutt) {
      forSent.push(avtale.id);
      const indeks = sent.indexOf(avtale.id);
      if (indeks >= 0) sent.splice(indeks, 1);
      const tapt = visNavn(avtale.aktivitet ?? avtale.navn, lagret.innstillinger.spraak);
      melding =
        avtale.slag === "middag" && dag.sted === "hjemme"
          ? si(lagret, "Vi spiste klokka {a}, nå er den {b}.", "Vi åt klokka {a}, no er den {b}.", {
              a: tidTilOrd(avtale.start, lagret.innstillinger.spraak),
              b: tidTilOrd(tid, lagret.innstillinger.spraak),
            })
          : si(lagret, "Vi rakk ikke {navn} i dag.", "Vi rakk ikkje {navn} i dag.", { navn: tapt });
      continue;
    }
    const der =
      avtale.slag === "middag" ? dag.sted === "hjemme" : stedPasser(dag.sted, avtale.sted);
    if (tid > avtale.start && !der && !sent.includes(avtale.id)) sent.push(avtale.id);
    if (der) {
      const indeks = sent.indexOf(avtale.id);
      if (indeks >= 0) sent.splice(indeks, 1);
    }
  }
  return { ...lagret, aktivDag: { ...dag, tid, besokt, forSent, sent, melding } };
}

export function apningTekst(lagret: Lagret): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const butikk = dag.plan.butikk;
  if (butikk.stengtHele) return si(lagret, "Stengt i dag.", "Stengt i dag.");
  if (dag.tid < butikk.apner) return si(lagret, "Åpner kl. {tid}", "Opnar kl. {tid}", { tid: tidTilDigital24(butikk.apner) });
  if (butikk.stengtFra !== undefined && butikk.stengtTil !== undefined && dag.tid >= butikk.stengtFra && dag.tid < butikk.stengtTil) {
    return si(lagret, "Stengt nå. Åpner kl. {tid}", "Stengt no. Opnar kl. {tid}", { tid: tidTilDigital24(butikk.stengtTil) });
  }
  if (dag.tid >= butikk.stenger) {
    const apning = dag.plan.nesteApning !== undefined ? tidTilDigital24(dag.plan.nesteApning) : tidTilDigital24(14 * 60);
    if (dag.plan.ukedag === "lordag" || dag.plan.ukedag === "sondag") {
      return si(lagret, "Stengt nå. Åpner mandag kl. {tid}.", "Stengt no. Opnar måndag kl. {tid}.", { tid: apning });
    }
    return si(lagret, "Stengt nå. Åpner i morgen kl. {tid}.", "Stengt no. Opnar i morgon kl. {tid}.", { tid: apning });
  }
  return si(lagret, "Butikken er åpen.", "Butikken er open.");
}

function skiltFor(dag: AktivDag): SkiltTid {
  const butikk = dag.plan.butikk;
  return {
    naa: dag.tid,
    apner: butikk.apner,
    stenger: butikk.stenger,
    stengtFra: butikk.stengtFra,
    stengtTil: butikk.stengtTil,
    neste: nesteApning(dag.tid, butikk, dag.plan.nesteApning),
  };
}

function blandValg(lagret: Lagret, tid: number, valg: Valg[]): Valg[] {
  const bland = froTilfeldig((lagret.fro + 1) * 17 + tid);
  bland();
  return stokk(bland, valg);
}

function dorOppgave(lagret: Lagret): Oppgave {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("ingen dag");
  const apen = erApen(dag.tid, dag.plan.butikk);
  const skilt = skiltFor(dag);
  return {
    id: `dor-${dag.tid}`,
    type: "apningstider",
    mal: "apen-1",
    ferdighet: "hele-timer",
    prompt: si(lagret, "Er butikken åpen nå? Klokka er {naa}.", "Er butikken open no? Klokka er {naa}.", {
      naa: tidTilOrd(dag.tid, lagret.innstillinger.spraak),
    }),
    nokkel: `klokke:${dag.tid}`,
    valg: blandValg(lagret, dag.tid, [
      { id: "ja", ja: true, tekst: si(lagret, "Åpen", "Open") },
      { id: "nei", ja: false, tekst: si(lagret, "Stengt", "Stengt") },
    ]),
    fasit: apen ? "ja" : "nei",
    vare: "dor-rektangel",
    hvem: si(lagret, "skiltet", "skiltet"),
    overraskelse: false,
    maalKlokke: dag.tid,
    tall: skilt.neste,
    skilt,
  };
}

function apneOppgave(lagret: Lagret): Oppgave {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("ingen dag");
  const skilt = skiltFor(dag);
  const spraak = lagret.innstillinger.spraak;
  const riktig = skilt.neste;
  const kandidater = [riktig - 60, riktig + 60, riktig - 30, riktig + 30]
    .map((tid) => (tid + 24 * 60) % (24 * 60))
    .filter((tid, indeks, liste) => tid !== riktig && liste.indexOf(tid) === indeks)
    .slice(0, 2);
  const valg = blandValg(lagret, riktig, [
    { id: "rett", klokke: riktig, tekst: tidTilOrd(riktig, spraak) },
    ...kandidater.map((tid, indeks) => ({ id: `feil-${indeks}`, klokke: tid, tekst: tidTilOrd(tid, spraak) })),
  ]);
  return {
    id: `dor-apner-${dag.tid}`,
    type: "apningstider",
    mal: "apen-2",
    ferdighet: "hele-timer",
    prompt: si(lagret, "Når åpner butikken?", "Når opnar butikken?"),
    nokkel: `klokke:${riktig}`,
    valg,
    fasit: "rett",
    vare: "dor-rektangel",
    hvem: si(lagret, "skiltet", "skiltet"),
    overraskelse: false,
    maalKlokke: dag.tid,
    tall: riktig,
    skilt,
  };
}

export function hylleForNivaa(nivaa: Nivaa, indeks: number): Hylle {
  if (nivaa === "forste") return indeks % 4 === 2 ? "kloss" : "form";
  const hyller: Hylle[] = ["form", "kloss", "mal", "vekt"];
  return hyller[indeks % hyller.length] ?? "form";
}

const ROMFORMER = ["kule", "kube", "sylinder", "kjegle"];

function formForVare(vare: string): string | undefined {
  if (vare.startsWith("kloss-")) return vare.slice("kloss-".length);
  if (vare.startsWith("vindu-")) return vare.slice("vindu-".length);
  if (vare.startsWith("tak")) return "trekant";
  if (vare.startsWith("dor")) return "rektangel";
  if (vare === "planke") return "rektangel";
  return undefined;
}

function maalFormFor(lagret: Lagret, vare: string): string | undefined {
  const egen = formForVare(vare);
  if (!egen || !ROMFORMER.includes(egen)) return egen;
  if (!lagret.by.kjente3d.includes(egen)) return egen;
  return ROMFORMER.find((form) => !lagret.by.kjente3d.includes(form)) ?? egen;
}

function giVare(lagret: Lagret, vare: VareId, antall = 1): Lagret {
  const har = lagret.kurv[vare] ?? 0;
  return { ...lagret, kurv: { ...lagret.kurv, [vare]: har + antall }, mynter: lagret.mynter + 1 };
}

function taVare(lagret: Lagret, vare: VareId): Lagret | null {
  const har = lagret.kurv[vare] ?? 0;
  if (har <= 0) return null;
  return { ...lagret, kurv: { ...lagret.kurv, [vare]: har - 1 } };
}

function oppdaterMestring(lagret: Lagret, oppgave: Oppgave, riktig: boolean): Lagret {
  let mestring = registrerSvar(lagret.mestring, oppgave.ferdighet, riktig, lagret.innstillinger.nivaa);
  const by = { ...lagret.by };
  if (KLOKKE.includes(oppgave.ferdighet)) {
    by.klokkePaRad = riktig ? by.klokkePaRad + 1 : 0;
    by.besteKlokkePaRad = Math.max(by.besteKlokkePaRad, by.klokkePaRad);
  }
  if (riktig && oppgave.type === "monster") by.monsterFullfort += 1;
  if (riktig && oppgave.form3d && !by.kjente3d.includes(oppgave.form3d)) by.kjente3d = [...by.kjente3d, oppgave.form3d];
  return { ...lagret, mestring, by };
}

function noter(lagret: Lagret, oppgave: Oppgave): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const former = [...dag.formerIDag];
  if (oppgave.form && !/^\d+$/.test(oppgave.form) && !former.includes(oppgave.form)) former.push(oppgave.form);
  if (oppgave.form3d && !former.includes(oppgave.form3d)) former.push(oppgave.form3d);
  const klokker = [...dag.klokkerIDag];
  if (oppgave.maalKlokke !== undefined && !klokker.includes(oppgave.maalKlokke)) klokker.push(oppgave.maalKlokke);
  return { ...lagret, aktivDag: { ...dag, formerIDag: former, klokkerIDag: klokker } };
}

export function aktivOppgave(lagret: Lagret): Oppgave | null {
  const dag = lagret.aktivDag;
  if (!dag || dag.aktiv < 0 || dag.aktiv >= dag.ko.length) return null;
  return dag.ko[dag.aktiv] ?? null;
}

export function utfor(lagret: Lagret, handling: Handling): { lagret: Lagret; melding: string | null } {
  if (handling.slag === "start") return startDag(lagret);
  if (!lagret.aktivDag) return { lagret, melding: null };
  if (handling.slag === "ga") return gaa(lagret, handling.sted);
  if (handling.slag === "vent") return vent(lagret, handling.tid);
  if (handling.slag === "dor") return dor(lagret);
  if (handling.slag === "handle") return handle(lagret);
  if (handling.slag === "svar") return svar(lagret, handling.svar);
  if (handling.slag === "fortsett") return fortsett(lagret);
  if (handling.slag === "velg-bygg") return velgBygg(lagret, handling.bygg, handling.x, handling.y);
  if (handling.slag === "velg") {
    return { lagret: { ...lagret, aktivDag: { ...lagret.aktivDag, valgtInstans: handling.instans } }, melding: null };
  }
  if (handling.slag === "steg") return steg(lagret);
  if (handling.slag === "angre") return angre(lagret);
  if (handling.slag === "pynt") return pynt(lagret, handling.vare);
  if (handling.slag === "flytt") return flytt(lagret, handling.instans, handling.x, handling.y);
  if (handling.slag === "mot") return mot(lagret);
  if (handling.slag === "spis") return spis(lagret);
  if (handling.slag === "klokke") {
    return { lagret: { ...lagret, aktivDag: { ...lagret.aktivDag, klokkeLekt: true } }, melding: null };
  }
  return avslutt(lagret);
}

function startDag(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  if (lagret.aktivDag) return { lagret, melding: null };
  const inn = {
    fro: lagret.fro,
    dato: lagret.dato,
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  };
  const plan = lagDagsplan(inn);
  const iMorgen = lagDagsplan({ ...inn, fro: lagret.fro + 1, dato: nesteDato(lagret.dato) });
  plan.nesteApning = iMorgen.butikk.stengtHele
    ? lagDagsplan({ ...inn, fro: lagret.fro + 2, dato: nesteDato(nesteDato(lagret.dato)) }).butikk.apner
    : iMorgen.butikk.apner;
  const dag: AktivDag = {
    plan,
    tid: startTidFor(plan, lagret.innstillinger.nivaa),
    sted: "hjemme",
    fase: "ute",
    ko: [],
    aktiv: 0,
    forklaring: null,
    besokt: [],
    forSent: [],
    sent: [],
    handlet: false,
    dorLest: false,
    byggetIDag: [],
    formerIDag: [],
    klokkerIDag: [],
    valgtInstans: lagret.by.bygg.find((bygg) => !bygg.uthus && byggDef(bygg.bygg).hjem)?.instans ?? null,
    melding: null,
    visteForSent: [],
    feil: 0,
  };
  return {
    lagret: {
      ...lagret,
      fro: lagret.fro + 1,
      sistePlaner: [...lagret.sistePlaner, plan.nokkel].slice(-7),
      aktivDag: dag,
    },
    melding: null,
  };
}

function gaa(lagret: Lagret, sted: StedId): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  if (dag.sted === sted) return { lagret, melding: null };
  const tid = leggTil(dag.tid, gangMinutter(dag.sted, sted, lagret.innstillinger.nivaa));
  const fase = sted === "butikk" ? "handel" : "aktivitet";
  const fremme = Math.min(tid, dag.plan.leggetid);
  let neste = merkTid({ ...lagret, aktivDag: { ...dag, sted, fase, ko: [], aktiv: 0, forklaring: null, feil: 0 } }, fremme);
  const tekst = neste.aktivDag?.melding ?? null;
  if (tekst && neste.aktivDag) neste = { ...neste, aktivDag: { ...neste.aktivDag, melding: null } };
  return { lagret: neste, melding: tekst };
}

function vent(lagret: Lagret, tid?: number): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const fraSteg = nesteSteg(lagret);
  const maal = tid ?? (fraSteg.handling.slag === "vent" ? fraSteg.handling.tid : undefined);
  let nesteTid = maal !== undefined && maal > dag.tid ? maal : dag.tid;
  const butikk = dag.plan.butikk;
  if (dag.sted === "butikk" && !butikk.stengtHele && !erApen(dag.tid, butikk)) {
    const apner = dag.tid < butikk.apner ? butikk.apner : butikk.stengtTil !== undefined && dag.tid < butikk.stengtTil ? butikk.stengtTil : null;
    if (apner !== null && apner > dag.tid && (nesteTid === dag.tid || apner < nesteTid)) nesteTid = apner;
  }
  if (nesteTid > dag.plan.leggetid) nesteTid = dag.plan.leggetid;
  if (nesteTid === dag.tid) return { lagret, melding: null };
  const neste = merkTid(lagret, nesteTid);
  const tekst = neste.aktivDag?.melding ?? null;
  if (tekst && neste.aktivDag) return { lagret: { ...neste, aktivDag: { ...neste.aktivDag, melding: null } }, melding: tekst };
  return { lagret: neste, melding: null };
}

function dor(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || (dag.sted !== "butikk" && dag.sted !== "hjemme")) return { lagret, melding: si(lagret, "Gå til butikken først.", "Gå til butikken først.") };
  const oppgave = dorOppgave(lagret);
  return {
    lagret: huskOppgave(
      { ...lagret, aktivDag: { ...dag, fase: "dor", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } },
      oppgave,
    ),
    melding: null,
  };
}

function handle(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.sted !== "butikk") return { lagret, melding: null };
  if (!dag.dorLest) return dor(lagret);
  if (!erApen(dag.tid, dag.plan.butikk)) return { lagret, melding: apningTekst(lagret) };
  const vare = manglendeDeler(lagret)[0];
  if (!vare) {
    return { lagret, melding: si(lagret, "Handlelisten er tom.", "Handlelista er tom.") };
  }
  const kloss = vare.startsWith("kloss");
  const nivaaBygg = maalBygg(lagret);
  const kreverKlokke = nivaaBygg !== null && byggDef(nivaaBygg.id).nivaa >= 3;
  const klokkeTyper = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"] as const;
  const vilKlokke = kreverKlokke || lagret.fro % 5 < 2;
  const monster = !kreverKlokke && !kloss && lagret.by.monsterFullfort < 1 && lagret.fro % 2 === 0;
  const manglerRom = ROMFORMER.find((form) => !lagret.by.kjente3d.includes(form));
  const laerRom = !vilKlokke && Boolean(manglerRom) && !kloss && !monster && lagret.fro % 3 === 1;
  const hylle =
    monster || laerRom || vilKlokke || lagret.fro % 3 === 0 ? undefined : kloss ? "kloss" : hylleForNivaa(lagret.innstillinger.nivaa, lagret.fro);
  const trukket = trekkOppgave({
    ...kontekst(lagret),
    hylle,
    type: vilKlokke ? klokkeTyper[lagret.fro % klokkeTyper.length] : monster ? "monster" : laerRom ? "finn-formen" : undefined,
    maalForm: laerRom && manglerRom ? manglerRom : maalFormFor(lagret, vare),
    kjente3d: lagret.by.kjente3d,
  });
  const oppgave: Oppgave = { ...trukket, hvem: si(lagret, "ekspeditøren", "ekspeditøren"), vare };
  return {
    lagret: huskOppgave({ ...lagret, aktivDag: { ...dag, fase: "handel", ko: [oppgave], aktiv: 0, forklaring: null, melding: null, feil: 0 } }, oppgave),
    melding: null,
  };
}

function svar(lagret: Lagret, gitt: string): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  const riktig = sjekkSvar(oppgave, gitt);
  const erDor = oppgave.id.startsWith("dor-");
  let neste = erDor ? lagret : oppdaterMestring(lagret, oppgave, riktig);
  if (!riktig) {
    const feil = (dag.feil ?? 0) + 1;
    const tekst = forklaring(oppgave, gitt, lagret.innstillinger.spraak, feil);
    return {
      lagret: { ...neste, aktivDag: { ...dag, forklaring: tekst, fase: "forklaring", feil, melding: null } },
      melding: null,
    };
  }
  const erAktivitet = dag.fase === "aktivitet" || oppgave.nokkel.startsWith("avtale:");
  if (erDor) {
    const dagEtter = neste.aktivDag ?? dag;
    const butikk = dagEtter.plan.butikk;
    const apen = erApen(dagEtter.tid, butikk);
    const ferdig = oppgave.id.startsWith("dor-apner-") || apen;
    if (!ferdig) {
      const oppfolging = apneOppgave(neste);
      return {
        lagret: huskOppgave(
          { ...neste, aktivDag: { ...dagEtter, fase: "dor", ko: [oppfolging], aktiv: 0, forklaring: null, feil: 0 } },
          oppfolging,
        ),
        melding: null,
      };
    }
    const medDor = { ...neste, aktivDag: { ...dagEtter, dorLest: true, fase: "handel" as const, ko: [], forklaring: null, feil: 0 } };
    if (!apen && !butikk.stengtHele && dagEtter.tid < butikk.stenger) {
      const tid = tidTilDigital24(oppgave.skilt?.neste ?? nesteApning(dagEtter.tid, butikk, dagEtter.plan.nesteApning));
      return { lagret: medDor, melding: si(medDor, "Vent til {tid}. Butikken åpner.", "Vent til {tid}. Butikken opnar.", { tid }) };
    }
    return { lagret: medDor, melding: apningTekst(medDor) };
  }
  let gittVare = oppgave.vare;
  if (!erAktivitet) {
    gittVare = manglendeDeler(neste)[0] ?? oppgave.vare;
    neste = noter(giVare(neste, gittVare), oppgave);
    const maal = maalBygg(neste);
    if (maal && byggDef(maal.id).nivaa >= 3 && neste.aktivDag) {
      neste = { ...neste, aktivDag: { ...neste.aktivDag, kjopIDag: (neste.aktivDag.kjopIDag ?? 0) + 1 } };
    }
  } else {
    neste = noter(neste, oppgave);
  }
  const dagEtter = neste.aktivDag ?? dag;
  const aktiv = dag.aktiv + 1;
  if (aktiv >= dag.ko.length) {
    const avtaleId = oppgave.nokkel.startsWith("avtale:") ? oppgave.nokkel.slice("avtale:".length) : "";
    const aktuell = dag.plan.avtaler.find((rad) => rad.id === avtaleId);
    const sluttAvtale = erAktivitet && aktuell ? aktuell.start + aktuell.varighet : dag.tid;
    const tid = Math.min(sluttAvtale, dag.plan.leggetid);
    const faseEtter = erAktivitet ? "aktivitet" : "handel";
    let etter = merkTid(
      {
        ...neste,
        aktivDag: { ...dagEtter, tid: dag.tid, fase: faseEtter, ko: [], handlet: dag.handlet, forklaring: null, feil: 0 },
      },
      tid,
    );
    if (erAktivitet && aktuell && etter.aktivDag) {
      const rakk = dag.tid < aktuell.start + aktuell.varighet;
      const sent = (etter.aktivDag.sent ?? []).filter((rad) => rad !== aktuell.id);
      etter = {
        ...etter,
        aktivDag: {
          ...etter.aktivDag,
          besokt: rakk ? [...etter.aktivDag.besokt, aktuell.id] : etter.aktivDag.besokt,
          forSent: rakk ? etter.aktivDag.forSent.filter((rad) => rad !== aktuell.id) : etter.aktivDag.forSent,
          sent,
          sted: aktuell.aktivitet === "lillesoster" ? "hjemme" : etter.aktivDag.sted,
          melding: null,
        },
      };
    }
    if (erAktivitet && aktuell) {
      return { lagret: etter, melding: si(etter, "Riktig!", "Riktig!") };
    }
    const vareNavn = navnVare(gittVare, etter.innstillinger.spraak);
    return { lagret: etter, melding: si(etter, "Riktig! Du får {vare}.", "Riktig! Du får {vare}.", { vare: vareNavn }) };
  }
  return {
    lagret: { ...neste, aktivDag: { ...dagEtter, aktiv, forklaring: null, feil: 0, fase: dag.fase === "forklaring" ? "handel" : dag.fase } },
    melding: null,
  };
}

function hoppOver(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  if (oppgave.id.startsWith("dor-")) {
    const medDor = { ...lagret, aktivDag: { ...dag, dorLest: true, fase: "ute" as const, ko: [], forklaring: null, feil: 0 } };
    return { lagret: medDor, melding: apningTekst(medDor) };
  }
  const aktiv = dag.aktiv + 1;
  if (aktiv >= dag.ko.length) {
    const erAvtale = oppgave.nokkel.startsWith("avtale:");
    const tid = dag.tid;
    const neste = merkTid({ ...lagret, aktivDag: { ...dag, fase: erAvtale ? "aktivitet" : "handel", ko: [], forklaring: null, feil: 0 } }, tid);
    return { lagret: neste, melding: si(lagret, "Vi øver mer på den senere.", "Vi øver meir på den seinare.") };
  }
  return {
    lagret: { ...lagret, aktivDag: { ...dag, aktiv, forklaring: null, feil: 0, fase: dag.fase === "forklaring" ? "handel" : dag.fase } },
    melding: si(lagret, "Vi øver mer på den senere.", "Vi øver meir på den seinare."),
  };
}

function fortsett(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  if ((dag.feil ?? 0) >= 2) return hoppOver(lagret);
  const bland = froTilfeldig(lagret.fro + (dag.feil ?? 1) * 17 + dag.tid);
  const omstokket: Oppgave = {
    ...oppgave,
    valg: stokk(bland, oppgave.valg),
    varer: oppgave.varer ? stokk(bland, oppgave.varer) : oppgave.varer,
  };
  const fase = dag.fase === "forklaring" ? (oppgave.id.startsWith("dor-") ? "dor" : oppgave.nokkel.startsWith("avtale:") ? "aktivitet" : "handel") : dag.fase;
  const ko = dag.ko.map((rad, indeks) => (indeks === dag.aktiv ? omstokket : rad));
  return { lagret: { ...lagret, aktivDag: { ...dag, ko, forklaring: null, fase } }, melding: null };
}

function velgBygg(lagret: Lagret, bygg: ByggId, x: number, y: number): { lagret: Lagret; melding: string | null } {
  if (!kanPlassere(lagret.by, bygg, x, y)) return { lagret, melding: si(lagret, "Den tomta passer ikke.", "Den tomta passar ikkje.") };
  const instans = `${bygg}-${lagret.by.bygg.length + 1}`;
  return {
    lagret: {
      ...lagret,
      by: {
        ...lagret.by,
        bygg: [...lagret.by.bygg, { instans, bygg, x, y, steg: 0, ferdig: false, uthus: false, frie: [], pynt: [] }],
      },
      aktivDag: lagret.aktivDag ? { ...lagret.aktivDag, valgtInstans: instans, sted: "byggeplass" } : null,
    },
    melding: null,
  };
}

function steg(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const instans = dag?.valgtInstans;
  const plassert = lagret.by.bygg.find((bygg) => bygg.instans === instans);
  if (!dag || !plassert) return { lagret, melding: null };
  const def = byggDef(plassert.bygg);
  const trinn = def.oppskrift[plassert.steg];
  if (!trinn) return { lagret, melding: si(lagret, "Bygget er ferdig.", "Bygget er ferdig.") };
  const uten = taVare(lagret, trinn.vare);
  if (!uten) return { lagret, melding: si(lagret, "Du trenger delen. Gå til butikken.", "Du treng delen. Gå til butikken.") };
  const ferdig = plassert.steg + 1 >= def.oppskrift.length;
  let bygg = lagret.by.bygg.map((rad) => (rad.instans === plassert.instans ? { ...rad, steg: rad.steg + 1, ferdig } : rad));
  let by = { ...uten.by, bygg };
  let ukerytme = lagret.ukerytme;
  let album = lagret.album;
  if (ferdig && def.hjem && def.nivaa === (nesteHjem(lagret.by) ? byggDef(nesteHjem(lagret.by) as ByggId).nivaa : -1)) {
    bygg = bygg.map((rad) => (byggDef(rad.bygg).hjem && rad.instans !== plassert.instans ? { ...rad, uthus: true } : rad));
    const nivaa = def.nivaa;
    by = { ...by, bygg, nivaa, omrader: omraderForNivaa(nivaa) };
    ukerytme = utvidRytme(ukerytme, ferdigeBygg(by), lagret.fro);
    album = [...album, { nivaa, svg: tegnKart(by, dag.tid, dag.plan.leggetid) }];
  }
  const tid = Math.min(dag.tid, dag.plan.leggetid);
  const byggetIDag = ferdig ? [...dag.byggetIDag, plassert.bygg] : dag.byggetIDag;
  let neste = merkTid({ ...uten, by, ukerytme, album, aktivDag: { ...dag, byggetIDag, sted: "byggeplass" } }, tid);
  return { lagret: neste, melding: ferdig ? si(neste, "Bygget er ferdig!", "Bygget er ferdig!") : null };
}

function angre(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const instans = lagret.aktivDag?.valgtInstans;
  const plassert = lagret.by.bygg.find((bygg) => bygg.instans === instans);
  if (!plassert || plassert.steg <= 0) return { lagret, melding: null };
  const vare = byggDef(plassert.bygg).oppskrift[plassert.steg - 1]?.vare;
  if (!vare) return { lagret, melding: null };
  return {
    lagret: {
      ...lagret,
      kurv: { ...lagret.kurv, [vare]: (lagret.kurv[vare] ?? 0) + 1 },
      by: {
        ...lagret.by,
        bygg: lagret.by.bygg.map((rad) => (rad.instans === plassert.instans ? { ...rad, steg: rad.steg - 1, ferdig: false } : rad)),
      },
    },
    melding: si(lagret, "Delen er tilbake i kurven.", "Delen er tilbake i korga."),
  };
}

function pynt(lagret: Lagret, vare: VareId): { lagret: Lagret; melding: string | null } {
  if (!PYNT.includes(vare) || lagret.mynter < 2) return { lagret, melding: si(lagret, "Du trenger to mynter.", "Du treng to myntar.") };
  const instans = lagret.aktivDag?.valgtInstans;
  if (!instans) return { lagret, melding: null };
  return {
    lagret: {
      ...lagret,
      mynter: lagret.mynter - 2,
      by: {
        ...lagret.by,
        bygg: lagret.by.bygg.map((rad) => (rad.instans === instans ? { ...rad, pynt: [...rad.pynt, vare] } : rad)),
      },
    },
    melding: null,
  };
}

function flytt(lagret: Lagret, instans: string, x: number, y: number): { lagret: Lagret; melding: string | null } {
  const plassert = lagret.by.bygg.find((bygg) => bygg.instans === instans);
  if (!plassert || !kanPlassere(lagret.by, plassert.bygg, x, y, instans)) {
    return { lagret, melding: si(lagret, "Der er det ikke plass.", "Der er det ikkje plass.") };
  }
  return {
    lagret: {
      ...lagret,
      by: { ...lagret.by, bygg: lagret.by.bygg.map((rad) => (rad.instans === instans ? { ...rad, x, y } : rad)) },
    },
    melding: null,
  };
}

function spis(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const middag = dag.plan.avtaler.find((avtale) => avtale.slag === "middag" && !dag.besokt.includes(avtale.id));
  if (!middag || dag.sted !== "hjemme") return { lagret, melding: si(lagret, "Gå hjem.", "Gå heim.") };
  if (dag.tid < middag.start - 15 || dag.tid > middag.start + middag.varighet) {
    return { lagret, melding: si(lagret, "Middagen er over.", "Middagen er over.") };
  }
  const tid = Math.min(middag.start + middag.varighet, dag.plan.leggetid);
  const med = { ...lagret, aktivDag: { ...dag, besokt: [...dag.besokt, middag.id] } };
  const neste = merkTid(med, tid);
  return { lagret: neste, melding: si(lagret, "Vi spiser.", "Vi et.") };
}

function mot(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const avtale = avtaleHer(lagret);
  if (!avtale || avtale.slag === "middag") return { lagret, melding: si(lagret, "Det er ingen avtale nå.", "Det er inga avtale no.") };
  const ferdig = avtale.start + avtale.varighet;
  const spraak = lagret.innstillinger.spraak;
  const valg = stokk(froTilfeldig(lagret.fro * 17 + dag.tid), [
    { id: "rett", klokke: ferdig, tekst: tidTilOrd(ferdig, spraak) },
    { id: "tidlig", klokke: avtale.start, tekst: tidTilOrd(avtale.start, spraak) },
    { id: "sent", klokke: leggTil(ferdig, 60), tekst: tidTilOrd(leggTil(ferdig, 60), spraak) },
  ]);
  const oppgave: Oppgave = {
    id: `avtale-${avtale.id}`,
    type: "hvor-lenge",
    mal: "lenge-1",
    ferdighet: "tidsrom",
    prompt: aktivitetSporsmal(avtale.aktivitet ?? avtale.navn, spraak, String(avtale.varighet)),
    nokkel: `avtale:${avtale.id}`,
    valg,
    fasit: "rett",
    vare: manglendeDeler(lagret)[0] ?? "planke",
    hvem: visNavn(avtale.aktivitet ?? avtale.navn, spraak),
    overraskelse: false,
    maalKlokke: avtale.start,
  };
  return {
    lagret: huskOppgave({ ...lagret, aktivDag: { ...dag, fase: "aktivitet", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } }, oppgave),
    melding: null,
  };
}

function avslutt(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const skal = dag.plan.avtaler.filter((avtale) => avtale.varighet > 0);
  const stjerne = skal.every((avtale) => dag.besokt.includes(avtale.id)) && dag.forSent.length === 0;
  return {
    lagret: {
      ...lagret,
      by: { ...lagret.by, dagerAlleAvtaler: lagret.by.dagerAlleAvtaler + (stjerne ? 1 : 0) },
      dato: nesteDato(lagret.dato),
      aktivDag: null,
      dagbok: [
        ...lagret.dagbok,
        {
          dato: lagret.dato,
          stjerne,
          bygget: dag.byggetIDag,
          former: dag.formerIDag,
          klokker: dag.klokkerIDag,
          avtaler: dag.plan.avtaler
            .filter((avtale) => avtale.varighet > 0)
            .map((avtale) => ({
              aktivitet: avtale.aktivitet ?? avtale.navn,
              start: avtale.start,
              gjort: dag.besokt.includes(avtale.id),
              ikke: !dag.besokt.includes(avtale.id) && dag.tid < avtale.start,
            })),
        },
      ],
    },
    melding: stjerne
      ? si(lagret, "Du rakk alt. En stjerne i dagboka!", "Du rakk alt. Ei stjerne i dagboka!")
      : si(lagret, "Dagen er slutt. Byen står der i morgen.", "Dagen er slutt. Byen står der i morgon."),
  };
}
