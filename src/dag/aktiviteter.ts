import { mal, navnAktivitet } from "../tekst/ordbok";
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

const KNAPP: Record<string, [string, string]> = {
  lekser: ["Gjør lekser", "Gjer lekser"],
  hund: ["Gå tur med hunden", "Gå tur med hunden"],
  lillesoster: ["Hent lillesøster", "Hent lillesyster"],
  tannlege: ["Gå inn til tannlegen", "Gå inn til tannlækjaren"],
  svomming: ["Svøm", "Sym"],
  dans: ["Dans", "Dans"],
  ski: ["Gå på ski", "Gå på ski"],
  skoyter: ["Gå på skøyter", "Gå på skøyter"],
  speider: ["Gå på speideren", "Gå på speidaren"],
  sjakk: ["Spill sjakk", "Spel sjakk"],
  fotball: ["Spill fotball", "Spel fotball"],
  handball: ["Spill håndball", "Spel handball"],
  turn: ["Turn", "Turn"],
  korps: ["Spill i korpset", "Spel i korpset"],
  kor: ["Syng", "Syng"],
  cello: ["Øv", "Øv"],
  piano: ["Øv", "Øv"],
  fiolin: ["Øv", "Øv"],
  bibliotek: ["Les", "Les"],
  besteforeldre: ["Besøk", "Besøk"],
  bursdag: ["Feir bursdagen", "Feir bursdagen"],
  middag: ["Spis", "Et"],
};

const SPORSMAL: Record<string, [string, string]> = {
  lekser: ["Leksene tar {min} min. Når er du ferdig?", "Leksene tek {min} min. Når er du ferdig?"],
  hund: ["Turen tar {min} min. Når er dere hjemme?", "Turen tek {min} min. Når er de heime?"],
  lillesoster: ["Hentingen tar {min} min. Når er dere hjemme?", "Hentinga tek {min} min. Når er de heime?"],
  tannlege: ["Timen hos tannlegen tar {min} min. Når er den ferdig?", "Timen hos tannlækjaren tek {min} min. Når er han ferdig?"],
  svomming: ["Når er dere ferdige? Svømmingen varer {min} min.", "Når er de ferdige? Symjinga varer {min} min."],
  bursdag: ["Bursdagen varer {min} min. Når er den ferdig?", "Fødselsdagen varer {min} min. Når er han ferdig?"],
  middag: ["Middagen tar {min} min. Når er dere ferdige?", "Middagen tek {min} min. Når er de ferdige?"],
};

export function aktivitetKnapp(id: string, spraak: Spraak): string {
  const rad = KNAPP[id] ?? ["Gjør det", "Gjer det"];
  return mal(spraak, rad[0], rad[1]);
}

export function aktivitetSporsmal(id: string, spraak: Spraak, min: string, nivaa?: string): string {
  const rad = SPORSMAL[id] ?? ["{navn} tar {min} min. Når er du ferdig?", "{navn} tek {min} min. Når er du ferdig?"];
  const ledd = nivaa === "forste" && min === "60" ? (["en time", "ein time"] as const) : nivaa === "forste" && min === "30" ? (["en halvtime", "ein halvtime"] as const) : null;
  const nb = ledd ? rad[0].replaceAll("{min} min", ledd[0]) : rad[0];
  const nn = ledd ? rad[1].replaceAll("{min} min", ledd[1]) : rad[1];
  return mal(spraak, nb, nn, { min, navn: visNavn(id, spraak) });
}

