import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { ferdigeBygg, kanPlassere, kravSomOves, pyntPlasser, nesteByggId, nesteHjem, omraderForNivaa } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { lagDagsplan, morgendagensApning, morgendagensButikk, nesteDato, utvidRytme, type PlanInn } from "../dag/plan";
import { froTilfeldig, spredt, stokk } from "../felles/tilfeldig";
import { forklaring } from "../oppgaver/forklaring";
import { trekkOppgave, varighetTekst, type OppgaveKontekst } from "../oppgaver/lag";
import { sjekkSvar } from "../oppgaver/sjekk";
import { registrerSvar } from "../tilpasning/mestring";
import { erApen, leggTil, nesteApning, tidTilDigital24, tidTilOrd } from "../tid/tid";
import { aktivitetSporsmal, visBestemt, visNavn } from "../dag/aktiviteter";
import { tegnKart } from "../grafikk/bygg-svg";
import { formMedArtikkel, formNavn, mal, navnVare, smaForbokstav, vareBestemt, vareFlertall } from "../tekst/ordbok";
import { ukedagTekst } from "../tekst/spraak";
import type { AktivDag, ByggId, Dagsplan, Ferdighet, Hylle, Lagret, Nivaa, Oppgave, SkiltTid, StedId, Valg, VareId } from "../typer";
import { avtaleHer, gangMinutter, nesteSteg, startTidFor } from "./anbefaling";

export type Handling =
  | { slag: "start"; blanding?: number }
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
  | { slag: "pynt"; vare: VareId; plass: string }
  | { slag: "pynt-flytt"; id: string; plass: string }
  | { slag: "pynt-fjern"; id: string }
  | { slag: "ekstra"; ja: boolean }
  | { slag: "flytt"; instans: string; x: number; y: number }
  | { slag: "mot" }
  | { slag: "spis" }
  | { slag: "klokke" }
  | { slag: "oppdrag" }
  | { slag: "ov" }
  | { slag: "ur-runde"; riktige: number }
  | { slag: "avslutt" };

const KLOKKE: Ferdighet[] = ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24", "tidsrom", "periode", "ukedager", "maneder"];
/** Pynten i pyntebua, billigst først (gj. 10, C4). */
export const PYNT: VareId[] = ["pynt-blomst", "pynt-busk", "pynt-flagg", "pynt-tre", "pynt-lykt", "pynt-postkasse", "pynt-benk", "pynt-fontene", "pynt-ender"];
export const PYNT_PRIS: Partial<Record<VareId, number>> = {
  "pynt-blomst": 2,
  "pynt-busk": 2,
  "pynt-flagg": 3,
  "pynt-tre": 3,
  "pynt-lykt": 4,
  "pynt-postkasse": 4,
  "pynt-benk": 5,
  "pynt-fontene": 6,
  "pynt-ender": 6,
};
/** Tid en runde i butikken koster når den slutter uten at noe er løst. */
const MISLYKKET_RUNDE = 15;

function si(lagret: Lagret, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(lagret.innstillinger.spraak, nb, nn, verdier);
}

function kontekst(lagret: Lagret, forsok = 0): OppgaveKontekst {
  return {
    tilfeldig: froTilfeldig(lagret.fro + forsok * 7919),
    spraak: lagret.innstillinger.spraak,
    nivaa: lagret.innstillinger.nivaa,
    mestring: lagret.mestring,
    plan: lagret.aktivDag?.plan ?? null,
    naa: lagret.aktivDag?.tid,
    // De siste malene, og de siste av hver type, så alle variantene kommer på omgang (gj. 10, C2).
    unngaMal: [...lagret.sisteMaler, ...Object.values(lagret.malPerType ?? {}).flat()],
    unngaNokkel: lagret.sisteNokkel,
    unngaNokler: lagret.sisteNokler ?? [],
    tidsromPa: lagret.innstillinger.tidsromPa,
    ukedagNavn: (dag) => ukedagTekst(lagret.innstillinger.spraak, dag),
  };
}

/** Historikken husker de siste 30 malene og nøklene (gj. 10, C2). */
const HUSK = 30;
/** Høyst tre av samme type per dag og to på rad, fra alle kilder (gj. 10, C2). */
const MAKS_PER_DAG = 3;

/** Tekst og svar. To oppgaver med samme signatur ser like ut for barnet. */
export function signatur(oppgave: Oppgave): string {
  const svar = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
  return `${oppgave.prompt}|${svar?.tekst ?? svar?.klokke ?? svar?.form ?? svar?.tall ?? oppgave.fasit}`;
}

function dagNr(lagret: Lagret): number {
  return lagret.dagbok.length;
}

function huskOppgave(lagret: Lagret, oppgave: Oppgave): Lagret {
  const d = dagNr(lagret);
  return {
    ...lagret,
    fro: lagret.fro + 1,
    sisteMaler: [...lagret.sisteMaler, oppgave.mal].slice(-HUSK),
    sisteNokkel: oppgave.nokkel || lagret.sisteNokkel,
    sisteNokler: [...(lagret.sisteNokler ?? []), oppgave.nokkel].filter(Boolean).slice(-HUSK),
    malPerType: { ...(lagret.malPerType ?? {}), [oppgave.type]: [...(lagret.malPerType?.[oppgave.type] ?? []), oppgave.mal].slice(-8) },
    sett: [...(lagret.sett ?? []).filter((rad) => rad.d >= d - 3), { s: signatur(oppgave), d }].slice(-300),
  };
}

/** Alle oppgaver som vises, går inn i historikken og typetakten: butikk, bonus, dør, avtale, oppdrag og gåte. */
function vis(lagret: Lagret, oppgaver: Oppgave[]): Lagret {
  let ut = lagret;
  for (const oppgave of oppgaver) ut = huskOppgave(ut, oppgave);
  return medTakt(ut, oppgaver);
}

/** Om typen kan brukes nå: høyst tre i dag og ikke tredje gang på rad. Runden som lages, teller med. */
function typeLedig(lagret: Lagret, type: Oppgave["type"], iRunden: readonly Oppgave[] = [], avtale = false): boolean {
  const dag = lagret.aktivDag;
  const telle = (navn: Oppgave["type"]) => (dag?.typeTakt?.[navn] ?? 0) + iRunden.filter((rad) => rad.type === navn).length;
  const antall = telle(type);
  if (antall >= MAKS_PER_DAG) return false;
  // Avtalene senere i dag kan ikke hoppes over. Butikken lar plass stå igjen til spørsmålene deres.
  if (!avtale && dag && (type === "hvor-lenge" || type === "rekker-jeg")) {
    const igjen = dag.plan.avtaler.filter((rad) => rad.varighet > 0 && rad.slag !== "middag" && !dag.besokt.includes(rad.id) && rad.start + rad.varighet > dag.tid).length;
    if (telle("hvor-lenge") + telle("rekker-jeg") + 1 + igjen > 2 * MAKS_PER_DAG) return false;
  }
  const rekke = [...(dag?.typeRekke ?? []), ...iRunden.map((rad) => rad.type)];
  return !(rekke.length >= 2 && rekke[rekke.length - 1] === type && rekke[rekke.length - 2] === type);
}

