import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { ferdigeBygg, kanPlassere, nesteByggId, nesteHjem, omraderForNivaa } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { lagDagsplan, morgendagensApning, morgendagensButikk, nesteDato, utvidRytme, type PlanInn } from "../dag/plan";
import { froTilfeldig, stokk } from "../felles/tilfeldig";
import { forklaring } from "../oppgaver/forklaring";
import { trekkOppgave, type OppgaveKontekst } from "../oppgaver/lag";
import { sjekkSvar } from "../oppgaver/sjekk";
import { registrerSvar } from "../tilpasning/mestring";
import { erApen, leggTil, nesteApning, tidTilDigital24, tidTilOrd } from "../tid/tid";
import { aktivitetSporsmal, visNavn } from "../dag/aktiviteter";
import { tegnKart } from "../grafikk/bygg-svg";
import { formNavn, mal, navnVare } from "../tekst/ordbok";
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
  | { slag: "pynt"; vare: VareId; instans?: string; x?: number; y?: number }
  | { slag: "ekstra"; ja: boolean }
  | { slag: "flytt"; instans: string; x: number; y: number }
  | { slag: "mot" }
  | { slag: "spis" }
  | { slag: "klokke" }
  | { slag: "oppdrag" }
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
    const apning = tidTilDigital24(morgendagensApning(planInn(lagret)));
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
  const time = Math.floor(riktig / 60);
  const min = riktig % 60;
  const kvart = (d: number) => (time * 60 + min + d + 24 * 60) % (24 * 60);
  const halvFeil = min >= 30 ? ((time + 1) % 24) * 60 + (min - 30) : ((time + 23) % 24) * 60 + (min + 30);
  const kandidater = stokk(froTilfeldig(lagret.fro * 17 + riktig), [
    ((time + 1) % 24) * 60 + min,
    ((time + 23) % 24) * 60 + min,
    kvart(15),
    kvart(-15),
    halvFeil,
  ])
    .filter((tid, indeks, liste) => tid !== riktig && liste.indexOf(tid) === indeks)
    .slice(0, 2);
  const valg = blandValg(lagret, riktig, [
    { id: "rett", klokke: riktig, tekst: tidTilOrd(riktig, spraak) },
    ...kandidater.map((tid, indeks) => ({ id: `feil-${indeks}`, klokke: tid, tekst: tidTilOrd(tid, spraak) })),
  ]);
  const iMorgen = dag.plan.butikk.stengtHele || dag.tid >= dag.plan.butikk.stenger;
  const skiltVis = iMorgen
    ? {
        ...skilt,
        apner: dag.plan.nesteApning ?? skilt.neste,
        stenger: dag.plan.nesteStenger ?? (dag.plan.nesteApning ?? skilt.neste) + 3 * 60,
        stengtFra: undefined,
        stengtTil: undefined,
      }
    : skilt;
  return {
    id: `dor-apner-${dag.tid}`,
    type: "apningstider",
    mal: "apen-2",
    ferdighet: "hele-timer",
    prompt: iMorgen
      ? si(lagret, "Når åpner butikken i morgen?", "Når opnar butikken i morgon?")
      : si(lagret, "Når åpner butikken?", "Når opnar butikken?"),
    nokkel: `klokke:${riktig}`,
    valg,
    fasit: "rett",
    vare: "dor-rektangel",
    hvem: si(lagret, "skiltet", "skiltet"),
    overraskelse: false,
    maalKlokke: dag.tid,
    tall: riktig,
    skilt: skiltVis,
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

function maalFormFor(_lagret: Lagret, vare: string): string | undefined {
  return formForVare(vare);
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
  if (handling.slag === "pynt") return pynt(lagret, handling.vare, handling.instans, handling.x, handling.y);
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
  if (handling.slag === "flytt") return flytt(lagret, handling.instans, handling.x, handling.y);
  if (handling.slag === "ekstra") return ekstraBygg(lagret, handling.ja);
  if (handling.slag === "mot") return mot(lagret);
  if (handling.slag === "spis") return spis(lagret);
  if (handling.slag === "klokke") {
    return { lagret: { ...lagret, aktivDag: { ...lagret.aktivDag, klokkeLekt: true } }, melding: null };
  }
  if (handling.slag === "oppdrag") return startOppdrag(lagret);
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
  const gjenbruk = lagret.nestePlan && likDato(lagret.nestePlan.dato, lagret.dato) ? { ...lagret.nestePlan } : null;
  const plan = gjenbruk ?? lagDagsplan(inn);
  const iMorgen = morgendagensButikk(inn);
  plan.nesteApning = iMorgen.apner;
  plan.nesteStenger = iMorgen.stenger;
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
    dagensBygg: nesteByggId(lagret.by) ?? undefined,
  };
  return {
    lagret: {
      ...lagret,
      nestePlan: null,
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
  const klokkeTyper = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"] as const;
  const formTyper = ["finn-formen", "hvem-passer-ikke", "sorter", "tell", "tegn", "monster"] as const;
  const form = formForVare(vare);
  const vilKlokke = (lagret.fro * 17) % 2 === 1 || !form;
  const formType = velgType(lagret, formTyper[lagret.fro % formTyper.length] ?? "finn-formen", formTyper, []);
  const manglerRom = ROMFORMER.find((rom) => !lagret.by.kjente3d.includes(rom));
  const monster = !vilKlokke && lagret.by.monsterFullfort < 1 && lagret.fro % 4 === 0;
  const laerRom = !vilKlokke && !monster && Boolean(manglerRom);
  const brukGavl = !vilKlokke && !monster && !laerRom && Boolean(form) && lagret.fro % 4 === 1;
  const hylle = vilKlokke || laerRom ? undefined : kloss ? "kloss" : "form";
  const trukket = brukGavl
    ? gavlOppgave(lagret, vare)
    : trekkOppgave({
        ...kontekst(lagret),
        hylle,
        type: vilKlokke
          ? velgType(lagret, klokkeTyper[lagret.fro % klokkeTyper.length] ?? "les-klokka", klokkeTyper, [])
          : monster
            ? "monster"
            : laerRom
              ? "finn-formen"
              : formType,
        maalForm: laerRom && manglerRom ? manglerRom : maalFormFor(lagret, vare),
        kjente3d: lagret.by.kjente3d,
      });
  const delNavn = navnVare(vare, lagret.innstillinger.spraak);
  const ledd = vare.startsWith("tak") || vare.startsWith("vindu") || vare === "jord" ? "et" : "en";
  const prompt = vilKlokke || brukGavl ? trukket.prompt : `${si(lagret, "Vi trenger {del}.", "Vi treng {del}.", { del: `${ledd} ${delNavn}` })} ${trukket.prompt}`;
  const oppgave: Oppgave = { ...trukket, prompt, hvem: brukGavl ? trukket.hvem : si(lagret, "ekspeditøren", "ekspeditøren"), vare };
  const lengde = lagret.innstillinger.nivaa === "forste" ? 3 : lagret.innstillinger.nivaa === "utfordrende" ? 5 : 4;
  const bonus = bonusOppgaver(lagret, oppgave, lengde - 1);
  const ko = [oppgave, ...bonus];
  return {
    lagret: medTakt(huskOppgave({ ...lagret, aktivDag: { ...dag, fase: "handel", ko, aktiv: 0, forklaring: null, melding: null, feil: 0 } }, oppgave), ko),
    melding: null,
  };
}

function velgType(lagret: Lagret, onsket: Oppgave["type"], familie: readonly Oppgave["type"][], brukt: Oppgave[]): Oppgave["type"] {
  const kandidater = [onsket, ...familie.filter((type) => type !== onsket)];
  for (const type of kandidater) {
    const tidligere = lagret.aktivDag?.typeTakt?.[type] ?? 0;
    const naa = brukt.filter((oppgave) => oppgave.type === type).length;
    if (tidligere + naa < 2) return type;
  }
  return onsket;
}

function medTakt(lagret: Lagret, oppgaver: Oppgave[]): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const takt = { ...(dag.typeTakt ?? {}) };
  for (const oppgave of oppgaver) takt[oppgave.type] = (takt[oppgave.type] ?? 0) + 1;
  return { ...lagret, aktivDag: { ...dag, typeTakt: takt } };
}

function gavlOppgave(lagret: Lagret, vare: VareId): Oppgave {
  const form = formForVare(vare) ?? "trekant";
  const n = lagret.innstillinger.nivaa === "forste" ? 2 : lagret.innstillinger.nivaa === "andre" ? 3 : 4;
  const biter = Array.from({ length: n }, (_, i) => ({ id: `bit-${i}`, form }));
  return {
    id: `gavl-${lagret.fro}`,
    type: "sorter",
    mal: "gavl-1",
    ferdighet: "sortere",
    prompt: si(lagret, "Hjelp meg å tette gavlen.", "Hjelp meg å tette gavlen."),
    nokkel: `form:${form}`,
    valg: [],
    fasit: biter.map((bit) => `${bit.id}:gavl`).join(","),
    vare,
    hvem: si(lagret, "snekkeren", "snikkaren"),
    overraskelse: false,
    kasser: [{ id: "gavl", tekst: si(lagret, "Gavl", "Gavl"), symbol: form }],
    varer: biter,
    form,
  };
}

function bakerOppgave(lagret: Lagret): Oppgave {
  const steg = lagret.innstillinger.nivaa === "forste" ? 30 : lagret.innstillinger.nivaa === "andre" ? 15 : 5;
  const fra = lagret.aktivDag?.tid ?? 14 * 60;
  const til = (fra + steg) % (24 * 60);
  const feilA = (til + steg) % (24 * 60);
  const feilB = (til - steg + 24 * 60) % (24 * 60);
  const spraak = lagret.innstillinger.spraak;
  const valg = [til, feilA, feilB]
    .filter((tid, indeks, liste) => liste.indexOf(tid) === indeks)
    .map((tid) => ({ id: String(tid), klokke: tid, tekst: tidTilOrd(tid, spraak) }));
  return {
    id: `kake-${lagret.fro}`,
    type: "hvor-lenge",
    mal: "kake-1",
    ferdighet: "tidsrom",
    prompt: si(lagret, "Kaken står i ovnen. Når tar vi den ut?", "Kaka står i omnen. Når tek vi ho ut?"),
    nokkel: `klokke:${til}`,
    valg,
    fasit: String(til),
    vare: "planke",
    hvem: si(lagret, "bakeren", "bakaren"),
    overraskelse: false,
    ovelse: true,
    maalKlokke: fra,
    tall: til,
  };
}

function kasseOppgave(lagret: Lagret): Oppgave {
  const former = ["kule", "kube", "sylinder"] as const;
  const hint = [
    si(lagret, "Den har ingen hjørner.", "Han har ingen hjørne."),
    si(lagret, "Den kan trille.", "Han kan trille."),
    si(lagret, "Den kan ikke stå.", "Han kan ikkje stå."),
  ];
  return {
    id: `kasse-${lagret.fro}`,
    type: "stempel",
    mal: "kasse-1",
    ferdighet: "former-3d",
    prompt: hint[0] ?? "",
    nokkel: "form:kule",
    valg: former.map((form) => ({ id: form, form, tekst: formNavn(form, lagret.innstillinger.spraak) })),
    fasit: "kule",
    vare: "planke",
    hvem: si(lagret, "ekspeditøren", "ekspeditøren"),
    overraskelse: false,
    ovelse: true,
    hint,
    hintVist: 1,
  };
}

function startOppdrag(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.ko.length > 0 || dag.oppdragFerdig) return { lagret, melding: null };
  let trukket: Oppgave;
  try {
    trukket = trekkOppgave({
      ...kontekst(lagret),
      tilfeldig: froTilfeldig(lagret.fro + 91),
      type: lagret.fro % 2 === 0 ? "finn-formen" : "les-klokka",
      hylle: lagret.fro % 2 === 0 ? "form" : undefined,
    });
  } catch {
    return { lagret, melding: null };
  }
  const oppgave: Oppgave = {
    ...trukket,
    ovelse: true,
    oppdrag: true,
    hvem: si(lagret, "naboen", "naboen"),
    prompt: `${si(lagret, "Naboen spør.", "Naboen spør.")} ${trukket.prompt}`,
  };
  return {
    lagret: huskOppgave(
      { ...lagret, aktivDag: { ...dag, fase: "ute", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } },
      oppgave,
    ),
    melding: null,
  };
}

