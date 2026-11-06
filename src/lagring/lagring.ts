import { lagStartRytme, STARTDATO } from "../dag/plan";
import type {
  AktivDag,
  ByggId,
  ByTilstand,
  Dagsplan,
  Innstillinger,
  Lagret,
  NokkelLager,
  PlassertBygg,
  PyntPlassert,
  Spraak,
  VareId,
} from "../typer";
import { erSpraak } from "../typer";

export const NOKKEL = "formbyen-v1";

/** Prisene da pynten tok hele ruter. Brukes når gammel pynt gjøres om til mynter. */
const PYNT_PRIS_GAMMEL: Record<string, number> = { "pynt-blomst": 2, "pynt-flagg": 3, "pynt-lykt": 4, "pynt-benk": 5 };

const BYGG_ID = new Set<ByggId>([
  "ronne", "hytte", "hus", "villa", "borg", "slott", "bronn", "gjerde", "vedskjul", "bakeri", "lekeplass", "bro",
  "skole", "idrettshall", "korpslokale", "musikkskole", "bibliotek", "togstasjon", "kirke", "vanntaarn", "fyrtarn",
  "ringmur", "park", "festplass", "klokketarn",
]);

export function standardLagret(): Lagret {
  return {
    versjon: 1,
    innstillinger: {
      nivaa: "forste",
      spraak: "nb",
      lydPa: false,
      figur: 0,
      kjaeledyr: "hund",
      skjulDigital: false,
      tidsromPa: true,
      rekordlistePa: false,
      fasteAvtaler: [],
    },
    mestring: {},
    mynter: 0,
    kurv: {},
    by: {
      nivaa: 1,
      bygg: [
        {
          instans: "hjem-1",
          bygg: "ronne",
          x: 2,
          y: 4,
          steg: 4,
          ferdig: true,
          uthus: false,
          frie: [],
          pynt: [],
        },
      ],
      rotasjon: 0,
      skala: 1,
      panX: 0,
      panY: 0,
      monsterFullfort: 0,
      kjente3d: [],
      besteKlokkePaRad: 0,
      klokkePaRad: 0,
      dagerAlleAvtaler: 0,
      omrader: ["dalen"],
    },
    dato: { ...STARTDATO },
    ukerytme: lagStartRytme(),
    bursdager: [{ maned: 6, dag: 12, hvem: "deg" }],
    sistePlaner: [],
    sisteMaler: [],
    sisteNokkel: "",
    dagbok: [],
    album: [],
    demoSett: [],
    aktivDag: null,
    startet: false,
    fro: 1,
  };
}

function erObjekt(verdi: unknown): verdi is Record<string, unknown> {
  return typeof verdi === "object" && verdi !== null;
}

function lesBygg(verdi: unknown): PlassertBygg | null {
  if (!erObjekt(verdi)) return null;
  if (typeof verdi.instans !== "string" || typeof verdi.bygg !== "string" || !BYGG_ID.has(verdi.bygg as ByggId)) return null;
  if (typeof verdi.x !== "number" || typeof verdi.y !== "number") return null;
  return {
    instans: verdi.instans,
    bygg: verdi.bygg as ByggId,
    x: verdi.x,
    y: verdi.y,
    steg: typeof verdi.steg === "number" ? verdi.steg : 0,
    ferdig: verdi.ferdig === true,
    uthus: verdi.uthus === true,
    frie: [],
    pynt: Array.isArray(verdi.pynt) ? verdi.pynt.filter((pynt): pynt is VareId => typeof pynt === "string") : [],
  };
}

