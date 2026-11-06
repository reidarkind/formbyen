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
  | "pynt-lykt"
  | "pynt-tre"
  | "pynt-busk"
  | "pynt-postkasse"
  | "pynt-fontene"
  | "pynt-ender";

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

export interface SkiltTid {
  naa: number;
  apner: number;
  stenger: number;
  stengtFra?: number;
  stengtTil?: number;
  neste: number;
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
  skilt?: SkiltTid;
  form?: string;
  form3d?: string;
  tall?: number;
  digital?: boolean;
  kasser?: { id: string; tekst: string; symbol?: string }[];
  varer?: { id: string; form: string; stor?: number }[];
  ovelse?: boolean;
  oppdrag?: boolean;
  monster?: string[];
  /** Farge per figur når mønsteret er farge. Tomt når mønsteret er form. */
  monsterFarge?: string[];
  /** Størrelse per figur når mønsteret er størrelse. */
  monsterStor?: number[];
  /** Ett hint om gangen. Færre hint gir flere mynter. */
  hint?: string[];
  hintVist?: number;
  ruter?: { id: string; ruter: number }[];
  koordinat?: string;
  /** Liten grå linje over oppgaven når oppgaven ikke handler om delen: «Løs oppgaven for å få sylinderen». */
  kontekst?: string;
  /** Liten hjelpelinje under bildet, for eksempel «Kule = rund som en ball.». */
  hjelp?: string;
  /** Skålvekta: sekken (med kilo når det står i oppgaven) mot lodd. */
  vekt?: { sekkKg?: number; lodd: number; loddKg: number };
  /** Planken som måles, i klosser. Med linjal når svaret er i centimeter. */
  planke?: { klosser: number; cm: boolean };
  /** Dagen som er merket i ukeplanen. */
  ukeMerke?: string;
  /** Formen som vises som skygge i gåten ved kassa (gj. 10, C2). */
  skygge?: string;
  /** Øving hjemme på et krav for neste bynivå (gj. 10, C5). */
  hjemme?: boolean;
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
  /** Når den samme dagen stenger. */
  nesteStenger?: number;
}

export interface FerdighetsTilstand {
  trinn: number;
  riktigePaRad: number;
  feilPaRad: number;
  riktige: number;
  forsok: number;
  /** De ti siste svarene: 1 er riktig, med dagen svaret kom («2026-8-17»). */
  siste?: { r: 0 | 1; d: string }[];
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

/** Pynt på en plass i en hage, langs stien eller ved torget. x og y er midten, i ruter (gj. 10, C4). */
export interface PyntPlassert {
  id: string;
  vare: VareId;
  plass: string;
  x: number;
  y: number;
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
  stjerner?: number;
  oppdrag?: boolean;
  merknad?: string;
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
  oppdragFerdig?: boolean;
  /** Oppdraget var riktig på første forsøk. */
  oppdragForste?: boolean;
  /** Oppdraget ble løst, også på andre forsøk. */
  oppdragGjort?: boolean;
  /** Fasen barnet var i før oppdraget. Barnet går tilbake dit etterpå. */
  oppdragFra?: Fase;
  /** Tårnuret har gitt mynter i dag. Bare én runde gir mynter. */
  urBetalt?: boolean;
  /** Morgendagens plan, og dagene etter til butikken er åpen. Laget da dagen startet. */
  morgen?: Dagsplan[];
  /** Bygget dagen startet med. Neste bygg krever et ja. */
  dagensBygg?: ByggId;
  ekstraNei?: boolean;
  /** Butikken er stengt i morgen. Barnet kjøper én del i dag og bygger med den i morgen (gj. 10, 7.1.10). */
  forraad?: "kjop" | "kjopt";
  byggetIDag: string[];
  formerIDag: string[];
  klokkerIDag: number[];
  valgtInstans: string | null;
  melding: string | null;
  visteForSent: string[];
  /** Feil på rad på samme oppgave. To feil slipper videre. */
  feil?: number;
  /** Svar der første forsøk var riktig. */
  forsteRett?: number;
  /** Oppgaver som fikk et første svar. */
  svarTotalt?: number;
  /** Hvor mange ganger hver oppgavetype er brukt i dag. Alle kilder telles (gj. 10, C2). */
  typeTakt?: Partial<Record<OppgaveType, number>>;
  /** Typene som er vist i dag, i rekkefølge. Samme type høyst to ganger på rad. */
  typeRekke?: OppgaveType[];
  /** Runden i butikken da barnet gikk ut. Den fortsetter når barnet handler igjen (gj. 10, 7.1.2). */
  pauset?: { ko: Oppgave[]; aktiv: number; feil?: number };
  /** Gåten ved kassa er vist i dag. */
  kasseVist?: boolean;
  /** Runder med tårnuret i dag. Bare den første gir mynter. */
  urRunder?: number;
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
  pynt?: PyntPlassert[];
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
  /** De siste 30 malene som er vist, fra alle kilder (gj. 10, C2). */
  sisteMaler: string[];
  sisteNokkel: string;
  /** De siste 30 nøklene, for eksempel klokke:870 og form:kule. */
  sisteNokler?: string[];
  /** Tekst og svar for oppgavene de siste dagene. `d` er dagnummeret (dagboka). */
  sett?: { s: string; d: number }[];
  /** De siste malene per oppgavetype, så variantene kommer på omgang. */
  malPerType?: Partial<Record<OppgaveType, string[]>>;
  dagbok: DagbokInnslag[];
  album: Foto[];
  demoSett: string[];
  aktivDag: AktivDag | null;
  /** Planen som ble lagret da forrige dag sluttet. */
  nestePlan?: Dagsplan | null;
  /** Planer for dagene etter neste dag, når butikken er stengt i helgen. */
  senerePlaner?: Dagsplan[];
  startet: boolean;
  fro: number;
}

export interface NokkelLager {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
