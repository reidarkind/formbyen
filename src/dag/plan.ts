import { froTilfeldig, heltall, trekk, type Tilfeldig } from "../felles/tilfeldig";
import { gangMinutter } from "../spill/anbefaling";
import type { ByggId, Dagsplan, Dato, FastAvtale, Nivaa, Spraak, StedId, Ukedag, Avtale, Arstid } from "../typer";
import { apneAktiviteter, SKOLEFAG, type Aktivitet } from "./aktiviteter";

export const STARTDATO: Dato = { aar: 2026, maned: 8, dag: 17 };

const UKEDAGER: Ukedag[] = ["sondag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lordag"];
const MANEDER = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function skuddar(aar: number): boolean {
  return (aar % 4 === 0 && aar % 100 !== 0) || aar % 400 === 0;
}

export function dagerIManed(aar: number, maned: number): number {
  if (maned === 2 && skuddar(aar)) return 29;
  return MANEDER[maned - 1] ?? 30;
}

export function nesteDato(dato: Dato): Dato {
  if (dato.dag < dagerIManed(dato.aar, dato.maned)) {
    return { ...dato, dag: dato.dag + 1 };
  }
  if (dato.maned === 12) return { aar: dato.aar + 1, maned: 1, dag: 1 };
  return { aar: dato.aar, maned: dato.maned + 1, dag: 1 };
}

export function ukedagFor(dato: Dato): Ukedag {
  const indeks = new Date(Date.UTC(dato.aar, dato.maned - 1, dato.dag)).getUTCDay();
  return UKEDAGER[indeks] ?? "mandag";
}

export function arstidFor(maned: number): Arstid {
  if (maned === 12 || maned <= 2) return "vinter";
  if (maned <= 5) return "var";
  if (maned <= 8) return "sommer";
  return "host";
}

export function erFerie(dato: Dato): boolean {
  if (dato.maned === 5 && dato.dag === 17) return true;
  if (dato.maned === 7) return true;
  if (dato.maned === 6 && dato.dag >= 20) return true;
  if (dato.maned === 8 && dato.dag < 15) return true;
  if (dato.maned === 12 && dato.dag >= 20) return true;
  return false;
}

export function hoytidFor(dato: Dato): string | undefined {
  if (dato.maned === 5 && dato.dag === 17) return "17. mai";
  if (dato.maned === 12 && dato.dag >= 24) return "jul";
  return undefined;
}

export interface PlanInn {
  fro: number;
  dato: Dato;
  nivaa: Nivaa;
  spraak: Spraak;
  ferdige: readonly ByggId[];
  ukerytme: readonly FastAvtale[];
  fasteAvtaler: readonly FastAvtale[];
  siste: readonly string[];
  bursdager: readonly { maned: number; dag: number; hvem: string }[];
}