/** Om barnet har sett oppgaven nylig: samme tekst og svar de siste tre dagene, eller samme mal blant de ti siste. */
function erSett(lagret: Lagret, oppgave: Oppgave, iRunden: readonly Oppgave[]): boolean {
  const sig = signatur(oppgave);
  const d = dagNr(lagret);
  if ((lagret.sett ?? []).some((rad) => rad.s === sig && rad.d >= d - 3)) return true;
  if (iRunden.some((rad) => signatur(rad) === sig)) return true;
  return [...lagret.sisteMaler, ...iRunden.map((rad) => rad.mal)].slice(-10).includes(oppgave.mal);
}

/** Lager en oppgave barnet ikke har sett nylig. Prøver med nye frø, og tar den første som ble laget hvis alle er sett. */
function fersk(lagret: Lagret, iRunden: readonly Oppgave[], lag: (forsok: number) => Oppgave | null): Oppgave | null {
  let forste: Oppgave | null = null;
  for (let forsok = 0; forsok < 10; forsok++) {
    let oppgave: Oppgave | null = null;
    try {
      oppgave = lag(forsok);
    } catch {
      continue;
    }
    if (!oppgave) continue;
    forste ??= oppgave;
    if (!erSett(lagret, oppgave, iRunden)) return oppgave;
  }
  return forste;
}

