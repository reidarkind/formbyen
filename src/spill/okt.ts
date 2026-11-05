import { maalBygg, manglendeDeler } from "../bygg/handleliste";
import { ferdigeBygg, kanPlassere, nesteHjem, omraderForNivaa } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { lagDagsplan, nesteDato, utvidRytme } from "../dag/plan";
import { froTilfeldig } from "../felles/tilfeldig";
import { forklaring } from "../oppgaver/forklaring";
import { likOppgave, trekkOppgave, type OppgaveKontekst } from "../oppgaver/lag";
import { sjekkSvar } from "../oppgaver/sjekk";
import { registrerSvar } from "../tilpasning/mestring";
import { erApen, leggTil, tidTilDigital24, tidTilOrd } from "../tid/tid";
import { visNavn } from "../dag/aktiviteter";
import { tegnKart } from "../grafikk/bygg-svg";
import { mal, navnBygg, navnVare } from "../tekst/ordbok";
import { ukedagTekst } from "../tekst/spraak";
import type { AktivDag, ByggId, Ferdighet, Hylle, Lagret, Nivaa, Oppgave, Spraak, StedId, VareId } from "../typer";
import { gangMinutter, ventMaalTid } from "./anbefaling";

export type Handling =
  | { slag: "start" }
  | { slag: "ga"; sted: StedId }
  | { slag: "vent" }
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
  return sted === "aktivitet";
}

/** Avtalen som pågår der barnet står. Middag møtes ved å være hjemme. */
export function aktuellAvtale(lagret: Lagret) {
  const dag = lagret.aktivDag;
  if (!dag) return null;
  return (
    dag.plan.avtaler.find(
      (avtale) =>
        avtale.slag !== "middag" &&
        avtale.varighet > 0 &&
        !dag.besokt.includes(avtale.id) &&
        !dag.forSent.includes(avtale.id) &&
        dag.tid >= avtale.start - 15 &&
        dag.tid <= avtale.start + 15 &&
        stedPasser(dag.sted, avtale.sted),
    ) ?? null
  );
}

function merkTid(lagret: Lagret, tid: number): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) return lagret;
  const besokt = [...dag.besokt];
  const forSent = [...dag.forSent];
  const viste = [...dag.visteForSent];
  let melding = dag.melding;
  for (const avtale of dag.plan.avtaler) {
    if (avtale.varighet <= 0 || besokt.includes(avtale.id) || forSent.includes(avtale.id)) continue;
    const vinduStart = avtale.start - 15;
    const vinduSlutt = avtale.start + 15;
    const middagHjemme = avtale.slag === "middag" && dag.sted === "hjemme" && dag.tid <= vinduSlutt && tid >= vinduStart;
    if (middagHjemme) {
      besokt.push(avtale.id);
      continue;
    }
    if (tid > avtale.start + 15) {
      forSent.push(avtale.id);
      if (!viste.includes(avtale.id)) {
        viste.push(avtale.id);
        melding =
          avtale.slag === "middag"
            ? si(lagret, "Vi spiste klokka {a}, nå er den {b}.", "Vi åt klokka {a}, no er den {b}.", {
                a: tidTilOrd(avtale.start, lagret.innstillinger.spraak),
                b: tidTilOrd(tid, lagret.innstillinger.spraak),
              })
            : si(lagret, "{navn} har begynt. Du kan likevel komme.", "{navn} har begynt. Du kan likevel kome.", {
                navn: visNavn(avtale.aktivitet ?? avtale.navn, lagret.innstillinger.spraak),
              });
      }
    }
  }
  return {
    ...lagret,
    aktivDag: { ...dag, tid, besokt, forSent, visteForSent: viste, melding },
  };
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
  if (dag.tid >= butikk.stenger) return si(lagret, "Stengt nå. Åpner i morgen.", "Stengt no. Opnar i morgon.");
  return si(lagret, "Butikken er åpen.", "Butikken er open.");
}

