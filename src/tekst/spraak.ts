import type { Spraak, Ukedag } from "../typer";
import { fraNb } from "./ordbok";

const UKEDAG: Record<Spraak, Record<Ukedag, string>> = {
  nb: { mandag: "mandag", tirsdag: "tirsdag", onsdag: "onsdag", torsdag: "torsdag", fredag: "fredag", lordag: "lørdag", sondag: "søndag" },
  nn: { mandag: "måndag", tirsdag: "tysdag", onsdag: "onsdag", torsdag: "torsdag", fredag: "fredag", lordag: "laurdag", sondag: "sundag" },
  en: { mandag: "Monday", tirsdag: "Tuesday", onsdag: "Wednesday", torsdag: "Thursday", fredag: "Friday", lordag: "Saturday", sondag: "Sunday" },
  es: { mandag: "lunes", tirsdag: "martes", onsdag: "miércoles", torsdag: "jueves", fredag: "viernes", lordag: "sábado", sondag: "domingo" },
  de: { mandag: "Montag", tirsdag: "Dienstag", onsdag: "Mittwoch", torsdag: "Donnerstag", fredag: "Freitag", lordag: "Samstag", sondag: "Sonntag" },
  pt: { mandag: "segunda-feira", tirsdag: "terça-feira", onsdag: "quarta-feira", torsdag: "quinta-feira", fredag: "sexta-feira", lordag: "sábado", sondag: "domingo" },
  sv: { mandag: "måndag", tirsdag: "tisdag", onsdag: "onsdag", torsdag: "torsdag", fredag: "fredag", lordag: "lördag", sondag: "söndag" },
  da: { mandag: "mandag", tirsdag: "tirsdag", onsdag: "onsdag", torsdag: "torsdag", fredag: "fredag", lordag: "lørdag", sondag: "søndag" },
  fr: { mandag: "lundi", tirsdag: "mardi", onsdag: "mercredi", torsdag: "jeudi", fredag: "vendredi", lordag: "samedi", sondag: "dimanche" },
};

const MANED_ID = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

const MANED: Record<Spraak, string[]> = {
  nb: MANED_ID,
  nn: MANED_ID,
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  de: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  pt: ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"],
  sv: ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"],
  da: ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};

const ARSTID: Record<string, Record<Spraak, string>> = {
  vinter: { nb: "vinter", nn: "vinter", en: "winter", es: "invierno", de: "Winter", pt: "inverno", sv: "vinter", da: "vinter", fr: "hiver" },
  var: { nb: "vår", nn: "vår", en: "spring", es: "primavera", de: "Frühling", pt: "primavera", sv: "vår", da: "forår", fr: "printemps" },
  sommer: { nb: "sommer", nn: "sommar", en: "summer", es: "verano", de: "Sommer", pt: "verão", sv: "sommar", da: "sommer", fr: "été" },
  host: { nb: "høst", nn: "haust", en: "autumn", es: "otoño", de: "Herbst", pt: "outono", sv: "höst", da: "efterår", fr: "automne" },
};

export const SPRAAK_NAVN: Record<Spraak, string> = {
  nb: "Bokmål",
  nn: "Nynorsk",
  en: "English",
  es: "Español",
  de: "Deutsch",
  pt: "Português",
  sv: "Svenska",
  da: "Dansk",
  fr: "Français",
};

export function ukedagTekst(spraak: Spraak, dag: string): string {
  const tabell = UKEDAG[spraak];
  return tabell[dag as Ukedag] ?? dag;
}

export function manedTekst(spraak: Spraak, navn: string): string {
  const indeks = MANED_ID.indexOf(navn);
  if (indeks < 0) return navn;
  return MANED[spraak][indeks] ?? navn;
}

export function arstidTekst(spraak: Spraak, id: string): string {
  return ARSTID[id]?.[spraak] ?? id;
}

export function si(spraak: Spraak, nb: string, nn: string): string {
  return fraNb(spraak, nb, nn);
}
