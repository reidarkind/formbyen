import { navnAktivitet } from "../tekst/ordbok";
import type { ByggId, Spraak } from "../typer";

export interface Aktivitet {
  id: string;
  krever: ByggId | null;
  varighet: number;
  /** Vinter, eller hele året. */
  vinter: boolean;
}

export const AKTIVITETER: Aktivitet[] = [
  { id: "lekser", krever: null, varighet: 30, vinter: false },
  { id: "hund", krever: null, varighet: 30, vinter: false },
  { id: "tannlege", krever: null, varighet: 30, vinter: false },
  { id: "lillesoster", krever: null, varighet: 30, vinter: false },
  { id: "svomming", krever: null, varighet: 60, vinter: false },
  { id: "dans", krever: null, varighet: 60, vinter: false },
  { id: "ski", krever: null, varighet: 60, vinter: true },
  { id: "skoyter", krever: null, varighet: 60, vinter: true },
  { id: "speider", krever: null, varighet: 60, vinter: false },
  { id: "sjakk", krever: null, varighet: 30, vinter: false },
  { id: "fotball", krever: "idrettshall", varighet: 60, vinter: false },
  { id: "handball", krever: "idrettshall", varighet: 60, vinter: false },
  { id: "turn", krever: "idrettshall", varighet: 60, vinter: false },
  { id: "korps", krever: "korpslokale", varighet: 60, vinter: false },
  { id: "kor", krever: "musikkskole", varighet: 60, vinter: false },
  { id: "cello", krever: "musikkskole", varighet: 30, vinter: false },
  { id: "piano", krever: "musikkskole", varighet: 30, vinter: false },
  { id: "fiolin", krever: "musikkskole", varighet: 30, vinter: false },
  { id: "bibliotek", krever: "bibliotek", varighet: 60, vinter: false },
  { id: "besteforeldre", krever: "togstasjon", varighet: 60, vinter: false },
];

export function aktivitet(id: string): Aktivitet | undefined {
  return AKTIVITETER.find((a) => a.id === id);
}

export function apneAktiviteter(ferdige: readonly ByggId[], vinter: boolean): Aktivitet[] {
  return AKTIVITETER.filter((a) => {
    if (a.vinter && !vinter) return false;
    if (a.krever && !ferdige.includes(a.krever)) return false;
    return true;
  });
}

const NAVN: Record<string, { nb: string; nn: string }> = {
  middag: { nb: "Middag", nn: "Middag" },
  lekser: { nb: "Lekser", nn: "Lekser" },
  hund: { nb: "Lufte hunden", nn: "Lufte hunden" },
  tannlege: { nb: "Tannlege", nn: "Tannlækjar" },
  lillesoster: { nb: "Hente lillesøster", nn: "Hente lillesyster" },
  svomming: { nb: "Svømming", nn: "Symjing" },
  dans: { nb: "Dans", nn: "Dans" },
  ski: { nb: "Ski", nn: "Ski" },
  skoyter: { nb: "Skøyter", nn: "Skøyter" },
  speider: { nb: "Speider", nn: "Speidar" },
  sjakk: { nb: "Sjakk", nn: "Sjakk" },
  fotball: { nb: "Fotballtrening", nn: "Fotballtrening" },
  handball: { nb: "Håndballtrening", nn: "Handballtrening" },
  turn: { nb: "Turn", nn: "Turn" },
  korps: { nb: "Korpsøvelse", nn: "Korpsøving" },
  kor: { nb: "Kor", nn: "Kor" },
  cello: { nb: "Cello", nn: "Cello" },
  piano: { nb: "Piano", nn: "Piano" },
  fiolin: { nb: "Fiolin", nn: "Fiolin" },
  bibliotek: { nb: "Biblioteket", nn: "Biblioteket" },
  besteforeldre: { nb: "Besteforeldre", nn: "Besteforeldre" },
  henting: { nb: "Henting på SFO", nn: "Henting på SFO" },
  nabo: { nb: "Hjelp naboen", nn: "Hjelp naboen" },
  levering: { nb: "Varelevering", nn: "Varelevering" },
  bursdag: { nb: "Bursdag", nn: "Fødselsdag" },
  norsk: { nb: "norsk", nn: "norsk" },
  matematikk: { nb: "matematikk", nn: "matematikk" },
  kroppsoving: { nb: "kroppsøving", nn: "kroppsøving" },
  musikk: { nb: "musikk", nn: "musikk" },
  naturfag: { nb: "naturfag", nn: "naturfag" },
  krle: { nb: "KRLE", nn: "KRLE" },
  kunst: { nb: "kunst og håndverk", nn: "kunst og handverk" },
  engelsk: { nb: "engelsk", nn: "engelsk" },
  svommetime: { nb: "svømming", nn: "symjing" },
};

export const SKOLEFAG = ["norsk", "matematikk", "kroppsoving", "musikk", "naturfag", "krle", "kunst", "engelsk", "svommetime"];

export function visNavn(id: string, spraak: Spraak): string {
  const rad = NAVN[id];
  if (!rad) return id;
  return navnAktivitet(id, spraak, rad.nb, rad.nn);
}