/** Rammen bruker hele og halve timer i 1. klasse, kvarter i 2. klasse, og 5-minutter på utfordrende. */
export function planMinutter(nivaa: Nivaa): number[] {
  if (nivaa === "forste") return [0, 30];
  if (nivaa === "andre") return [0, 15, 30, 45];
  return [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
}

function passerMinutt(verdi: number, lovlige: readonly number[]): boolean {
  return lovlige.includes(verdi % 60);
}

function velgTid(tilfeldig: Tilfeldig, kandidater: number[], lovlige: readonly number[]): number {
  const bruk = kandidater.filter((verdi) => passerMinutt(verdi, lovlige));
  return trekk(tilfeldig, bruk.length ? bruk : kandidater.filter((verdi) => verdi % 30 === 0));
}

function somSted(sted: string): StedId {
  if (
    sted === "butikk" ||
    sted === "torg" ||
    sted === "tannlege" ||
    sted === "svommehall" ||
    sted === "byggeplass" ||
    sted === "aktivitet" ||
    sted === "hjemme" ||
    sted === "barnehage"
  ) {
    return sted;
  }
  return "aktivitet";
}

function rekkerGange(avtaler: Avtale[], nivaa: Nivaa): boolean {
  const opptatt = avtaler.filter((avtale) => avtale.varighet > 0).sort((a, b) => a.start - b.start);
  for (let i = 1; i < opptatt.length; i++) {
    const fra = opptatt[i - 1];
    const til = opptatt[i];
    if (!fra || !til || fra.sted === til.sted) continue;
    const gap = til.start - (fra.start + fra.varighet);
    if (gap < gangMinutter(somSted(fra.sted), somSted(til.sted), nivaa)) return false;
  }
  return true;
}

function overlapper(avtaler: Avtale[]): boolean {
  const opptatt = avtaler
    .filter((avtale) => avtale.varighet > 0)
    .map((avtale) => ({ start: avtale.start, slutt: avtale.start + avtale.varighet }))
    .sort((a, b) => a.start - b.start);
  for (let i = 1; i < opptatt.length; i++) {
    if ((opptatt[i]?.start ?? 0) < (opptatt[i - 1]?.slutt ?? 0)) return true;
  }
  return false;
}

export function harReeltValg(plan: Pick<Dagsplan, "start" | "avtaler" | "leggetid">): boolean {
  const opptatt = plan.avtaler.filter((avtale) => avtale.varighet > 0).sort((a, b) => a.start - b.start);
  let forrige = plan.start;
  for (const avtale of opptatt) {
    const gap = avtale.start - forrige;
    if (gap === 15 || gap === 30 || gap === 45) return true;
    forrige = avtale.start + avtale.varighet;
  }
  const motSeng = plan.leggetid - forrige;
  return motSeng === 15 || motSeng === 30 || motSeng === 45;
}

function nokkelFor(plan: Omit<Dagsplan, "nokkel">): string {
  return [
    plan.ukedag,
    plan.dato.maned,
    plan.dato.dag,
    plan.skoleslutt ?? "-",
    plan.butikk.apner,
    plan.butikk.stenger,
    plan.butikk.stengtFra ?? "-",
    plan.leggetid,
    ...plan.avtaler.map((avtale) => `${avtale.id}@${avtale.start}`),
  ].join("|");
}

function ledig(avtaler: Avtale[], start: number, varighet: number): boolean {
  return !overlapper([...avtaler, { id: "test", slag: "hjemme", navn: "", start, varighet, sted: "" }]);
}

export function lagStartRytme(): FastAvtale[] {
  return [
    { aktivitet: "hund", ukedag: "tirsdag", start: 17 * 60 },
    { aktivitet: "lekser", ukedag: "torsdag", start: 16 * 60 + 30 },
  ];
}

export function utvidRytme(rytme: readonly FastAvtale[], ferdige: readonly ByggId[], fro: number): FastAvtale[] {
  const har = new Set(rytme.map((rad) => rad.aktivitet));
  const kandidat = apneAktiviteter(ferdige, true).find((aktivitet) => aktivitet.krever && !har.has(aktivitet.id));
  if (!kandidat) return [...rytme];
  const brukte = new Set(rytme.map((rad) => rad.ukedag));
  const ledige = (["mandag", "tirsdag", "onsdag", "torsdag", "fredag"] as Ukedag[]).filter((dag) => !brukte.has(dag));
  if (ledige.length === 0) return [...rytme];
  const dag = ledige[Math.abs(fro) % ledige.length] ?? "onsdag";
  return [...rytme, { aktivitet: kandidat.id, ukedag: dag, start: 18 * 60 }];
}

function byggPlan(inn: PlanInn, tilfeldig: Tilfeldig): Dagsplan | null {
  const lovlige = planMinutter(inn.nivaa);
  const ukedag = ukedagFor(inn.dato);
  const arstid = arstidFor(inn.dato.maned);
  const ferie = erFerie(inn.dato);
  const skole = !ferie && ukedag !== "lordag" && ukedag !== "sondag";
  const skoleslutt = skole
    ? velgTid(tilfeldig, [12 * 60, 12 * 60 + 30, 13 * 60 + 30, 14 * 60, 14 * 60 + 15], lovlige)
    : null;
  const start = skoleslutt ?? (ukedag === "sondag" ? 11 * 60 : 10 * 60);
  const leggetid = velgTid(tilfeldig, [19 * 60 + 30, 19 * 60 + 45, 20 * 60, 20 * 60 + 15, 20 * 60 + 30], lovlige);

  let butikk: Dagsplan["butikk"];
  if (ukedag === "sondag") {
    butikk = { apner: 14 * 60, stenger: 14 * 60, stengtHele: true };
  } else if (ukedag === "lordag") {
    const apner = velgTid(tilfeldig, [10 * 60, 11 * 60], lovlige);
    const stenger = velgTid(tilfeldig, [14 * 60, 15 * 60], lovlige);
    butikk = { apner, stenger: Math.max(stenger, apner + 60), stengtHele: false };
  } else {
    const apner = velgTid(tilfeldig, [13 * 60 + 30, 14 * 60, 14 * 60 + 30], lovlige);
    const stenger = velgTid(tilfeldig, [16 * 60 + 30, 17 * 60, 17 * 60 + 30], lovlige);
    butikk = { apner, stenger: Math.max(stenger, apner + 60), stengtHele: false };
    const fra = velgTid(tilfeldig, [15 * 60, 15 * 60 + 30], lovlige);
    if (fra > butikk.apner && fra + 30 < butikk.stenger) {
      butikk = { ...butikk, stengtFra: fra, stengtTil: fra + 30 };
    }
  }

  const avtaler: Avtale[] = [];
  const middagKandidater: number[] = [];
  for (let tid = 16 * 60; tid <= 17 * 60 + 30; tid += 15) {
    if (passerMinutt(tid, lovlige) && tid >= start + 15 && tid + 30 < leggetid) middagKandidater.push(tid);
  }
  if (middagKandidater.length === 0) return null;
  const middagStart = trekk(tilfeldig, middagKandidater);
  avtaler.push({
    id: "middag",
    slag: "middag",
    navn: "middag",
    aktivitet: "middag",
    start: middagStart,
    varighet: 30,
    sted: "hjemme",
  });

  const bursdag = inn.bursdager.find((rad) => rad.maned === inn.dato.maned && rad.dag === inn.dato.dag);
  if (bursdag && ledig(avtaler, 15 * 60, 60)) {
    avtaler.push({
      id: "bursdag",
      slag: "hjemme",
      navn: "bursdag",
      aktivitet: "bursdag",
      start: 15 * 60,
      varighet: 60,
      sted: "hjemme",
    });
  }

  const sfo = skole && tilfeldig() < 0.35 ? velgTid(tilfeldig, [15 * 60 + 30, 16 * 60], lovlige) : null;

  const rytme = inn.fasteAvtaler.length ? inn.fasteAvtaler : inn.ukerytme;
  const vinter = arstid === "vinter";
  const apne = apneAktiviteter(inn.ferdige, vinter);
  const avvik = tilfeldig();
  for (const fast of rytme) {
    if (fast.ukedag !== ukedag) continue;
    if (avvik < 0.12) continue;
    const meta = apne.find((aktivitet) => aktivitet.id === fast.aktivitet);
    if (!meta) continue;
    let startTid = fast.start;
    if (!passerMinutt(startTid, lovlige)) startTid = startTid - (startTid % 30);
    if (!ledig(avtaler, startTid, meta.varighet) || startTid + meta.varighet > leggetid) continue;
    if (!rekkerHjemFor(meta, startTid, leggetid, inn.nivaa)) continue;
    if (forMangeHjemme(avtaler, meta)) continue;
    avtaler.push(avtaleFra(meta, startTid));
  }

  const hjemmevalg = apne.filter((aktivitet) => !aktivitet.krever && !avtaler.some((a) => a.aktivitet === aktivitet.id));
  const maal = 2 + heltall(tilfeldig, 0, 2);
  let vakt = 0;
  while (avtaler.filter((avtale) => avtale.slag !== "hendelse").length < maal && vakt < 8) {
    vakt += 1;
    const meta = trekk(tilfeldig, hjemmevalg.length ? hjemmevalg : apne);
    const varighet = meta.varighet;
    const tidlig = sfo !== null ? sfo + 60 : start + 90;
    const sen = leggetid - varighet;
    if (sen <= tidlig) break;
    const tider = Array.from({ length: Math.floor((sen - tidlig) / 15) + 1 }, (_, i) => tidlig + i * 15).filter(
      (verdi) => passerMinutt(verdi, lovlige),
    );
    if (tider.length === 0) break;
    const startTid = trekk(tilfeldig, tider);
    if (!ledig(avtaler, startTid, varighet)) continue;
    if (avtaler.some((avtale) => avtale.aktivitet === meta.id)) continue;
    if (!rekkerHjemFor(meta, startTid, leggetid, inn.nivaa)) continue;
    if (forMangeHjemme(avtaler, meta)) continue;
    avtaler.push(avtaleFra(meta, startTid));
  }

  avtaler.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id, "nb"));
  const antall = avtaler.filter((avtale) => avtale.varighet > 0).length;
  if (antall < 2 || antall > 4) return null;
  if (overlapper(avtaler)) return null;
  if (!rekkerGange(avtaler, inn.nivaa)) return null;
  if (
    sfo !== null &&
    avtaler.some((avtale) => avtale.varighet > 0 && avtale.start < sfo + 60 && sfo < avtale.start + avtale.varighet)
  ) {
    return null;
  }

  const utkast = {
    dato: inn.dato,
    ukedag,
    arstid,
    hoytid: hoytidFor(inn.dato),
    bursdag: bursdag?.hvem,
    skoleslutt,
    sisteTime: skole ? trekk(tilfeldig, SKOLEFAG) : null,
    sfo,
    butikk,
    avtaler,
    leggetid,
    start,
  };
  if (!harReeltValg(utkast)) return null;
  const nokkel = nokkelFor(utkast);
  if (inn.siste.includes(nokkel)) return null;
  return { ...utkast, nokkel };
}