function lesInnstillinger(verdi: unknown, standard: Innstillinger): Innstillinger {
  if (!erObjekt(verdi)) return standard;
  const nivaa = verdi.nivaa;
  const spraak = typeof verdi.spraak === "string" && erSpraak(verdi.spraak) ? verdi.spraak : "nb";
  const figur = verdi.figur === 1 || verdi.figur === 2 || verdi.figur === 3 ? verdi.figur : 0;
  const kjaeledyr = verdi.kjaeledyr === "katt" || verdi.kjaeledyr === "kanin" ? verdi.kjaeledyr : "hund";
  return {
    nivaa: nivaa === "andre" || nivaa === "utfordrende" || nivaa === "blandet" ? nivaa : "forste",
    spraak: spraak as Spraak,
    lydPa: verdi.lydPa === true,
    figur,
    kjaeledyr,
    skjulDigital: verdi.skjulDigital === true,
    tidsromPa: verdi.tidsromPa !== false,
    rekordlistePa: verdi.rekordlistePa === true,
    fasteAvtaler: Array.isArray(verdi.fasteAvtaler) ? (verdi.fasteAvtaler as Innstillinger["fasteAvtaler"]) : [],
  };
}

export function normaliserLagret(raa: unknown): Lagret | null {
  if (!erObjekt(raa)) return null;
  const standard = standardLagret();
  const bygg = Array.isArray(raa.by && (raa.by as ByTilstand).bygg ? (raa.by as ByTilstand).bygg : raa.bygg)
    ? ((erObjekt(raa.by) && Array.isArray(raa.by.bygg) ? raa.by.bygg : []) as unknown[])
        .map(lesBygg)
        .filter((bygg): bygg is PlassertBygg => bygg !== null)
    : [];
  if (bygg.length === 0 && raa.versjon !== undefined) return null;
  const byKilde = erObjekt(raa.by) ? raa.by : {};
  const by: ByTilstand = {
    ...standard.by,
    ...{
      nivaa: byKilde.nivaa === 2 || byKilde.nivaa === 3 || byKilde.nivaa === 4 || byKilde.nivaa === 5 || byKilde.nivaa === 6 ? byKilde.nivaa : 1,
      bygg: bygg.length ? bygg : standard.by.bygg,
      rotasjon: byKilde.rotasjon === 1 || byKilde.rotasjon === 2 || byKilde.rotasjon === 3 ? byKilde.rotasjon : 0,
      skala: typeof byKilde.skala === "number" ? byKilde.skala : 1,
      panX: typeof byKilde.panX === "number" ? byKilde.panX : 0,
      panY: typeof byKilde.panY === "number" ? byKilde.panY : 0,
      monsterFullfort: typeof byKilde.monsterFullfort === "number" ? byKilde.monsterFullfort : 0,
      kjente3d: Array.isArray(byKilde.kjente3d) ? byKilde.kjente3d.filter((id): id is string => typeof id === "string") : [],
      besteKlokkePaRad: typeof byKilde.besteKlokkePaRad === "number" ? byKilde.besteKlokkePaRad : 0,
      klokkePaRad: typeof byKilde.klokkePaRad === "number" ? byKilde.klokkePaRad : 0,
      dagerAlleAvtaler: typeof byKilde.dagerAlleAvtaler === "number" ? byKilde.dagerAlleAvtaler : 0,
      omrader: Array.isArray(byKilde.omrader) ? (byKilde.omrader as ByTilstand["omrader"]) : ["dalen"],
    },
  };
  // Pynt på plass i en hage beholdes. Gammel pynt som tok hele ruter, blir til mynter igjen (gj. 10, C4).
  let refusjon = 0;
  const pynt: PyntPlassert[] = [];
  for (const rad of Array.isArray(byKilde.pynt) ? byKilde.pynt : []) {
    if (!erObjekt(rad) || typeof rad.id !== "string" || typeof rad.vare !== "string") continue;
    if (typeof rad.plass === "string" && typeof rad.x === "number" && typeof rad.y === "number") {
      pynt.push({ id: rad.id, vare: rad.vare as VareId, plass: rad.plass, x: rad.x, y: rad.y });
    } else {
      refusjon += PYNT_PRIS_GAMMEL[rad.vare] ?? 0;
    }
  }
  by.pynt = pynt;
  return {
    ...standard,
    versjon: 1,
    innstillinger: lesInnstillinger(raa.innstillinger, standard.innstillinger),
    mynter: (typeof raa.mynter === "number" ? raa.mynter : 0) + refusjon,
    kurv: erObjekt(raa.kurv) ? (raa.kurv as Lagret["kurv"]) : {},
    by,
    dato: erObjekt(raa.dato) && typeof raa.dato.aar === "number" ? (raa.dato as unknown as Lagret["dato"]) : standard.dato,
    ukerytme: Array.isArray(raa.ukerytme) ? (raa.ukerytme as Lagret["ukerytme"]) : standard.ukerytme,
    sistePlaner: Array.isArray(raa.sistePlaner) ? raa.sistePlaner.filter((nokkel): nokkel is string => typeof nokkel === "string").slice(-7) : [],
    sisteMaler: Array.isArray(raa.sisteMaler) ? raa.sisteMaler.filter((nokkel): nokkel is string => typeof nokkel === "string").slice(-30) : [],
    sisteNokkel: typeof raa.sisteNokkel === "string" ? raa.sisteNokkel : "",
    sisteNokler: Array.isArray(raa.sisteNokler) ? raa.sisteNokler.filter((nokkel): nokkel is string => typeof nokkel === "string").slice(-30) : [],
    malPerType: erObjekt(raa.malPerType) ? (raa.malPerType as Lagret["malPerType"]) : {},
    sett: Array.isArray(raa.sett)
      ? raa.sett.filter((rad): rad is { s: string; d: number } => erObjekt(rad) && typeof rad.s === "string" && typeof rad.d === "number").slice(-300)
      : [],
    dagbok: Array.isArray(raa.dagbok) ? (raa.dagbok as Lagret["dagbok"]) : [],
    album: Array.isArray(raa.album) ? (raa.album as Lagret["album"]) : [],
    demoSett: Array.isArray(raa.demoSett) ? raa.demoSett.filter((id): id is string => typeof id === "string") : [],
    aktivDag: erObjekt(raa.aktivDag) && erObjekt(raa.aktivDag.plan) ? (raa.aktivDag as unknown as AktivDag) : null,
    nestePlan: erObjekt(raa.nestePlan) && erObjekt((raa.nestePlan as { butikk?: unknown }).butikk) ? (raa.nestePlan as unknown as Lagret["nestePlan"]) : null,
    startet: raa.startet === true,
    fro: typeof raa.fro === "number" ? raa.fro : 1,
    mestring: erObjekt(raa.mestring) ? (raa.mestring as Lagret["mestring"]) : {},
  };
}