function dorOppgave(lagret: Lagret): Oppgave {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("ingen dag");
  const apen = erApen(dag.tid, dag.plan.butikk);
  return {
    id: `dor-${dag.tid}`,
    type: "apningstider",
    mal: "apen-1",
    ferdighet: "hele-timer",
    prompt: si(lagret, "Er butikken åpen nå? Klokka er {naa}.", "Er butikken open no? Klokka er {naa}.", {
      naa: tidTilOrd(dag.tid, lagret.innstillinger.spraak),
    }),
    nokkel: `klokke:${dag.tid}`,
    valg: [
      { id: "ja", ja: true, tekst: si(lagret, "Åpen", "Open") },
      { id: "nei", ja: false, tekst: si(lagret, "Stengt", "Stengt") },
    ],
    fasit: apen ? "ja" : "nei",
    vare: "dor-rektangel",
    hvem: si(lagret, "skiltet", "skiltet"),
    overraskelse: false,
    maalKlokke: dag.plan.butikk.apner,
    tall: dag.plan.butikk.stenger,
  };
}

export function hylleForNivaa(nivaa: Nivaa, indeks: number): Hylle {
  if (nivaa === "forste") return indeks % 4 === 2 ? "kloss" : "form";
  const hyller: Hylle[] = ["form", "kloss", "mal", "vekt"];
  return hyller[indeks % hyller.length] ?? "form";
}

function hylleFor(lagret: Lagret, indeks: number): Hylle {
  return hylleForNivaa(lagret.innstillinger.nivaa, indeks);
}

function giVare(lagret: Lagret, vare: VareId, antall = 1): Lagret {
  const har = lagret.kurv[vare] ?? 0;
  return { ...lagret, kurv: { ...lagret.kurv, [vare]: har + antall }, mynter: lagret.mynter + 2 };
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
  if (oppgave.form && !former.includes(oppgave.form)) former.push(oppgave.form);
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
  if (handling.slag === "vent") return vent(lagret);
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
  return avslutt(lagret);
}

function startDag(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  if (lagret.aktivDag) return { lagret, melding: null };
  const plan = lagDagsplan({
    fro: lagret.fro,
    dato: lagret.dato,
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  });
  const dag: AktivDag = {
    plan,
    tid: plan.start,
    sted: "hjemme",
    fase: "ute",
    ko: [],
    aktiv: 0,
    forklaring: null,
    besokt: [],
    forSent: [],
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
  const tid = leggTil(dag.tid, gangMinutter(dag.sted, sted));
  let neste = merkTid({ ...lagret, aktivDag: { ...dag, sted, fase: "ute", ko: [], aktiv: 0, forklaring: null } }, tid);
  if (tid >= dag.plan.leggetid) return avslutt(neste);
  const tekst = neste.aktivDag?.melding ?? null;
  if (tekst && neste.aktivDag) neste = { ...neste, aktivDag: { ...neste.aktivDag, melding: null } };
  return { lagret: neste, melding: tekst };
}

function vent(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const maal = ventMaalTid(lagret);
  const tid = maal ?? leggTil(dag.tid, 30);
  let neste = merkTid(lagret, tid);
  if (tid >= dag.plan.leggetid) return avslutt(neste);
  const tekst = neste.aktivDag?.melding ?? null;
  if (tekst && neste.aktivDag) neste = { ...neste, aktivDag: { ...neste.aktivDag, melding: null } };
  return { lagret: neste, melding: tekst };
}

function dor(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.sted !== "butikk") return { lagret, melding: si(lagret, "Gå til butikken først.", "Gå til butikken først.") };
  const oppgave = dorOppgave(lagret);
  return {
    lagret: huskOppgave(
      { ...lagret, aktivDag: { ...dag, fase: "dor", ko: [oppgave], aktiv: 0, forklaring: null } },
      oppgave,
    ),
    melding: null,
  };
}