const PAA_TORGET = new Set(["dans", "speider", "sjakk", "ski", "skoyter"]);

export function stedForAktivitet(id: string, krever: string | null): string {
  if (id === "tannlege") return "tannlege";
  if (id === "svomming") return "svommehall";
  if (id === "lillesoster") return "barnehage";
  if (krever) return krever;
  if (PAA_TORGET.has(id)) return "torg";
  return "hjemme";
}

function rekkerHjemFor(meta: Aktivitet, startTid: number, leggetid: number, nivaa: Nivaa): boolean {
  const sted = stedForAktivitet(meta.id, meta.krever);
  if (sted === "hjemme") return startTid + meta.varighet < leggetid - 15;
  const gang = gangMinutter(somSted(sted), "hjemme", nivaa);
  return startTid + meta.varighet + gang < leggetid - 15;
}

function forMangeHjemme(avtaler: Avtale[], meta: Aktivitet): boolean {
  const sted = stedForAktivitet(meta.id, meta.krever);
  if (sted !== "hjemme") return false;
  const hjemme = avtaler.filter((avtale) => avtale.sted === "hjemme" && avtale.slag !== "middag" && avtale.varighet > 0);
  return hjemme.length >= 2;
}

function avtaleFra(meta: Aktivitet, start: number): Avtale {
  const sted = stedForAktivitet(meta.id, meta.krever);
  return {
    id: `${meta.id}-${start}`,
    slag: sted === "hjemme" ? "hjemme" : "fritid",
    navn: meta.id,
    start,
    varighet: meta.varighet,
    sted,
    aktivitet: meta.id,
  };
}

