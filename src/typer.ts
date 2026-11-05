export type Nivaa = "forste" | "andre" | "utfordrende" | "blandet";
export type Spraak = "nb" | "nn" | "en" | "es" | "de" | "pt" | "sv" | "da" | "fr";

export const SPRAAK: Spraak[] = ["nb", "nn", "en", "es", "de", "pt", "sv", "da", "fr"];

export function erSpraak(verdi: string): verdi is Spraak {
  return (SPRAAK as string[]).includes(verdi);
}
export type Kjaeledyr = "hund" | "katt" | "kanin";
export type Ukedag = "mandag" | "tirsdag" | "onsdag" | "torsdag" | "fredag" | "lordag" | "sondag";
export type Arstid = "vinter" | "var" | "sommer" | "host";

export type Ferdighet =
  | "hele-timer"
  | "halv"
  | "kvart"
  | "fem-minutter"
  | "digital-24"
  | "tidsrom"
  | "periode"
  | "ukedager"
  | "maneder"
  | "former-grunn"
  | "former-flere"
  | "sortere"
  | "telle-2d"
  | "former-3d"
  | "telle-3d"
  | "rette-vinkler"
  | "stempel"
  | "monster"
  | "tegne"
  | "lengde"
  | "masse"
  | "areal"
  | "koordinater"
  | "likevekt";

export type OppgaveType =
  | "still-klokka"
  | "les-klokka"
  | "koble"
  | "rekker-jeg"
  | "hvor-lenge"
  | "apningstider"
  | "ukeplan"
  | "kalender"
  | "finn-formen"
  | "hvem-passer-ikke"
  | "sorter"
  | "tegn"
  | "tell"
  | "monster"
  | "stempel"
  | "lengde"
  | "masse"
  | "areal"
  | "koordinater"
  | "likevekt";

export const OPPGAVE_TYPER: OppgaveType[] = [
  "still-klokka",
  "les-klokka",
  "koble",
  "rekker-jeg",
  "hvor-lenge",
  "apningstider",
  "ukeplan",
  "kalender",
  "finn-formen",
  "hvem-passer-ikke",
  "sorter",
  "tegn",
  "tell",
  "monster",
  "stempel",
  "lengde",
  "masse",
  "areal",
  "koordinater",
  "likevekt",
];

export type ByggId =
  | "ronne"
  | "hytte"
  | "hus"
  | "villa"
  | "borg"
  | "slott"
  | "bronn"
  | "gjerde"
  | "vedskjul"
  | "bakeri"
  | "lekeplass"
  | "bro"
  | "skole"
  | "idrettshall"
  | "korpslokale"
  | "musikkskole"
  | "bibliotek"
  | "togstasjon"
  | "kirke"
  | "vanntaarn"
  | "fyrtarn"
  | "ringmur"
  | "park"
  | "festplass"
  | "klokketarn";

export type VareId =
  | "vegg-tre"
  | "vegg-mur"
  | "vegg-stein"
  | "tak-rodt"
  | "tak-blatt"
  | "vindu-kvadrat"
  | "vindu-rektangel"
  | "vindu-sirkel"
  | "vindu-halvsirkel"
  | "vindu-sekskant"
  | "vindu-femkant"
  | "dor-rektangel"
  | "dor-bue"
  | "kloss-kube"
  | "kloss-sylinder"
  | "kloss-kule"
  | "kloss-kjegle"
  | "kloss-pyramide"
  | "kloss-prisme"
  | "planke"
  | "sement"
  | "sand"
  | "grus"
  | "maling"
  | "fliselim"
  | "spiker"
  | "jord"
  | "pynt-blomst"
  | "pynt-flagg"
  | "pynt-benk"
  | "pynt-lykt";

export type StedId = "hjemme" | "butikk" | "torg" | "byggeplass" | "aktivitet" | "tannlege" | "svommehall" | "barnehage";
export type Omrade = "dalen" | "bekken" | "asen" | "havna";
export type Hylle = "form" | "kloss" | "mal" | "vekt";

export interface Dato {
  aar: number;
  maned: number;
  dag: number;
}

export interface Valg {
  id: string;
  tekst?: string;
  klokke?: number;
  form?: string;
  tall?: number;
  ja?: boolean;
}