function handle(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag || dag.sted !== "butikk") return { lagret, melding: null };
  if (!dag.dorLest) return dor(lagret);
  if (dag.handlet) return { lagret, melding: si(lagret, "Du har handlet i dag.", "Du har handla i dag.") };
  if (!erApen(dag.tid, dag.plan.butikk)) return { lagret, melding: apningTekst(lagret) };
  const ko: Oppgave[] = [];
  let arbeide = lagret;
  for (let i = 0; i < 3; i++) {
    const oppgave = trekkOppgave({ ...kontekst(arbeide), hylle: hylleFor(lagret, i) });
    ko.push(oppgave);
    arbeide = huskOppgave(arbeide, oppgave);
  }
  return {
    lagret: { ...arbeide, aktivDag: { ...dag, fase: "handel", ko, aktiv: 0, forklaring: null, melding: null } },
    melding: null,
  };
}

function svar(lagret: Lagret, gitt: string): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  const riktig = sjekkSvar(oppgave, gitt);
  let neste = oppdaterMestring(lagret, oppgave, riktig);
  if (!riktig) {
    const feil = (dag.feil ?? 0) + 1;
    const tekst = forklaring(oppgave, gitt, lagret.innstillinger.spraak);
    return {
      lagret: { ...neste, aktivDag: { ...dag, forklaring: tekst, fase: "forklaring", feil, melding: null } },
      melding: null,
    };
  }
  const erDor = dag.fase === "dor" || (dag.fase === "forklaring" && dag.ko.length === 1 && dag.ko[0]?.type === "apningstider");
  const erAktivitet = dag.fase === "aktivitet" || oppgave.nokkel.startsWith("avtale:");
  if (erDor) {
    const dagEtter = neste.aktivDag ?? dag;
    const medDor = { ...neste, aktivDag: { ...dagEtter, dorLest: true, fase: "ute" as const, ko: [], forklaring: null, feil: 0 } };
    return { lagret: medDor, melding: apningTekst(medDor) };
  }
  let fikkEkstra = false;
  if (!erAktivitet) {
    const manglet = manglendeDeler(neste)[0];
    const vare = manglet ?? oppgave.vare;
    fikkEkstra = !manglet;
    neste = noter(giVare(neste, vare), oppgave);
  } else {
    neste = noter(neste, oppgave);
  }
  const dagEtter = neste.aktivDag ?? dag;
  const aktiv = dag.aktiv + 1;
  if (aktiv >= dag.ko.length) {
    const avtaleId = oppgave.nokkel.startsWith("avtale:") ? oppgave.nokkel.slice("avtale:".length) : "";
    const aktuell = dag.plan.avtaler.find((rad) => rad.id === avtaleId);
    const tid = leggTil(dag.tid, erAktivitet ? (aktuell?.varighet ?? 0) : 30);
    let etter = merkTid(
      {
        ...neste,
        aktivDag: { ...dagEtter, tid: dag.tid, fase: "ute", ko: [], handlet: !erAktivitet || dag.handlet, forklaring: null, feil: 0 },
      },
      tid,
    );
    if (erAktivitet && aktuell && etter.aktivDag) {
      const sent = etter.aktivDag.tid > aktuell.start + 15;
      etter = {
        ...etter,
        aktivDag: {
          ...etter.aktivDag,
          besokt: [...etter.aktivDag.besokt, aktuell.id],
          forSent: sent ? etter.aktivDag.forSent.filter((rad) => rad !== aktuell.id) : etter.aktivDag.forSent,
        },
      };
    }
    if (tid >= dag.plan.leggetid) return avslutt(etter);
    if (!erAktivitet && manglendeDeler(etter).length === 0) {
      const maal = maalBygg(etter);
      return {
        lagret: etter,
        melding: si(etter, "Da har du alt til {bygg}!", "Då har du alt til {bygg}!", {
          bygg: maal ? byggISetning(maal.id, etter.innstillinger.spraak) : si(etter, "bygget", "bygget"),
        }),
      };
    }
    if (!erAktivitet && fikkEkstra) {
      return {
        lagret: etter,
        melding: si(etter, "Du fikk {vare}.", "Du fekk {vare}.", { vare: navnVare(oppgave.vare, etter.innstillinger.spraak) }),
      };
    }
    return { lagret: etter, melding: null };
  }
  return {
    lagret: { ...neste, aktivDag: { ...dagEtter, aktiv, forklaring: null, feil: 0, fase: dag.fase === "forklaring" ? "handel" : dag.fase } },
    melding: null,
  };
}