export function visBestemt(id: string, spraak: Spraak): string {
  const tabell: Record<string, [string, string]> = {
    svomming: ["svømmingen", "symjinga"],
    lekser: ["leksene", "leksene"],
    hund: ["hundeturen", "hundeturen"],
    tannlege: ["tannlegen", "tannlækjaren"],
    dans: ["dansen", "dansen"],
    lillesoster: ["henting av lillesøster", "henting av lillesyster"],
    middag: ["middagen", "middagen"],
    fotball: ["fotballen", "fotballen"],
    korps: ["korpset", "korpset"],
    piano: ["pianoøvingen", "pianoøvinga"],
    kor: ["koret", "koret"],
    bibliotek: ["biblioteket", "biblioteket"],
    speider: ["speideren", "speidaren"],
    sjakk: ["sjakken", "sjakken"],
    ski: ["skituren", "skituren"],
    skoyter: ["skøyteturen", "skeiseturen"],
    turn: ["turnen", "turnen"],
    handball: ["håndballen", "handballen"],
    cello: ["celloøvingen", "celloøvinga"],
    fiolin: ["fiolinøvingen", "fiolinøvinga"],
    besteforeldre: ["besøket hos besteforeldrene", "besøket hos besteforeldra"],
    henting: ["hentingen på SFO", "hentinga på SFO"],
    nabo: ["hjelpen til naboen", "hjelpa til naboen"],
  };
  const rad = tabell[id];
  if (rad) return mal(spraak, rad[0], rad[1]);
  const navn = visNavn(id, spraak);
  return navn.charAt(0).toLowerCase() + navn.slice(1);
}

/** En avtale som hel setning med «klokka»: «Hunden skal luftes klokka fem.» (gj. 10, 7.4). */
export function avtaleKlokka(id: string, spraak: Spraak, tid: string): string {
  const egne: Record<string, [string, string]> = {
    hund: ["Hunden skal luftes klokka {tid}.", "Hunden skal luftast klokka {tid}."],
    middag: ["Middagen er klokka {tid}.", "Middagen er klokka {tid}."],
    lillesoster: ["Vi henter lillesøster klokka {tid}.", "Vi hentar lillesyster klokka {tid}."],
    tannlege: ["Tannlegetimen begynner klokka {tid}.", "Tannlegetimen byrjar klokka {tid}."],
    lekser: ["Vi gjør lekser klokka {tid}.", "Vi gjer lekser klokka {tid}."],
  };
  const rad = egne[id];
  if (rad) return mal(spraak, rad[0], rad[1], { tid });
  const navn = visBestemt(id, spraak);
  return mal(spraak, "{navn} begynner klokka {tid}.", "{navn} byrjar klokka {tid}.", { navn: navn.charAt(0).toUpperCase() + navn.slice(1), tid });
}

/** Kort navn på knappen: «tur med hunden», ikke «Lufte hunden» (gj. 10, 7.4). */
export function avtaleKort(id: string, spraak: Spraak): string {
  if (id === "hund") return mal(spraak, "tur med hunden", "tur med hunden");
  if (id === "lillesoster") return mal(spraak, "henting av lillesøster", "henting av lillesyster");
  if (id === "middag") return mal(spraak, "middag", "middag");
  return visNavn(id, spraak);
}

const NAA: Record<string, [string, string]> = {
  hund: ["Nå er det tid for å lufte hunden.", "No er det tid for å lufte hunden."],
  lillesoster: ["Nå skal vi hente lillesøster.", "No skal vi hente lillesyster."],
  svomming: ["Nå begynner svømmingen.", "No byrjar symjinga."],
  tannlege: ["Nå er det timen hos tannlegen.", "No er det timen hos tannlækjaren."],
};

const VENTER: Record<string, [string, string]> = {
  hund: ["Hunden venter. Gå tur nå.", "Hunden ventar. Gå tur no."],
  lillesoster: ["Lillesøster venter. Hent henne nå.", "Lillesyster ventar. Hent henne no."],
  svomming: ["Svømmingen venter. Svøm nå.", "Symjinga ventar. Sym no."],
  tannlege: ["Tannlegen venter. Gå inn nå.", "Tannlækjaren ventar. Gå inn no."],
  dans: ["Dansen venter. Gå nå.", "Dansen ventar. Gå no."],
};

export function aktivitetNa(id: string, spraak: Spraak, sen = false): string {
  const tabell = sen ? VENTER : NAA;
  const rad = tabell[id];
  if (rad) return mal(spraak, rad[0], rad[1]);
  const navn = visNavn(id, spraak);
  return sen
    ? mal(spraak, "{navn} venter. Gå nå.", "{navn} ventar. Gå no.", { navn })
    : mal(spraak, "Nå er det tid for {navn}.", "No er det tid for {navn}.", { navn: navn.toLowerCase() });
}