/** Samme lagring med et annet frø, for et nytt forsøk. */
function medFro(lagret: Lagret, forsok: number): Lagret {
  return forsok === 0 ? lagret : { ...lagret, fro: lagret.fro + forsok * 7919 };
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
    const apning = tidTilDigital24(dag.plan.nesteApning ?? morgendagensApning(planInn(lagret)));
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

const DOR_TEKST: readonly (readonly [string, string])[] = [
  ["Er butikken åpen nå? Klokka er {naa}.", "Er butikken open no? Klokka er {naa}."],
  ["Klokka er {naa}. Kan vi gå inn?", "Klokka er {naa}. Kan vi gå inn?"],
  ["Se på skiltet. Klokka er {naa}. Er det åpent?", "Sjå på skiltet. Klokka er {naa}. Er det ope?"],
  ["Klokka er {naa}. Er døra åpen?", "Klokka er {naa}. Er døra open?"],
  ["Kan vi handle nå? Klokka er {naa}.", "Kan vi handle no? Klokka er {naa}."],
  ["Les skiltet. Er butikken åpen klokka {naa}?", "Les skiltet. Er butikken open klokka {naa}?"],
];

const APNER_TEKST: readonly (readonly [string, string])[] = [
  ["Når åpner butikken?", "Når opnar butikken?"],
  ["Når kan vi handle?", "Når kan vi handle?"],
  ["Les skiltet. Når åpner butikken?", "Les skiltet. Når opnar butikken?"],
  ["Døra er låst. Når åpner den?", "Døra er låst. Når opnar ho?"],
  ["Når blir det åpent?", "Når blir det ope?"],
  ["Se på skiltet. Når kan vi gå inn?", "Sjå på skiltet. Når kan vi gå inn?"],
];

const APNER_MORGEN_TEKST: readonly (readonly [string, string])[] = [
  ["Når åpner butikken i morgen?", "Når opnar butikken i morgon?"],
  ["Når kan vi handle i morgen?", "Når kan vi handle i morgon?"],
  ["Les skiltet. Når åpner butikken i morgen?", "Les skiltet. Når opnar butikken i morgon?"],
  ["Butikken er stengt nå. Når åpner den i morgen?", "Butikken er stengd no. Når opnar han i morgon?"],
  ["Når blir det åpent i morgen?", "Når blir det ope i morgon?"],
  ["Se på skiltet. Når kan vi gå inn i morgen?", "Sjå på skiltet. Når kan vi gå inn i morgon?"],
];

/** Første variant (0–5) fra `start` som ikke er blant de ti siste malene. */
function friVariant(lagret: Lagret, navn: string, start: number): number {
  const siste = lagret.sisteMaler.slice(-10);
  for (let i = 0; i < 6; i++) {
    const v = (start + i) % 6;
    if (!siste.includes(`${navn}-${v + 1}`)) return v;
  }
  return start % 6;
}

function dorOppgave(lagret: Lagret): Oppgave {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("ingen dag");
  const apen = erApen(dag.tid, dag.plan.butikk);
  const skilt = skiltFor(dag);
  // Seks ordlyder som skifter fra dag til dag. Døra bruker alltid klokka i spillet (gj. 10, C2 og 7.4).
  const v = friVariant(lagret, "dor", (dagNr(lagret) + Math.floor(dag.tid / 30)) % 6);
  const tekst = DOR_TEKST[v] ?? DOR_TEKST[0]!;
  return {
    id: `dor-${dag.tid}`,
    type: "apningstider",
    mal: `dor-${v + 1}`,
    ferdighet: "hele-timer",
    prompt: si(lagret, tekst[0], tekst[1], { naa: tidTilOrd(dag.tid, lagret.innstillinger.spraak) }),
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
  const v = friVariant(lagret, "dor-apner", (dagNr(lagret) + Math.floor(dag.tid / 30)) % 6);
  const tekst = (iMorgen ? APNER_MORGEN_TEKST : APNER_TEKST)[v] ?? APNER_TEKST[0]!;
  return {
    id: `dor-apner-${dag.tid}`,
    type: "apningstider",
    mal: `dor-apner-${v + 1}`,
    ferdighet: "hele-timer",
    prompt: si(lagret, tekst[0], tekst[1]),
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
  const dag = `${lagret.dato.aar}-${lagret.dato.maned}-${lagret.dato.dag}`;
  let mestring = registrerSvar(lagret.mestring, oppgave.ferdighet, riktig, lagret.innstillinger.nivaa, dag);
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
  if (handling.slag === "start") return startDag(lagret, handling.blanding);
  if (handling.slag === "pynt") return pynt(lagret, handling.vare, handling.plass);
  if (handling.slag === "pynt-flytt") return flyttPynt(lagret, handling.id, handling.plass);
  if (handling.slag === "pynt-fjern") return fjernPynt(lagret, handling.id);
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
  if (handling.slag === "ov") return ov(lagret);
  if (handling.slag === "ur-runde") return urRunde(lagret, handling.riktige);
  return avslutt(lagret);
}

/** `blanding` kommer fra appen (Date.now()) og gir ulike dager fra samme lagring. Testene sender ingen (gj. 10, C2). */
function startDag(lagret: Lagret, blanding = 0): { lagret: Lagret; melding: string | null } {
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
  const morgen = morgenKjede(inn, lagret.senerePlaner ?? []);
  const apen = morgen.find((rad) => !rad.butikk.stengtHele);
  const iMorgen = apen ? { apner: apen.butikk.apner, stenger: apen.butikk.stenger } : morgendagensButikk(inn);
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
    morgen,
  };
  return {
    lagret: {
      ...lagret,
      nestePlan: null,
      senerePlaner: undefined,
      fro: lagret.fro + 1 + (Math.abs(Math.floor(blanding)) % 1_000_003),
      sistePlaner: [...lagret.sistePlaner, plan.nokkel].slice(-7),
      aktivDag: dag,
    },
    melding: null,
  };
}

/** Planene for i morgen og dagene etter, til butikken er åpen igjen. Samme frø som morgendagensButikk. */
function morgenKjede(inn: PlanInn, lagrede: readonly Dagsplan[]): Dagsplan[] {
  const ut: Dagsplan[] = [];
  let dato = inn.dato;
  let fro = inn.fro + 1;
  for (let i = 0; i < 3; i++) {
    dato = nesteDato(dato);
    const funnet = lagrede.find((plan) => likDato(plan.dato, dato));
    const plan = funnet ?? lagDagsplan({ ...inn, fro, dato });
    ut.push(plan);
    if (!plan.butikk.stengtHele) break;
    fro += 1;
  }
  return ut;
}

function urRunde(lagret: Lagret, riktige: number): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const urRunder = (dag.urRunder ?? 0) + 1;
  if (dag.urBetalt || riktige <= 0) return { lagret: { ...lagret, aktivDag: { ...dag, klokkeLekt: true, urRunder } }, melding: null };
  return {
    lagret: { ...lagret, mynter: lagret.mynter + riktige, aktivDag: { ...dag, urBetalt: true, klokkeLekt: true, urRunder } },
    melding: si(lagret, "Du får {n} mynter.", "Du får {n} myntar.", { n: String(riktige) }),
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
    lagret: vis({ ...lagret, aktivDag: { ...dag, fase: "dor", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } }, [oppgave]),
    melding: null,
  };
}

function handle(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.sted !== "butikk") return { lagret, melding: null };
  if (!dag.dorLest) return dor(lagret);
  if (!erApen(dag.tid, dag.plan.butikk)) return { lagret, melding: apningTekst(lagret) };
  // Barnet gikk ut midt i en runde. Runden fortsetter der den slapp (gj. 10, 7.1.2).
  if (dag.pauset && dag.pauset.ko.length > dag.pauset.aktiv) {
    const { ko, aktiv, feil } = dag.pauset;
    return { lagret: { ...lagret, aktivDag: { ...dag, fase: "handel", ko, aktiv, pauset: undefined, forklaring: null, melding: null, feil: feil ?? 0 } }, melding: null };
  }
  const vare = manglendeDeler(lagret)[0];
  if (!vare) {
    return { lagret, melding: si(lagret, "Handlelisten er tom.", "Handlelista er tom.") };
  }
  const kloss = vare.startsWith("kloss");
  const klokkeTyper = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"] as const;
  const form = formForVare(vare);
  // Fordelingen trekkes med frøet, så den ikke henger fast i samme rytme hver dag. Minst halvparten av formoppgavene handler om delen (gj. 9, B5).
  const trekk = froTilfeldig(lagret.fro * 31 + 7);
  const vilKlokke = spredt(trekk()) < 0.5 || !form;
  const x = spredt(trekk());
  const manglerRom = ROMFORMER.find((rom) => !lagret.by.kjente3d.includes(rom));
  const ledig = (type: Oppgave["type"]) => typeLedig(lagret, type);
  // Mønsteret trengs for å bygge videre. Når kravet mangler, kommer mønsteret oftere (gj. 10, C5).
  const trengerMonster = lagret.by.monsterFullfort < 1;
  const monster = !vilKlokke && trengerMonster && (x < 0.2 || monsterMangler(lagret)) && ledig("monster");
  const laerRom = !vilKlokke && !monster && Boolean(manglerRom) && manglerRom !== form && x >= 0.2 && x < 0.35 && ledig("finn-formen");
  const brukGavl = !vilKlokke && !monster && !laerRom && Boolean(form) && !kloss && x >= 0.35 && x < 0.45 && ledig("sorter");
  const variasjonTyper = ["sorter", "hvem-passer-ikke", "monster"] as const;
  const delTyper: Oppgave["type"][] = kloss ? ["finn-formen", "stempel", "tell"] : ["finn-formen", "tegn", "tell"];
  const delLedig = delTyper.some(ledig);
  const variasjon = !vilKlokke && !monster && !laerRom && !brukGavl && ((x >= 0.45 && x < 0.5) || !delLedig);
  const lagForste = (forsok: number): Oppgave | null => {
    const l = medFro(lagret, forsok);
    if (brukGavl) return gavlOppgave(l, vare);
    if (vilKlokke) return trekkOppgave({ ...kontekst(l), type: velgType(lagret, klokkeTyper[lagret.fro % klokkeTyper.length] ?? "les-klokka", klokkeTyper, []) });
    if (monster) return trekkOppgave({ ...kontekst(l), hylle: "form", type: "monster" });
    if (laerRom) return trekkOppgave({ ...kontekst(l), type: "finn-formen", maalForm: manglerRom, kjente3d: lagret.by.kjente3d });
    const variert = () => trekkOppgave({ ...kontekst(l), hylle: "form", type: velgType(lagret, variasjonTyper[lagret.fro % variasjonTyper.length] ?? "sorter", variasjonTyper, []) });
    if (variasjon) return variert();
    return delOppgave(l, form ?? "rektangel", kloss) ?? variert();
  };
  const trukket = fersk(lagret, [], lagForste);
  if (!trukket) return { lagret, melding: si(lagret, "Handlelisten er tom.", "Handlelista er tom.") };
  const spraak = lagret.innstillinger.spraak;
  const oppgaveForm = trukket.form3d ?? trukket.form;
  const omDelen = !vilKlokke && form !== undefined && oppgaveForm === form && DEL_TYPER.includes(trukket.type);
  let prompt = trukket.prompt;
  let delKontekst: string | undefined;
  if (brukGavl) {
    delKontekst = undefined;
  } else if (omDelen && form) {
    // Oppgaven handler om delen, og teksten sier det (gj. 9, B5).
    const intro = kloss
      ? si(lagret, "{del} ligger i hylla med {flertall}.", "{del} ligg i hylla med {flertall}.", { del: vareBestemt(vare, spraak), flertall: vareFlertall(vare, spraak) })
      : si(lagret, "{del} er {form}.", "{del} er {form}.", { del: vareBestemt(vare, spraak), form: formMedArtikkel(form, spraak) });
    prompt = `${intro} ${trukket.prompt}`;
  } else {
    delKontekst = si(lagret, "Løs oppgaven for å få {del}.", "Løys oppgåva for å få {del}.", { del: smaForbokstav(vareBestemt(vare, spraak)) });
  }
  // Oppgavene i butikken stilles av ekspeditøren (gj. 10, 7.1.8).
  const oppgave: Oppgave = { ...trukket, prompt, kontekst: delKontekst, hvem: brukGavl ? trukket.hvem : si(lagret, "ekspeditøren", "ekspeditøren"), vare };
  const lengde = lagret.innstillinger.nivaa === "forste" ? 3 : lagret.innstillinger.nivaa === "utfordrende" ? 5 : 4;
  const bonus = bonusOppgaver(lagret, oppgave, lengde - 1);
  const ko = [oppgave, ...bonus];
  const kasseVist = dag.kasseVist === true || bonus.some((rad) => rad.mal.startsWith("kasse-"));
  return {
    lagret: vis({ ...lagret, aktivDag: { ...dag, fase: "handel", ko, aktiv: 0, forklaring: null, melding: null, feil: 0, kasseVist } }, ko),
    melding: null,
  };
}

/** Bygget venter bare på mønsteret: alt på nivået er ferdig, men kravet om mønster er ikke oppfylt (gj. 10, C5). */
function monsterMangler(lagret: Lagret): boolean {
  return lagret.by.monsterFullfort < 1 && nesteByggId(lagret.by) === null;
}