function bonusOppgaver(lagret: Lagret, forste: Oppgave, antall: number): Oppgave[] {
  const klokkeTyper = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"] as const;
  const formTyper = ["finn-formen", "hvem-passer-ikke", "sorter", "tell", "tegn", "monster"] as const;
  const forsteErKlokke = klokkeTyper.includes(forste.type as (typeof klokkeTyper)[number]);
  const ut: Oppgave[] = [];
  let klokke = !forsteErKlokke;
  for (let i = 0; i < antall; i++) {
    const familie = klokke ? klokkeTyper : formTyper;
    const onsket = familie[(lagret.fro + i) % familie.length] ?? (klokke ? "les-klokka" : "finn-formen");
    const type = velgType(lagret, onsket, familie, ut);
    const erDel = i === 1 && lagret.innstillinger.nivaa === "andre";
    try {
      const kake = klokke && !erDel && (lagret.fro + i) % 5 === 0;
      const trukket = kake
        ? bakerOppgave(lagret)
        : trekkOppgave({
            ...kontekst(lagret),
            tilfeldig: froTilfeldig(lagret.fro + 17 * (i + 1)),
            hylle: klokke ? undefined : "form",
            type,
            unngaMal: [forste.mal, ...ut.map((rad) => rad.mal)],
          });
      const bybilde: Record<string, [string, string]> = {
        sirkel: ["Kumlokket i gata er rundt. Finn alle sirklene.", "Kumlokket i gata er rundt. Finn alle sirklane."],
        trekant: ["Skiltet er en trekant. Finn alle trekantene.", "Skiltet er ein trekant. Finn alle trekantane."],
        kvadrat: ["Pizzaboksen er et kvadrat. Finn alle kvadratene.", "Pizzaboksen er eit kvadrat. Finn alle kvadrata."],
        rektangel: ["Døra er et rektangel. Finn alle rektanglene.", "Døra er eit rektangel. Finn alle rektangla."],
      };
      const bilde = trukket.type === "finn-formen" && trukket.form ? bybilde[trukket.form] : undefined;
      const detektiv = bilde ? { ...trukket, prompt: si(lagret, bilde[0], bilde[1]) } : trukket;
      const ovelse = !erDel;
      ut.push(i === 0 && lagret.innstillinger.nivaa !== "forste" ? kasseOppgave(lagret) : { ...detektiv, ovelse });
      klokke = !klokke;
    } catch {
      break;
    }
  }
  return ut;
}