export interface Oppgave {
  id: string;
  type: OppgaveType;
  mal: string;
  ferdighet: Ferdighet;
  prompt: string;
  nokkel: string;
  valg: Valg[];
  fasit: string;
  vare: VareId;
  hvem: string;
  overraskelse: boolean;
  maalKlokke?: number;
  form?: string;
  form3d?: string;
  tall?: number;
  digital?: boolean;
  kasser?: { id: string; tekst: string }[];
  varer?: { id: string; form: string }[];
  monster?: string[];
  ruter?: { id: string; ruter: number }[];
  koordinat?: string;
}

export interface FastAvtale {
  aktivitet: string;
  ukedag: Ukedag;
  start: number;
}

export interface Avtale {
  id: string;
  slag: "middag" | "fritid" | "hjemme" | "hendelse";
  navn: string;
  start: number;
  varighet: number;
  sted: string;
  aktivitet?: string;
}

export interface ButikkTid {
  apner: number;
  stenger: number;
  stengtHele: boolean;
  stengtFra?: number;
  stengtTil?: number;
}

export interface Dagsplan {
  nokkel: string;
  dato: Dato;
  ukedag: Ukedag;
  arstid: Arstid;
  hoytid?: string;
  bursdag?: string;
  skoleslutt: number | null;
  sisteTime: string | null;
  sfo: number | null;
  butikk: ButikkTid;
  avtaler: Avtale[];
  leggetid: number;
  start: number;
  /** Når butikken åpner neste dag den er åpen. */
  nesteApning?: number;
}

export interface FerdighetsTilstand {
  trinn: number;
  riktigePaRad: number;
  feilPaRad: number;
  riktige: number;
  forsok: number;
}

export interface FriDel {
  vare: VareId;
  x: number;
  y: number;
}

export interface PlassertBygg {
  instans: string;
  bygg: ByggId;
  x: number;
  y: number;
  steg: number;
  ferdig: boolean;
  uthus: boolean;
  frie: FriDel[];
  pynt: VareId[];
}

export interface Foto {
  nivaa: number;
  svg: string;
}

export interface KveldsAvtale {
  aktivitet: string;
  start: number;
  gjort: boolean;
  /** Avtalen hadde ikke startet da dagen ble avsluttet. */
  ikke?: boolean;
}

export interface DagbokInnslag {
  dato: Dato;
  stjerne: boolean;
  bygget: string[];
  former: string[];
  klokker: number[];
  avtaler?: KveldsAvtale[];
}

export type Fase = "ute" | "dor" | "handel" | "forklaring" | "aktivitet";

export interface AktivDag {
  plan: Dagsplan;
  tid: number;
  sted: StedId;
  fase: Fase;
  ko: Oppgave[];
  aktiv: number;
  forklaring: string | null;
  besokt: string[];
  forSent: string[];
  /** Avtaler som har startet, og som fortsatt kan møtes frem til slutt. */
  sent?: string[];
  handlet: boolean;
  dorLest: boolean;
  /** Deler kjøpt i dag til bygg fra nivå 3. */
  kjopIDag?: number;
  klokkeLekt?: boolean;
  byggetIDag: string[];
  formerIDag: string[];
  klokkerIDag: number[];
  valgtInstans: string | null;
  melding: string | null;
  visteForSent: string[];
  /** Feil på rad på samme oppgave. To feil slipper videre. */
  feil?: number;
}

export interface Innstillinger {
  nivaa: Nivaa;
  spraak: Spraak;
  lydPa: boolean;
  figur: 0 | 1 | 2 | 3;
  kjaeledyr: Kjaeledyr;
  skjulDigital: boolean;
  tidsromPa: boolean;
  rekordlistePa: boolean;
  fasteAvtaler: FastAvtale[];
}

export interface ByTilstand {
  nivaa: 1 | 2 | 3 | 4 | 5 | 6;
  bygg: PlassertBygg[];
  rotasjon: 0 | 1 | 2 | 3;
  skala: number;
  panX: number;
  panY: number;
  monsterFullfort: number;
  kjente3d: string[];
  besteKlokkePaRad: number;
  klokkePaRad: number;
  dagerAlleAvtaler: number;
  omrader: Omrade[];
}

export interface Lagret {
  versjon: 1;
  innstillinger: Innstillinger;
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>;
  mynter: number;
  kurv: Partial<Record<VareId, number>>;
  by: ByTilstand;
  dato: Dato;
  ukerytme: FastAvtale[];
  bursdager: { maned: number; dag: number; hvem: string }[];
  sistePlaner: string[];
  sisteMaler: string[];
  sisteNokkel: string;
  dagbok: DagbokInnslag[];
  album: Foto[];
  demoSett: string[];
  aktivDag: AktivDag | null;
  startet: boolean;
  fro: number;
}

export interface NokkelLager {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