/** Oppgavetyper som kan handle om formen til delen. */
const DEL_TYPER: Oppgave["type"][] = ["finn-formen", "tegn", "tell", "stempel"];

/** En formoppgave om delens egen form. Faller tilbake til «finn formen», som alltid kan lages. */
function delOppgave(lagret: Lagret, form: string, kloss: boolean): Oppgave | null {
  const typer = (kloss ? ["finn-formen", "stempel", "tell"] : ["finn-formen", "tegn", "tell"]) as Oppgave["type"][];
  const ledige = typer.filter((type) => typeLedig(lagret, type));
  const type = ledige[lagret.fro % Math.max(1, ledige.length)] ?? "finn-formen";
  const grunn = { ...kontekst(lagret), hylle: (kloss ? "kloss" : "form") as Hylle, maalForm: form, kjente3d: lagret.by.kjente3d };
  const forsok = trekkOppgave({ ...grunn, type });
  const passer = (oppgave: Oppgave, onsket: Oppgave["type"]) => oppgave.type === onsket && (oppgave.form3d ?? oppgave.form) === form;
  if (passer(forsok, type)) return forsok;
  for (const reserve of ledige.filter((rad) => rad !== type)) {
    const neste = trekkOppgave({ ...grunn, type: reserve });
    if (passer(neste, reserve)) return neste;
  }
  if (!typeLedig(lagret, "finn-formen")) return null;
  return trekkOppgave({ ...grunn, type: "finn-formen" });
}

function velgType(lagret: Lagret, onsket: Oppgave["type"], familie: readonly Oppgave["type"][], brukt: readonly Oppgave[]): Oppgave["type"] {
  const nivaa = lagret.innstillinger.nivaa;
  const reserve: Oppgave["type"][] = [...KLOKKE_TYPER, ...FORM_TYPER, ...MALING_TYPER[nivaa]];
  const kandidater = [onsket, ...familie.filter((type) => type !== onsket), ...reserve.filter((type) => !familie.includes(type))];
  const ledig = kandidater.find((type) => typeLedig(lagret, type, brukt));
  if (ledig) return ledig;
  // Alle typer er brukt opp: velg den minst brukte (gj. 10, C2).
  const antall = (type: Oppgave["type"]) => (lagret.aktivDag?.typeTakt?.[type] ?? 0) + brukt.filter((rad) => rad.type === type).length;
  return [...kandidater].sort((a, b) => antall(a) - antall(b))[0] ?? onsket;
}

const KLOKKE_TYPER: Oppgave["type"][] = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"];
const FORM_TYPER: Oppgave["type"][] = ["finn-formen", "hvem-passer-ikke", "sorter", "tell", "tegn", "monster"];

function medTakt(lagret: Lagret, oppgaver: Oppgave[]): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const takt = { ...(dag.typeTakt ?? {}) };
  for (const oppgave of oppgaver) takt[oppgave.type] = (takt[oppgave.type] ?? 0) + 1;
  const typeRekke = [...(dag.typeRekke ?? []), ...oppgaver.map((rad) => rad.type)].slice(-6);
  return { ...lagret, aktivDag: { ...dag, typeTakt: takt, typeRekke } };
}