/** Album kan kuttes. Bygninger blir igjen. */
export function passPaStorrelse(lagret: Lagret): Lagret {
  let kopi = lagret;
  while (JSON.stringify(kopi).length > 1_500_000 && kopi.album.length > 0) {
    kopi = { ...kopi, album: kopi.album.slice(1) };
  }
  return kopi;
}

export function lesLagring(lager: NokkelLager): Lagret {
  try {
    const raa = lager.getItem(NOKKEL);
    if (!raa) return standardLagret();
    return normaliserLagret(JSON.parse(raa) as unknown) ?? standardLagret();
  } catch {
    return standardLagret();
  }
}

export function skrivLagring(lager: NokkelLager, data: Lagret): void {
  lager.setItem(NOKKEL, JSON.stringify(passPaStorrelse(data)));
}

export function eksporter(data: Lagret): string {
  return JSON.stringify(passPaStorrelse(data));
}

/** Leser en eksportert by. Krever versjon 1 og en by med bygg, ellers endres ingenting (gj. 9, B4). */
export function importer(tekst: string): Lagret | null {
  try {
    const raa = JSON.parse(tekst) as unknown;
    if (!erObjekt(raa) || raa.versjon !== 1 || !erObjekt(raa.by) || !Array.isArray((raa.by as { bygg?: unknown }).bygg)) return null;
    return normaliserLagret(raa);
  } catch {
    return null;
  }
}

export function minneLager(start: Record<string, string> = {}): NokkelLager {
  const data = { ...start };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? (data[key] ?? null) : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

export function erDagsplan(verdi: unknown): verdi is Dagsplan {
  return erObjekt(verdi) && typeof verdi.nokkel === "string" && Array.isArray(verdi.avtaler);
}
