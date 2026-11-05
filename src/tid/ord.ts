import type { Spraak } from "../typer";

const DOGN = 24 * 60;

function normaliser(minutter: number): number {
  return ((Math.round(minutter) % DOGN) + DOGN) % DOGN;
}

function timer(minutter: number): number {
  return Math.floor(normaliser(minutter) / 60);
}

function minutt(minutter: number): number {
  return normaliser(minutter) % 60;
}

function digital(minutter: number): string {
  return `${String(timer(minutter)).padStart(2, "0")}:${String(minutt(minutter)).padStart(2, "0")}`;
}

const NB = ["tolv", "ett", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti", "elleve"];
const SV = ["tolv", "ett", "två", "tre", "fyra", "fem", "sex", "sju", "åtta", "nio", "tio", "elva"];
const DA = ["tolv", "et", "to", "tre", "fire", "fem", "seks", "syv", "otte", "ni", "ti", "elleve"];
const DE = ["zwölf", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf"];
const EN = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
const ES = ["doce", "una", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once"];
const PT = ["doze", "uma", "duas", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze"];
const FR = ["douze", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze"];

function ansikt(time24: number): number {
  return ((time24 % 24) + 24) % 24 % 12;
}

function time24(verdi: number): number {
  return ((verdi % 24) + 24) % 24;
}

interface Lim {
  fem: string;
  ti: string;
  over: string;
  paa: string;
  halv: string;
  kvart: string;
  tjue?: string;
}

function fraseMot(m: number, denne: string, neste: string, lim: Lim): string {
  switch (m) {
    case 0:
      return denne;
    case 5:
      return `${lim.fem} ${lim.over} ${denne}`;
    case 10:
      return `${lim.ti} ${lim.over} ${denne}`;
    case 15:
      return `${lim.kvart} ${lim.over} ${denne}`;
    case 20:
      return lim.tjue ? `${lim.tjue} ${lim.over} ${denne}` : `${lim.ti} ${lim.paa} ${lim.halv} ${neste}`;
    case 25:
      return `${lim.fem} ${lim.paa} ${lim.halv} ${neste}`;
    case 30:
      return `${lim.halv} ${neste}`;
    case 35:
      return `${lim.fem} ${lim.over} ${lim.halv} ${neste}`;
    case 40:
      return lim.tjue ? `${lim.tjue} ${lim.paa} ${neste}` : `${lim.ti} ${lim.over} ${lim.halv} ${neste}`;
    case 45:
      return `${lim.kvart} ${lim.paa} ${neste}`;
    case 50:
      return `${lim.ti} ${lim.paa} ${neste}`;
    case 55:
      return `${lim.fem} ${lim.paa} ${neste}`;
    default:
      return denne;
  }
}

function navnListe(time: number, liste: readonly string[]): string {
  return liste[ansikt(time)] ?? liste[0] ?? "";
}

function spanskTime(time: number): string {
  const h = time24(time);
  if (h === 0) return "medianoche";
  if (h === 12) return "mediodía";
  if (h % 12 === 1) return "la una";
  return `las ${ES[h % 12] ?? "doce"}`;
}

function portugisiskTime(time: number): string {
  const h = time24(time);
  if (h === 0) return "meia-noite";
  if (h === 12) return "meio-dia";
  return PT[h % 12] ?? "doze";
}

function franskTime(time: number): string {
  const h = time24(time);
  if (h === 0) return "minuit";
  if (h === 12) return "midi";
  if (h % 12 === 1) return "une heure";
  return `${FR[h % 12] ?? "douze"} heures`;
}

function fraseEtter(spraak: Spraak, m: number, denneTime: number, nesteTime: number): string {
  if (spraak === "en") {
    const denne = navnListe(denneTime, EN);
    const neste = navnListe(nesteTime, EN);
    switch (m) {
      case 0:
        return denne;
      case 5:
        return `five past ${denne}`;
      case 10:
        return `ten past ${denne}`;
      case 15:
        return `quarter past ${denne}`;
      case 20:
        return `twenty past ${denne}`;
      case 25:
        return `twenty-five past ${denne}`;
      case 30:
        return `half past ${denne}`;
      case 35:
        return `twenty-five to ${neste}`;
      case 40:
        return `twenty to ${neste}`;
      case 45:
        return `quarter to ${neste}`;
      case 50:
        return `ten to ${neste}`;
      case 55:
        return `five to ${neste}`;
      default:
        return denne;
    }
  }
  if (spraak === "es") {
    const denne = spanskTime(denneTime);
    const neste = spanskTime(nesteTime);
    switch (m) {
      case 0:
        return denne;
      case 5:
        return `${denne} y cinco`;
      case 10:
        return `${denne} y diez`;
      case 15:
        return `${denne} y cuarto`;
      case 20:
        return `${denne} y veinte`;
      case 25:
        return `${denne} y veinticinco`;
      case 30:
        return `${denne} y media`;
      case 35:
        return `${neste} menos veinticinco`;
      case 40:
        return `${neste} menos veinte`;
      case 45:
        return `${neste} menos cuarto`;
      case 50:
        return `${neste} menos diez`;
      case 55:
        return `${neste} menos cinco`;
      default:
        return denne;
    }
  }
  if (spraak === "pt") {
    const denne = portugisiskTime(denneTime);
    const neste = portugisiskTime(nesteTime);
    switch (m) {
      case 0:
        return denne;
      case 5:
        return `${denne} e cinco`;
      case 10:
        return `${denne} e dez`;
      case 15:
        return `${denne} e um quarto`;
      case 20:
        return `${denne} e vinte`;
      case 25:
        return `${denne} e vinte e cinco`;
      case 30:
        return `${denne} e meia`;
      case 35:
        return `${neste} menos vinte e cinco`;
      case 40:
        return `${neste} menos vinte`;
      case 45:
        return `${neste} menos um quarto`;
      case 50:
        return `${neste} menos dez`;
      case 55:
        return `${neste} menos cinco`;
      default:
        return denne;
    }
  }
  const denne = franskTime(denneTime);
  const neste = franskTime(nesteTime);
  switch (m) {
    case 0:
      return denne;
    case 5:
      return `${denne} cinq`;
    case 10:
      return `${denne} dix`;
    case 15:
      return `${denne} et quart`;
    case 20:
      return `${denne} vingt`;
    case 25:
      return `${denne} vingt-cinq`;
    case 30:
      return `${denne} et ${denne === "midi" || denne === "minuit" ? "demi" : "demie"}`;
    case 35:
      return `${neste} moins vingt-cinq`;
    case 40:
      return `${neste} moins vingt`;
    case 45:
      return `${neste} moins le quart`;
    case 50:
      return `${neste} moins dix`;
    case 55:
      return `${neste} moins cinq`;
    default:
      return denne;
  }
}

const LIM: Record<"nb" | "sv" | "da" | "de", { liste: readonly string[]; lim: Lim }> = {
  nb: { liste: NB, lim: { fem: "fem", ti: "ti", over: "over", paa: "på", halv: "halv", kvart: "kvart" } },
  sv: { liste: SV, lim: { fem: "fem", ti: "tio", over: "över", paa: "i", halv: "halv", kvart: "kvart", tjue: "tjugo" } },
  da: { liste: DA, lim: { fem: "fem", ti: "ti", over: "over", paa: "i", halv: "halv", kvart: "kvart" } },
  de: { liste: DE, lim: { fem: "fünf", ti: "zehn", over: "nach", paa: "vor", halv: "halb", kvart: "viertel" } },
};

/** Klokkeord på landets vis. Norsk «halv to» er 13:30. Engelsk «half past two» er 14:30. */
export function tidTilOrd(minutter: number, spraak: Spraak = "nb"): string {
  const verdi = normaliser(minutter);
  if (verdi % 5 !== 0) throw new Error("tidTilOrd tar bare 5-minutter");
  const denneTime = timer(verdi);
  const nesteTime = (denneTime + 1) % 24;
  const m = minutt(verdi);
  if (spraak === "en" || spraak === "es" || spraak === "pt" || spraak === "fr") {
    return fraseEtter(spraak, m, denneTime, nesteTime);
  }
  const maal = spraak === "sv" || spraak === "da" || spraak === "de" ? LIM[spraak] : LIM.nb;
  return fraseMot(m, navnListe(denneTime, maal.liste), navnListe(nesteTime, maal.liste), maal.lim);
}

function navnFor(time: number, spraak: Spraak): string {
  const h = time24(time);
  if (spraak === "es") return spanskTime(h);
  if (spraak === "pt") return portugisiskTime(h);
  if (spraak === "fr") return franskTime(h);
  if (spraak === "en") return navnListe(h, EN);
  if (spraak === "sv") return navnListe(h, SV);
  if (spraak === "da") return navnListe(h, DA);
  if (spraak === "de") return navnListe(h, DE);
  return navnListe(h, NB);
}

/** Timen som har startet, og timen «halv» peker mot på norsk. */
export function timeNavn(minutter: number, spraak: Spraak = "nb"): { denne: string; neste: string } {
  const denneTime = timer(minutter);
  return { denne: navnFor(denneTime, spraak), neste: navnFor(denneTime + 1, spraak) };
}

function stor(setning: string): string {
  return setning.length === 0 ? setning : setning.charAt(0).toUpperCase() + setning.slice(1);
}

/** Forklarer timen «halv» peker på, når barnet tar feil time. */
export function halvveisTekst(minutter: number, spraak: Spraak = "nb"): string {
  const verdi = normaliser(minutter);
  const digitalTid = digital(verdi);
  const ord = tidTilOrd(verdi, spraak);
  const denneTime = timer(verdi);
  const nesteTime = (denneTime + 1) % 24;
  if (spraak === "nb" || spraak === "nn") {
    const navn = navnListe(nesteTime, NB);
    return `Halv ${navn} er halvveis til ${navn}. Det er ${digitalTid}.`;
  }
  if (spraak === "sv") {
    const navn = navnListe(nesteTime, SV);
    return `Halv ${navn} är halvvägs till ${navn}. Klockan är ${digitalTid}.`;
  }
  if (spraak === "da") {
    const navn = navnListe(nesteTime, DA);
    return `Halv ${navn} er halvvejs til ${navn}. Klokken er ${digitalTid}.`;
  }
  if (spraak === "de") {
    const navn = navnListe(nesteTime, DE);
    return `Halb ${navn} ist halbwegs bis ${navn}. Es ist ${digitalTid}.`;
  }
  if (spraak === "en") {
    return `${stor(ord)} is thirty minutes after ${navnListe(denneTime, EN)}. It is ${digitalTid}.`;
  }
  if (spraak === "es") {
    return `${stor(ord)} es treinta minutos después de ${spanskTime(denneTime)}. Digital: ${digitalTid}.`;
  }
  if (spraak === "pt") {
    return `${stor(ord)} é trinta minutos depois de ${portugisiskTime(denneTime)}. Digital: ${digitalTid}.`;
  }
  return `${stor(ord)}, c'est trente minutes après ${franskTime(denneTime)}. Il est ${digitalTid}.`;
}