function byggISetning(id: string, spraak: Spraak): string {
  const ledd: Record<string, [string, string]> = {
    bronn: ["brønnen", "brønnen"],
    gjerde: ["gjerdet", "gjerdet"],
    vedskjul: ["vedskjulet", "vedskjulet"],
    hytte: ["hytta", "hytta"],
    hus: ["huset", "huset"],
    ronne: ["rønna", "rønna"],
    slott: ["slottet", "slottet"],
  };
  const par = ledd[id] ?? ["bygget", "bygget"];
  return navnBygg(id, spraak, par[0], par[1]);
}

function hoppOver(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (!dag || !oppgave) return { lagret, melding: null };
  if (dag.fase === "dor" || oppgave.type === "apningstider") {
    const medDor = { ...lagret, aktivDag: { ...dag, dorLest: true, fase: "ute" as const, ko: [], forklaring: null, feil: 0 } };
    return { lagret: medDor, melding: apningTekst(medDor) };
  }
  const aktiv = dag.aktiv + 1;
  if (aktiv >= dag.ko.length) {
    return {
      lagret: { ...lagret, aktivDag: { ...dag, fase: "ute", ko: [], forklaring: null, feil: 0 } },
      melding: si(lagret, "Vi øver mer på den senere.", "Vi øver meir på den seinare."),
    };
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
  const ny = likOppgave(oppgave, kontekst(lagret));
  const ko = dag.ko.map((rad, indeks) => (indeks === dag.aktiv ? ny : rad));
  return {
    lagret: huskOppgave({ ...lagret, aktivDag: { ...dag, ko, forklaring: null, fase: dag.ko.length === 1 && ny.type === "apningstider" ? "dor" : dag.fase === "forklaring" ? "handel" : dag.fase } }, ny),
    melding: null,
  };
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
  const tid = leggTil(dag.tid, 15);
  const byggetIDag = ferdig ? [...dag.byggetIDag, plassert.bygg] : dag.byggetIDag;
  let neste = merkTid({ ...uten, by, ukerytme, album, aktivDag: { ...dag, byggetIDag, sted: "byggeplass" } }, tid);
  if (tid >= dag.plan.leggetid) return avslutt(neste);
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

function mot(lagret: Lagret): { lagret: Lagret; melding: string | null } {
  const dag = lagret.aktivDag;
  if (!dag) return { lagret, melding: null };
  const avtale = aktuellAvtale(lagret);
  if (!avtale) return { lagret, melding: si(lagret, "Det er ingen avtale nå.", "Det er inga avtale no.") };
  const ferdig = avtale.start + avtale.varighet;
  const spraak = lagret.innstillinger.spraak;
  const oppgave: Oppgave = {
    id: `avtale-${avtale.id}`,
    type: "hvor-lenge",
    mal: "lenge-1",
    ferdighet: "tidsrom",
    prompt: si(lagret, "{navn} varer {min} minutter. Når er den ferdig?", "{navn} varer {min} minutt. Når er den ferdig?", {
      navn: visNavn(avtale.aktivitet ?? avtale.navn, spraak),
      min: String(avtale.varighet),
    }),
    nokkel: `avtale:${avtale.id}`,
    valg: [
      { id: "rett", klokke: ferdig, tekst: tidTilOrd(ferdig, spraak) },
      { id: "tidlig", klokke: avtale.start, tekst: tidTilOrd(avtale.start, spraak) },
      { id: "sent", klokke: leggTil(ferdig, 60), tekst: tidTilOrd(leggTil(ferdig, 60), spraak) },
    ],
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
  const kurv = { ...lagret.kurv };
  if (stjerne) kurv["pynt-blomst"] = (kurv["pynt-blomst"] ?? 0) + 1;
  return {
    lagret: {
      ...lagret,
      kurv,
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
        },
      ],
    },
    melding: stjerne
      ? si(lagret, "Du rakk alt. En stjerne i dagboka!", "Du rakk alt. Ei stjerne i dagboka!")
      : si(lagret, "Dagen er slutt. Byen står der i morgen.", "Dagen er slutt. Byen står der i morgon."),
  };
}