function svar(lagret: Lagret, gitt: string): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  const riktig = sjekkSvar(oppgave, gitt);
  const erDor = oppgave.id.startsWith("dor-");
  const tell =
    (dag.feil ?? 0) === 0
      ? { svarTotalt: (dag.svarTotalt ?? 0) + 1, forsteRett: (dag.forsteRett ?? 0) + (riktig ? 1 : 0) }
      : { svarTotalt: dag.svarTotalt, forsteRett: dag.forsteRett };
  let neste = erDor ? lagret : oppdaterMestring(lagret, oppgave, riktig);
  if (neste.aktivDag) neste = { ...neste, aktivDag: { ...neste.aktivDag, ...tell } };
  if (!riktig) {
    const feil = (dag.feil ?? 0) + 1;
    const tekst = forklaring(oppgave, gitt, lagret.innstillinger.spraak, feil);
    return {
      lagret: { ...neste, aktivDag: { ...dag, ...tell, forklaring: tekst, fase: "forklaring", feil, melding: null } },
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
  if (oppgave.oppdrag) {
    const forste = (dag.feil ?? 0) === 0;
    const mynt = forste ? 2 : 1;
    const dagEtter = neste.aktivDag ?? dag;
    return {
      lagret: {
        ...neste,
        mynter: neste.mynter + mynt,
        aktivDag: {
          ...dagEtter,
          ko: [],
          fase: "ute",
          forklaring: null,
          feil: 0,
          oppdragFerdig: true,
          oppdragForste: forste || dag.oppdragForste === true,
          melding: null,
        },
      },
      melding: si(neste, "Riktig! Naboen er glad.", "Riktig! Naboen er glad."),
    };
  }
  let gittVare = oppgave.vare;
  if (!erAktivitet && !oppgave.ovelse) {
    gittVare = manglendeDeler(neste)[0] ?? oppgave.vare;
    neste = noter(giVare(neste, gittVare), oppgave);
    const maal = maalBygg(neste);
    if (maal && byggDef(maal.id).nivaa >= 3 && neste.aktivDag) {
      neste = { ...neste, aktivDag: { ...neste.aktivDag, kjopIDag: (neste.aktivDag.kjopIDag ?? 0) + 1 } };
    }
  } else {
    if (!erAktivitet && oppgave.ovelse && (dag.feil ?? 0) === 0) {
      const faa = oppgave.hint && (oppgave.hintVist ?? 1) <= 1 ? 2 : 1;
      neste = { ...neste, mynter: neste.mynter + faa };
    }
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
    if (oppgave.ovelse) return { lagret: etter, melding: si(etter, "Riktig!", "Riktig!") };
    const vareNavn = navnVare(gittVare, etter.innstillinger.spraak);
    return { lagret: etter, melding: si(etter, "Riktig! Du får {vare}.", "Riktig! Du får {vare}.", { vare: vareNavn }) };
  }
  const videre = {
    ...neste,
    aktivDag: { ...dagEtter, aktiv, forklaring: null, feil: 0, fase: dag.fase === "forklaring" ? "handel" : dag.fase },
  };
  if (!erAktivitet && !oppgave.ovelse) {
    const vareNavn = navnVare(gittVare, neste.innstillinger.spraak);
    return { lagret: videre, melding: si(neste, "Riktig! Du får {vare}.", "Riktig! Du får {vare}.", { vare: vareNavn }) };
  }
  return { lagret: videre, melding: si(neste, "Riktig!", "Riktig!") };
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
  if ((dag.feil ?? 0) >= 2) {
    const kort = dag.ko.length > dag.aktiv + 1 ? { ...lagret, aktivDag: { ...dag, ko: dag.ko.slice(0, dag.aktiv + 1) } } : lagret;
    return hoppOver(kort);
  }
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
  return { lagret: neste, melding: ferdig ? si(neste, "Bygget er ferdig! En nabo flytter inn.", "Bygget er ferdig! Ein nabo flyttar inn.") : null };
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

function pynt(lagret: Lagret, vare: VareId, valgt?: string, x?: number, y?: number): { lagret: Lagret; melding: string | null } {
  if (!PYNT.includes(vare) || lagret.mynter < 2) return { lagret, melding: si(lagret, "Du trenger to mynter.", "Du treng to myntar.") };
  const id = `pynt-${lagret.mynter}-${x ?? 0}-${y ?? 0}`;
  const plassert = x !== undefined && y !== undefined ? { id, vare, x, y } : null;
  const instans = valgt ?? lagret.aktivDag?.valgtInstans ?? lagret.by.bygg.find((bygg) => bygg.ferdig)?.instans;
  return {
    lagret: {
      ...lagret,
      mynter: lagret.mynter - 2,
      by: {
        ...lagret.by,
        pynt: plassert ? [...(lagret.by.pynt ?? []), plassert] : lagret.by.pynt,
        bygg: instans
          ? lagret.by.bygg.map((rad) => (rad.instans === instans ? { ...rad, pynt: [...rad.pynt, vare] } : rad))
          : lagret.by.bygg,
      },
    },
    melding: si(lagret, "Pynten er på plass.", "Pynten er på plass."),
  };
}

function ekstraBygg(lagret: Lagret, ja: boolean): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  if (!ja) return { lagret: { ...lagret, aktivDag: { ...dag, ekstraNei: true } }, melding: null };
  const neste = nesteByggId(lagret.by);
  if (!neste) return { lagret: { ...lagret, aktivDag: { ...dag, ekstraNei: true } }, melding: null };
  return { lagret: { ...lagret, aktivDag: { ...dag, dagensBygg: neste, ekstraNei: false } }, melding: null };
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
  const riktig = { id: "rett", klokke: ferdig, tekst: tidTilOrd(ferdig, spraak) };
  const andre = [
    { id: "tidlig", klokke: avtale.start, tekst: tidTilOrd(avtale.start, spraak) },
    { id: "sent", klokke: leggTil(ferdig, 60), tekst: tidTilOrd(leggTil(ferdig, 60), spraak) },
  ];
  const plass = (lagret.fro + dag.tid) % 3;
  const valg = [...andre];
  valg.splice(plass, 0, riktig);
  const oppgave: Oppgave = {
    id: `avtale-${avtale.id}`,
    type: "hvor-lenge",
    mal: "lenge-1",
    ferdighet: "tidsrom",
    prompt: aktivitetSporsmal(avtale.aktivitet ?? avtale.navn, spraak, String(avtale.varighet), lagret.innstillinger.nivaa),
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
  const avtalerOk = skal.every((avtale) => dag.besokt.includes(avtale.id)) && dag.forSent.length === 0;
  const totalt = dag.svarTotalt ?? 0;
  const forsteOk = totalt === 0 || (dag.forsteRett ?? 0) / totalt >= 0.8;
  const stjerner = (avtalerOk ? 1 : 0) + (forsteOk ? 1 : 0) + (dag.oppdragForste ? 1 : 0);
  const stjerne = avtalerOk && forsteOk;
  const stjerneLinjer = [
    avtalerOk ? "★ Du rakk alt" : "☆ Du rakk ikke alt",
    `${forsteOk ? "★" : "☆"} ${dag.forsteRett ?? 0} av ${totalt} riktige på første forsøk`,
    dag.oppdragForste ? "★ Oppdraget var riktig på første forsøk" : "☆ Oppdraget ble ikke gjort",
  ].join("\n");
  const nestePlan = lagDagsplan(planInn(lagret, nesteDato(lagret.dato)));
  return {
    lagret: {
      ...lagret,
      nestePlan,
      by: { ...lagret.by, dagerAlleAvtaler: lagret.by.dagerAlleAvtaler + (stjerne ? 1 : 0) },
      dato: nesteDato(lagret.dato),
      aktivDag: null,
      dagbok: [
        ...lagret.dagbok,
        {
          dato: lagret.dato,
          stjerne,
          stjerner,
          oppdrag: dag.oppdragFerdig === true,
          merknad: stjerneLinjer,
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
    melding: null,
  };
}

function likDato(a: { aar: number; maned: number; dag: number }, b: { aar: number; maned: number; dag: number }): boolean {
  return a.aar === b.aar && a.maned === b.maned && a.dag === b.dag;
}

function planInn(lagret: Lagret, dato = lagret.dato): PlanInn {
  return {
    fro: lagret.fro,
    dato,
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  };
}