function gavlOppgave(lagret: Lagret, vare: VareId): Oppgave {
  const form = formForVare(vare) ?? "trekant";
  const grunn = lagret.innstillinger.nivaa === "forste" ? 2 : lagret.innstillinger.nivaa === "andre" ? 3 : 4;
  const n = grunn + (lagret.fro % 2);
  const biter = Array.from({ length: n }, (_, i) => ({ id: `bit-${i}`, form }));
  const v = lagret.fro % 3;
  const tekst = ([
    ["Hjelp meg å tette gavlen.", "Hjelp meg å tette gavlen."],
    ["Gavlen har hull. Legg bitene på plass.", "Gavlen har hol. Legg bitane på plass."],
    ["Legg alle bitene i gavlen.", "Legg alle bitane i gavlen."],
  ] as const)[v];
  return {
    id: `gavl-${lagret.fro}`,
    type: "sorter",
    mal: `gavl-${v + 1}`,
    ferdighet: "sortere",
    prompt: si(lagret, tekst[0], tekst[1]),
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

const BAKST: readonly (readonly [string, string])[] = [
  ["kaka", "kaka"],
  ["brødet", "brødet"],
  ["bollene", "bollane"],
  ["pizzaen", "pizzaen"],
  ["muffinsene", "muffinsane"],
  ["pepperkakene", "pepperkakene"],
];

const KAKE_TEKST: readonly (readonly [string, string])[] = [
  ["{Bakst} kom i ovnen klokka {inn}. Steketiden er {varighet}. Når tar vi ut {bakst}?", "{Bakst} kom i omnen klokka {inn}. Steiketida er {varighet}. Når tek vi ut {bakst}?"],
  ["Bakeren satte inn {bakst} klokka {inn}. Steketiden er {varighet}. Når skal ovnen åpnes?", "Bakaren sette inn {bakst} klokka {inn}. Steiketida er {varighet}. Når skal omnen opnast?"],
  ["Steketiden er {varighet}. {Bakst} kom inn klokka {inn}. Når tar vi ut {bakst}?", "Steiketida er {varighet}. {Bakst} kom inn klokka {inn}. Når tek vi ut {bakst}?"],
  ["Klokka {inn} gikk {bakst} inn i ovnen. Etter {varighet} er det ferdig stekt. Når er det?", "Klokka {inn} gjekk {bakst} inn i omnen. Etter {varighet} er det ferdig steikt. Når er det?"],
  ["Ovnen ringer etter {varighet}. {Bakst} kom inn klokka {inn}. Når ringer ovnen?", "Omnen ringjer etter {varighet}. {Bakst} kom inn klokka {inn}. Når ringjer omnen?"],
  ["{Bakst} trenger {varighet} i ovnen. Vi satte inn klokka {inn}. Når tar vi ut {bakst}?", "{Bakst} treng {varighet} i omnen. Vi sette inn klokka {inn}. Når tek vi ut {bakst}?"],
];

/** Bakeren ved siden av: seks ordlyder, seks slags bakst og steketider etter nivå (gj. 10, C2). */
export function bakerOppgave(lagret: Lagret): Oppgave {
  const nivaa = lagret.innstillinger.nivaa;
  const steg = nivaa === "forste" ? 30 : nivaa === "andre" ? 15 : 5;
  const trekk = froTilfeldig(lagret.fro * 53 + 11);
  trekk();
  const tider = nivaa === "forste" ? [30, 60] : nivaa === "andre" ? [15, 30, 45, 60] : [20, 25, 35, 40, 50];
  const steketid = tider[Math.floor(spredt(trekk()) * tider.length)] ?? tider[0]!;
  const fra = lagret.aktivDag?.tid ?? 14 * 60;
  const til = (fra + steketid) % (24 * 60);
  const feilA = (til + steg) % (24 * 60);
  const feilB = (til - steg + 24 * 60) % (24 * 60);
  const spraak = lagret.innstillinger.spraak;
  const v = Math.floor(spredt(trekk()) * KAKE_TEKST.length);
  const navn = BAKST[Math.floor(spredt(trekk()) * BAKST.length)] ?? BAKST[0]!;
  const bakst = si(lagret, navn[0], navn[1]);
  const tekst = KAKE_TEKST[v] ?? KAKE_TEKST[0]!;
  const valg = stokk(
    trekk,
    [til, feilA, feilB].filter((tid, indeks, liste) => liste.indexOf(tid) === indeks).map((tid) => ({ id: String(tid), klokke: tid, tekst: tidTilOrd(tid, spraak) })),
  );
  return {
    id: `kake-${lagret.fro}`,
    type: "hvor-lenge",
    mal: `kake-${v + 1}`,
    ferdighet: "tidsrom",
    prompt: si(lagret, tekst[0], tekst[1], {
      Bakst: bakst.charAt(0).toUpperCase() + bakst.slice(1),
      bakst,
      varighet: varighetTekst(steketid, spraak),
      inn: tidTilOrd(fra, spraak),
    }),
    nokkel: `klokke:${til}`,
    valg,
    fasit: String(til),
    vare: "planke",
    hvem: si(lagret, "ekspeditøren", "ekspeditøren"),
    overraskelse: false,
    ovelse: true,
    maalKlokke: fra,
  };
}

/** Hint som skiller formene fra hverandre. Det første står i oppgaven, resten kommer med «Neste hint». */
const GATE: Record<string, readonly (readonly [string, string])[]> = {
  kule: [
    ["Den kan trille i alle retninger.", "Han kan trille i alle retningar."],
    ["Den har ingen hjørner og ingen flate sider.", "Han har ingen hjørne og ingen flate sider."],
    ["Den er rund som en ball.", "Han er rund som ein ball."],
  ],
  kube: [
    ["Den har seks flater som er like store.", "Han har seks flater som er like store."],
    ["Alle flatene er kvadrater.", "Alle flatene er kvadrat."],
    ["Den ligner en terning.", "Han liknar ein terning."],
  ],
  sylinder: [
    ["Den kan trille, men bare rett fram.", "Han kan trille, men berre rett fram."],
    ["Den har to runde flater.", "Han har to runde flater."],
    ["Den ligner en hermetikkboks.", "Han liknar ein hermetikkboks."],
  ],
  kjegle: [
    ["Den har én spiss og én rund flate.", "Han har éin spiss og éi rund flate."],
    ["Den triller rundt i ring.", "Han trillar rundt i ring."],
    ["Den ligner en trafikkjegle.", "Han liknar ei trafikkjegle."],
  ],
  pyramide: [
    ["Den har en spiss og en firkantet bunn.", "Han har ein spiss og ein firkanta botn."],
    ["Sidene er trekanter.", "Sidene er trekantar."],
    ["Den ligner pyramidene i Egypt.", "Han liknar pyramidane i Egypt."],
  ],
};

/** Gåten ved kassa: formen roterer, hintene skiller formene, og bildet er formens skygge (gj. 10, C2). Høyst én om dagen. */
export function kasseOppgave(lagret: Lagret): Oppgave {
  const former = lagret.innstillinger.nivaa === "utfordrende" ? ["kule", "kube", "sylinder", "kjegle", "pyramide"] : ["kule", "kube", "sylinder", "kjegle"];
  const nylig = lagret.sisteNokler ?? [];
  const start = (lagret.fro + dagNr(lagret)) % former.length;
  const rekke = [...former.slice(start), ...former.slice(0, start)];
  const form = rekke.find((id) => !nylig.includes(`gate:${id}`)) ?? rekke[0] ?? "kule";
  const indeks = former.indexOf(form);
  const sporsmal = si(lagret, "Hvilken form er det?", "Kva for form er det?");
  // Hintene kommer i ulik rekkefølge, så gåten ikke starter likt hver gang.
  const alle = (GATE[form] ?? GATE.kule ?? []).map((rad) => `${si(lagret, rad[0], rad[1])} ${sporsmal}`);
  const forst = (lagret.fro + dagNr(lagret)) % Math.max(1, alle.length);
  const hint = [...alle.slice(forst), ...alle.slice(0, forst)];
  const andre = former.filter((id) => id !== form);
  const to = [andre[(lagret.fro + 1) % andre.length], andre[(lagret.fro + 2) % andre.length]].filter((id): id is string => Boolean(id));
  const valg = stokk(froTilfeldig(lagret.fro * 19 + 5), [form, ...to]).map((id) => ({ id, form: id, tekst: formNavn(id, lagret.innstillinger.spraak) }));
  return {
    id: `kasse-${lagret.fro}`,
    type: "stempel",
    mal: `kasse-${indeks + 1}`,
    ferdighet: "former-3d",
    prompt: hint[0] ?? sporsmal,
    nokkel: `gate:${form}`,
    valg,
    fasit: form,
    vare: "planke",
    hvem: si(lagret, "ekspeditøren", "ekspeditøren"),
    overraskelse: false,
    ovelse: true,
    hint,
    hintVist: 1,
    skygge: form,
  };
}

/**
 * Øving hjemme når et krav for neste bynivå mangler og det ikke er mer å bygge (gj. 10, C5).
 * Tre oppgaver av typen som mangler. Runden tar et kvarter.
 */
function ov(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const krav = kravSomOves(lagret.by);
  if (!dag || !krav || dag.ko.length > 0) return { lagret, melding: null };
  const typer: Oppgave["type"][] = krav === "monster" ? ["monster"] : krav === "klokke" ? ["les-klokka", "still-klokka", "koble"] : ["finn-formen"];
  const ko: Oppgave[] = [];
  for (let i = 0; i < 3; i++) {
    const type = typer.find((rad) => typeLedig(lagret, rad, ko)) ?? (ko.length === 0 ? typer[0] : undefined);
    if (!type) break;
    const ukjent = ROMFORMER.find((rom) => !lagret.by.kjente3d.includes(rom) && !ko.some((rad) => rad.form3d === rom));
    const trukket = fersk(lagret, ko, (forsok) =>
      trekkOppgave({
        ...kontekst(lagret, forsok),
        tilfeldig: froTilfeldig(lagret.fro + 61 * (i + 1) + forsok * 7919),
        type,
        hylle: type === "monster" || type === "finn-formen" ? "form" : undefined,
        maalForm: krav === "rom" ? ukjent : undefined,
        kjente3d: lagret.by.kjente3d,
        unngaMal: [...kontekst(lagret).unngaMal, ...ko.map((rad) => rad.mal)],
      }),
    );
    if (!trukket) break;
    ko.push({ ...trukket, ovelse: true, hjemme: true, hvem: si(lagret, "kjæledyret", "kjæledyret") });
  }
  if (!ko.length) return { lagret, melding: null };
  return {
    lagret: vis({ ...lagret, aktivDag: { ...dag, fase: "ute", ko, aktiv: 0, forklaring: null, feil: 0 } }, ko),
    melding: null,
  };
}

function startOppdrag(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.ko.length > 0 || dag.oppdragFerdig) return { lagret, melding: null };
  const typer: Oppgave["type"][] = lagret.fro % 2 === 0 ? ["finn-formen", "tell", "les-klokka", "still-klokka"] : ["les-klokka", "still-klokka", "finn-formen", "tell"];
  const type = velgType(lagret, typer[0] ?? "les-klokka", typer, []);
  const trukket = fersk(lagret, [], (forsok) =>
    trekkOppgave({
      ...kontekst(lagret, forsok),
      tilfeldig: froTilfeldig(lagret.fro + 91 + forsok * 7919),
      type,
      hylle: type === "finn-formen" || type === "tell" ? "form" : undefined,
    }),
  );
  if (!trukket) return { lagret, melding: null };
  const oppgave: Oppgave = {
    ...trukket,
    ovelse: true,
    oppdrag: true,
    hvem: si(lagret, "naboen", "naboen"),
    prompt: `${si(lagret, "Naboen spør.", "Naboen spør.")} ${trukket.prompt}`,
  };
  return {
    lagret: vis({ ...lagret, aktivDag: { ...dag, oppdragFra: dag.fase, fase: "ute", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } }, [oppgave]),
    melding: null,
  };
}

/** Måling, kart og kalender per nivå. 1. klasse: ukeplan og kalender. 2. klasse: også lengde og masse. Utfordrende: areal, koordinater og likevekt. */
const MALING_TYPER: Record<Nivaa, readonly Oppgave["type"][]> = {
  forste: ["ukeplan", "kalender"],
  andre: ["lengde", "masse", "ukeplan", "kalender"],
  utfordrende: ["areal", "koordinater", "likevekt", "lengde", "masse", "kalender"],
  blandet: ["ukeplan", "kalender", "lengde", "masse", "areal", "koordinater", "likevekt"],
};

function bonusOppgaver(lagret: Lagret, forste: Oppgave, antall: number): Oppgave[] {
  const klokkeTyper = ["les-klokka", "still-klokka", "koble", "hvor-lenge", "rekker-jeg", "apningstider"] as const;
  const formTyper = ["finn-formen", "hvem-passer-ikke", "sorter", "tell", "tegn", "monster"] as const;
  const forsteErKlokke = klokkeTyper.includes(forste.type as (typeof klokkeTyper)[number]);
  const ut: Oppgave[] = [];
  let klokke = !forsteErKlokke;
  const bybilde: Record<string, [string, string]> = {
    sirkel: ["Kumlokket i gata er rundt. Finn alle sirklene.", "Kumlokket i gata er rundt. Finn alle sirklane."],
    trekant: ["Skiltet er en trekant. Finn alle trekantene.", "Skiltet er ein trekant. Finn alle trekantane."],
    kvadrat: ["Pizzaboksen er et kvadrat. Finn alle kvadratene.", "Pizzaboksen er eit kvadrat. Finn alle kvadrata."],
    rektangel: ["Døra er et rektangel. Finn alle rektanglene.", "Døra er eit rektangel. Finn alle rektangla."],
  };
  for (let i = 0; i < antall; i++) {
    const familie = klokke ? klokkeTyper : formTyper;
    const onsket = familie[(lagret.fro + i) % familie.length] ?? (klokke ? "les-klokka" : "finn-formen");
    // Alle kilder teller: historikken, dagens typer og runden som lages (gj. 10, C2).
    const iRunden = [forste, ...ut];
    const ledig = (navn: Oppgave["type"]) => typeLedig(lagret, navn, iRunden);
    const unngaMal = [...kontekst(lagret).unngaMal, ...iRunden.map((rad) => rad.mal)];
    const erDel = i === 1 && lagret.innstillinger.nivaa === "andre";
    const kasse = i === 0 && lagret.innstillinger.nivaa !== "forste" && lagret.aktivDag?.kasseVist !== true && ledig("stempel");
    const kake = !kasse && klokke && !erDel && (lagret.fro + i) % 5 === 0 && ledig("hvor-lenge");
    const manglerRom = ROMFORMER.find((rom) => !lagret.by.kjente3d.includes(rom) && rom !== forste.form3d);
    const laerRom = !kasse && !klokke && manglerRom !== undefined && !ut.some((rad) => rad.form3d) && ledig("finn-formen");
    // Den siste plassen i runden går ofte til måling, kart eller kalender etter nivå (gj. 9, oppfølging).
    const malTyper = MALING_TYPER[lagret.innstillinger.nivaa];
    const maling = !kasse && i === antall - 1 && !erDel && !laerRom && spredt(froTilfeldig(lagret.fro * 7 + 3)()) < 0.5;
    // Mønsteret trengs for å bygge videre (gj. 10, C5).
    const monster = !kasse && !klokke && !laerRom && monsterMangler(lagret) && ledig("monster") && !iRunden.some((rad) => rad.type === "monster");
    const lag = (forsok: number): Oppgave | null => {
      const l = medFro(lagret, forsok);
      const tilfeldig = (ledd: number) => froTilfeldig(lagret.fro + ledd * (i + 1) + forsok * 7919);
      if (kasse) return kasseOppgave(l);
      if (kake) return bakerOppgave(l);
      if (monster) return trekkOppgave({ ...kontekst(l), tilfeldig: tilfeldig(13), hylle: "form", type: "monster", unngaMal });
      if (maling) return trekkOppgave({ ...kontekst(l), tilfeldig: tilfeldig(29), type: velgType(lagret, malTyper[lagret.fro % malTyper.length] ?? "kalender", malTyper, iRunden), unngaMal });
      if (laerRom) return trekkOppgave({ ...kontekst(l), tilfeldig: tilfeldig(17), type: "finn-formen", maalForm: manglerRom, kjente3d: lagret.by.kjente3d, unngaMal });
      let trukket = trekkOppgave({ ...kontekst(l), tilfeldig: tilfeldig(17), hylle: klokke ? undefined : "form", type: velgType(lagret, onsket, familie, iRunden), unngaMal });
      if (!ledig(trukket.type)) {
        // Malen falt tilbake til en type som alt er brukt opp i dag. Prøv en ledig type.
        const annen = velgType(lagret, trukket.type, [], iRunden);
        if (annen !== trukket.type) {
          try {
            const igjen = trekkOppgave({ ...kontekst(l), tilfeldig: tilfeldig(41), type: annen, unngaMal });
            if (ledig(igjen.type)) trukket = igjen;
          } catch {
            // Beholder den første.
          }
        }
      }
      const bilde = trukket.type === "finn-formen" && trukket.form && forsok % 2 === 1 ? bybilde[trukket.form] : undefined;
      return bilde ? { ...trukket, prompt: si(lagret, bilde[0], bilde[1]) } : trukket;
    };
    const trukket = fersk(lagret, iRunden, lag);
    if (!trukket) break;
    // Oppgavene i butikken stilles av ekspeditøren (gj. 10, 7.1.8).
    ut.push({ ...trukket, ovelse: trukket.ovelse ?? !erDel, hvem: si(lagret, "ekspeditøren", "ekspeditøren") });
    klokke = !klokke;
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
        lagret: vis({ ...neste, aktivDag: { ...dagEtter, fase: "dor", ko: [oppfolging], aktiv: 0, forklaring: null, feil: 0 } }, [oppfolging]),
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
          fase: dag.oppdragFra ?? "ute",
          forklaring: null,
          feil: 0,
          oppdragFerdig: true,
          oppdragGjort: true,
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
    const sluttAvtale = erAktivitet && aktuell ? aktuell.start + aktuell.varighet : oppgave.hjemme ? dag.tid + 15 : dag.tid;
    const tid = Math.min(sluttAvtale, dag.plan.leggetid);
    const faseEtter = erAktivitet ? "aktivitet" : oppgave.hjemme ? "ute" : "handel";
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
  if (oppgave.oppdrag) {
    return {
      lagret: { ...lagret, aktivDag: { ...dag, ko: [], aktiv: 0, forklaring: null, feil: 0, fase: dag.oppdragFra ?? "ute", oppdragFerdig: true, oppdragGjort: false } },
      melding: si(lagret, "Vi prøver et nytt oppdrag i morgen.", "Vi prøver eit nytt oppdrag i morgon."),
    };
  }
  const aktiv = dag.aktiv + 1;
  if (aktiv >= dag.ko.length) {
    const erAvtale = oppgave.nokkel.startsWith("avtale:");
    const aktuell = erAvtale ? dag.plan.avtaler.find((rad) => rad.id === oppgave.nokkel.slice("avtale:".length)) : undefined;
    if (aktuell) {
      // Barnet var med på avtalen. Feil svar på klokkespørsmålet skal ikke låse dagen (gj. 9, 6.9).
      const rakk = dag.tid < aktuell.start + aktuell.varighet;
      const med = {
        ...lagret,
        aktivDag: {
          ...dag,
          fase: "aktivitet" as const,
          ko: [],
          forklaring: null,
          feil: 0,
          besokt: rakk ? [...dag.besokt, aktuell.id] : dag.besokt,
          sent: (dag.sent ?? []).filter((rad) => rad !== aktuell.id),
          sted: aktuell.aktivitet === "lillesoster" ? ("hjemme" as const) : dag.sted,
        },
      };
      const neste = merkTid(med, Math.min(aktuell.start + aktuell.varighet, dag.plan.leggetid));
      return { lagret: neste, melding: si(lagret, "Vi øver mer på den senere.", "Vi øver meir på den seinare.") };
    }
    const tid = erAvtale ? dag.tid : Math.min(dag.plan.leggetid, dag.tid + MISLYKKET_RUNDE);
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
  const fase =
    dag.fase === "forklaring"
      ? oppgave.id.startsWith("dor-")
        ? "dor"
        : oppgave.nokkel.startsWith("avtale:")
          ? "aktivitet"
          : oppgave.hjemme
            ? "ute"
            : "handel"
      : dag.fase;
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

/** Setter pynt på en ledig plass i en hage, langs stien eller ved torget (gj. 10, C4). */
function pynt(lagret: Lagret, vare: VareId, plass: string): { lagret: Lagret; melding: string | null } {
  const pris = PYNT_PRIS[vare];
  if (!PYNT.includes(vare) || pris === undefined) return { lagret, melding: null };
  if (lagret.mynter < pris) {
    return { lagret, melding: si(lagret, "Du mangler {n} mynter.", "Du manglar {n} myntar.", { n: String(pris - lagret.mynter) }) };
  }
  const sted = pyntPlasser(lagret.by).find((rad) => rad.plass === plass);
  if (!sted) return { lagret, melding: si(lagret, "Der er det ikke plass.", "Der er det ikkje plass.") };
  if ((lagret.by.pynt ?? []).some((rad) => rad.plass === plass)) return { lagret, melding: si(lagret, "Der står det alt pynt.", "Der står det alt pynt.") };
  const nummer = Math.max(0, ...(lagret.by.pynt ?? []).map((rad) => Number(rad.id.split("-")[1]) || 0)) + 1;
  return {
    lagret: {
      ...lagret,
      mynter: lagret.mynter - pris,
      by: { ...lagret.by, pynt: [...(lagret.by.pynt ?? []), { id: `pynt-${nummer}`, vare, plass, x: sted.x, y: sted.y }] },
    },
    melding: si(lagret, "Pynten er på plass.", "Pynten er på plass."),
  };
}

function flyttPynt(lagret: Lagret, id: string, plass: string): { lagret: Lagret; melding: string | null } {
  const sted = pyntPlasser(lagret.by).find((rad) => rad.plass === plass);
  if (!sted || (lagret.by.pynt ?? []).some((rad) => rad.plass === plass && rad.id !== id)) {
    return { lagret, melding: si(lagret, "Der er det ikke plass.", "Der er det ikkje plass.") };
  }
  return {
    lagret: { ...lagret, by: { ...lagret.by, pynt: (lagret.by.pynt ?? []).map((rad) => (rad.id === id ? { ...rad, plass, x: sted.x, y: sted.y } : rad)) } },
    melding: si(lagret, "Pynten er flyttet.", "Pynten er flytta."),
  };
}

/** Tar bort pynt og gir myntene tilbake. */
function fjernPynt(lagret: Lagret, id: string): { lagret: Lagret; melding: string | null } {
  const rad = (lagret.by.pynt ?? []).find((pynt) => pynt.id === id);
  if (!rad) return { lagret, melding: null };
  return {
    lagret: { ...lagret, mynter: lagret.mynter + (PYNT_PRIS[rad.vare] ?? 0), by: { ...lagret.by, pynt: (lagret.by.pynt ?? []).filter((pynt) => pynt.id !== id) } },
    melding: si(lagret, "Pynten er tatt bort. Du fikk myntene tilbake.", "Pynten er teken bort. Du fekk myntane tilbake."),
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
  const kandidater = avtaleOppgaver(lagret, avtale);
  // Variantene går på omgang fra uke til uke, og typen må være ledig i dag (gj. 10, C2).
  const start = (dagNr(lagret) + avtale.start) % kandidater.length;
  const rekke = [...kandidater.slice(start), ...kandidater.slice(0, start)];
  const valgt = rekke.find((rad) => typeLedig(lagret, rad.type, [], true) && !erSett(lagret, rad, [])) ?? rekke.find((rad) => typeLedig(lagret, rad.type, [], true));
  // Avtalen kan ikke hoppes over. Er tidstypene brukt opp, er spørsmålet om sluttiden en klokkeoppgave.
  const reserve = rekke.find((rad) => rad.valg.every((valg) => valg.klokke !== undefined));
  const annenType = (["les-klokka", "koble"] as const).find((type) => typeLedig(lagret, type));
  const rekkeIDag = dag.typeRekke ?? [];
  const paRad = (type: Oppgave["type"]) => rekkeIDag.length >= 2 && rekkeIDag[rekkeIDag.length - 1] === type && rekkeIDag[rekkeIDag.length - 2] === type;
  const oppgave = valgt ?? (reserve && annenType ? { ...reserve, type: annenType } : (rekke.find((rad) => !paRad(rad.type)) ?? rekke[0]));
  if (!oppgave) return { lagret, melding: null };
  return {
    lagret: vis({ ...lagret, aktivDag: { ...dag, fase: "aktivitet", ko: [oppgave], aktiv: 0, forklaring: null, feil: 0 } }, [oppgave]),
    melding: null,
  };
}

/**
 * Fire spørsmål om en avtale (gj. 10, C2): når slutter den, hvor lenge varer den, når må vi gå for å rekke den,
 * og rekker vi den etter middag. Det siste bare når middagen er før avtalen.
 */
function avtaleOppgaver(lagret: Lagret, avtale: Dagsplan["avtaler"][number]): Oppgave[] {
  const dag = lagret.aktivDag;
  if (!dag) return [];
  const spraak = lagret.innstillinger.spraak;
  const nivaa = lagret.innstillinger.nivaa;
  const id = avtale.aktivitet ?? avtale.navn;
  const ferdig = avtale.start + avtale.varighet;
  const steg = nivaa === "forste" ? 30 : 15;
  const bland = (ledd: number, valg: Valg[]) => stokk(froTilfeldig(lagret.fro * 13 + dag.tid + ledd), valg);
  const felles = {
    ferdighet: "tidsrom" as Ferdighet,
    nokkel: `avtale:${avtale.id}`,
    vare: manglendeDeler(lagret)[0] ?? ("planke" as VareId),
    hvem: visNavn(id, spraak),
    overraskelse: false,
  };
  const Navn = storForbokstavOrd(visBestemt(id, spraak));
  const ut: Oppgave[] = [];
  // 1. Når slutter den?
  const variant = (lagret.fro + Math.floor(dag.tid / 15)) % 3;
  const tider =
    variant === 0
      ? [avtale.start, leggTil(ferdig, 60)]
      : variant === 1
        ? [leggTil(ferdig, steg), leggTil(ferdig, 60)]
        : [avtale.start, ferdig - steg > avtale.start ? ferdig - steg : leggTil(avtale.start, -steg)];
  ut.push({
    ...felles,
    id: `avtale-${avtale.id}-slutt`,
    type: "hvor-lenge",
    mal: `avtale-${id}-1`,
    prompt: aktivitetSporsmal(id, spraak, String(avtale.varighet), nivaa),
    valg: bland(1, [{ id: "rett", klokke: ferdig, tekst: tidTilOrd(ferdig, spraak) }, ...tider.map((tid, indeks) => ({ id: `feil-${indeks}`, klokke: tid, tekst: tidTilOrd(tid, spraak) }))]),
    fasit: "rett",
    maalKlokke: avtale.start,
  });
  // 2. Hvor lenge varer den?
  const varigheter = [avtale.varighet, avtale.varighet + steg, Math.max(steg, avtale.varighet - steg) === avtale.varighet ? avtale.varighet + 2 * steg : Math.max(steg, avtale.varighet - steg)];
  ut.push({
    ...felles,
    id: `avtale-${avtale.id}-lenge`,
    type: "hvor-lenge",
    mal: `avtale-${id}-2`,
    prompt: si(lagret, "{Navn} begynner klokka {start} og slutter klokka {slutt}. Hvor lenge varer det?", "{Navn} byrjar klokka {start} og sluttar klokka {slutt}. Kor lenge varer det?", {
      Navn,
      start: tidTilOrd(avtale.start, spraak),
      slutt: tidTilOrd(ferdig, spraak),
    }),
    valg: bland(2, [...new Set(varigheter)].map((min, indeks) => ({ id: indeks === 0 ? "rett" : `feil-${indeks}`, tekst: varighetTekst(min, spraak) }))),
    fasit: "rett",
    maalKlokke: avtale.start,
    tall: ferdig,
  });
  // 3. Når må vi gå for å rekke den?
  const gang = gangMinutter("hjemme", avtale.sted === "hjemme" || avtale.sted === "" ? "butikk" : (avtale.sted as StedId), nivaa);
  const ga = leggTil(avtale.start, -gang);
  ut.push({
    ...felles,
    id: `avtale-${avtale.id}-ga`,
    type: "rekker-jeg",
    mal: `avtale-${id}-3`,
    prompt: si(lagret, "{Navn} begynner klokka {start}. Det tar {gang} å gå dit. Når må vi gå?", "{Navn} byrjar klokka {start}. Det tek {gang} å gå dit. Når må vi gå?", {
      Navn,
      start: tidTilOrd(avtale.start, spraak),
      gang: varighetTekst(gang, spraak),
    }),
    valg: bland(3, [ga, leggTil(ga, -steg), leggTil(ga, gang)].map((tid, indeks) => ({ id: indeks === 0 ? "rett" : `feil-${indeks}`, klokke: tid, tekst: tidTilOrd(tid, spraak) }))),
    fasit: "rett",
    maalKlokke: avtale.start,
  });
  // 5. Still klokka til når den begynner.
  ut.push({
    ...felles,
    id: `avtale-${avtale.id}-still`,
    type: "still-klokka",
    mal: `avtale-${id}-5`,
    prompt: si(lagret, "{Navn} begynner klokka {start}. Still klokka.", "{Navn} byrjar klokka {start}. Still klokka.", { Navn, start: tidTilOrd(avtale.start, spraak) }),
    valg: [],
    fasit: String(avtale.start),
    maalKlokke: avtale.start,
  });
  // 4. Rekker vi den etter middag?
  const middag = dag.plan.avtaler.find((rad) => rad.slag === "middag");
  if (middag) {
    const middagSlutt = middag.start + middag.varighet;
    const rekker = middagSlutt <= avtale.start;
    ut.push({
      ...felles,
      id: `avtale-${avtale.id}-middag`,
      type: "rekker-jeg",
      mal: `avtale-${id}-4`,
      prompt: si(lagret, "Middagen er ferdig klokka {middag}. {Navn} begynner klokka {start}. Rekker vi det etter middagen?", "Middagen er ferdig klokka {middag}. {Navn} byrjar klokka {start}. Rekk vi det etter middagen?", {
        Navn,
        middag: tidTilOrd(middagSlutt, spraak),
        start: tidTilOrd(avtale.start, spraak),
      }),
      valg: bland(4, [
        { id: "ja", ja: true, tekst: si(lagret, "Ja", "Ja") },
        { id: "nei", ja: false, tekst: si(lagret, "Nei", "Nei") },
      ]),
      fasit: rekker ? "ja" : "nei",
      maalKlokke: middagSlutt,
      tall: avtale.start,
    });
  }
  return ut;
}

function storForbokstavOrd(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

function avslutt(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const skal = dag.plan.avtaler.filter((avtale) => avtale.varighet > 0);
  const avtalerOk = skal.every((avtale) => dag.besokt.includes(avtale.id)) && dag.forSent.length === 0;
  const totalt = dag.svarTotalt ?? 0;
  const forsteOk = totalt > 0 && (dag.forsteRett ?? 0) / totalt >= 0.8;
  const stjerner = (avtalerOk ? 1 : 0) + (forsteOk ? 1 : 0) + (dag.oppdragForste ? 1 : 0);
  const stjerne = avtalerOk && (totalt === 0 || forsteOk);
  const stjerneLinjer = [
    avtalerOk ? `★ ${si(lagret, "Du rakk alt", "Du rakk alt")}` : `☆ ${si(lagret, "Du rakk ikke alt", "Du rakk ikkje alt")}`,
    totalt === 0
      ? `☆ ${si(lagret, "Ingen oppgaver i dag", "Ingen oppgåver i dag")}`
      : `${forsteOk ? "★" : "☆"} ${si(lagret, "{a} av {b} riktige på første forsøk", "{a} av {b} rette på første forsøk", { a: String(dag.forsteRett ?? 0), b: String(totalt) })}`,
    dag.oppdragForste
      ? `★ ${si(lagret, "Oppdraget var riktig på første forsøk", "Oppdraget var rett på første forsøk")}`
      : dag.oppdragGjort
        ? `☆ ${si(lagret, "Oppdraget ble gjort, men ikke på første forsøk.", "Oppdraget vart gjort, men ikkje på første forsøk.")}`
        : `☆ ${si(lagret, "Oppdraget ble ikke gjort", "Oppdraget vart ikkje gjort")}`,
  ].join("\n");
  const nestePlan = dag.morgen?.[0] ?? lagDagsplan(planInn(lagret, nesteDato(lagret.dato)));
  return {
    lagret: {
      ...lagret,
      nestePlan,
      senerePlaner: dag.morgen?.slice(1),
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