export function lagDagsplan(inn: PlanInn): Dagsplan {
  const tilfeldig = froTilfeldig(inn.fro);
  for (let forsok = 0; forsok < 80; forsok++) {
    const plan = byggPlan(inn, tilfeldig);
    if (plan) return plan;
  }
  const nod = byggNodplan(inn);
  return nod;
}

function byggNodplan(inn: PlanInn): Dagsplan {
  const ukedag = ukedagFor(inn.dato);
  const start = 13 * 60 + 30;
  const avtaler: Avtale[] = [
    {
      id: "middag",
      slag: "middag",
      navn: "middag",
      aktivitet: "middag",
      start: 16 * 60 + 30,
      varighet: 30,
      sted: "hjemme",
    },
    {
      id: "hund-nod",
      slag: "hjemme",
      navn: "hund",
      start: 17 * 60 + 30,
      varighet: 30,
      sted: "hjemme",
      aktivitet: "hund",
    },
  ];
  const utkast = {
    dato: inn.dato,
    ukedag,
    arstid: arstidFor(inn.dato.maned),
    hoytid: hoytidFor(inn.dato),
    skoleslutt: ukedag === "lordag" || ukedag === "sondag" || erFerie(inn.dato) ? null : start,
    sisteTime: null,
    sfo: null,
    butikk:
      ukedag === "sondag"
        ? { apner: 14 * 60, stenger: 14 * 60, stengtHele: true }
        : { apner: 14 * 60, stenger: 17 * 60, stengtHele: false },
    avtaler,
    leggetid: 20 * 60,
    start,
  };
  return { ...utkast, nokkel: `${nokkelFor(utkast)}|${inn.fro}` };
}

/** Åpningstid på neste dag som butikken er åpen, regnet med frøet dagen faktisk bruker. */
export function morgendagensApning(inn: PlanInn): number {
  let dato = inn.dato;
  let fro = inn.fro;
  for (let i = 0; i < 3; i++) {
    dato = nesteDato(dato);
    const plan = lagDagsplan({ ...inn, fro, dato });
    if (!plan.butikk.stengtHele) return plan.butikk.apner;
    fro += 1;
  }
  return 14 * 60;
}
