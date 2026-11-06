import { visBestemt } from "../dag/aktiviteter";
import { ruteNavn } from "../bygg/kart";
import { PLANKER, VEKT_KG } from "../bygg/katalog";
import { heltall, spredt, stokk, trekk, type Tilfeldig } from "../felles/tilfeldig";
import { ALLE_2D, ALLE_3D, GRUNNFORMER, form2d, form3d, type Form2dId, type Form3dId } from "../former/definisjoner";
import { ferdighetApent, tillatteMinutter } from "../tilpasning/mestring";
import { formFlertall, formMedArtikkel, formNavn, mal, navnVare } from "../tekst/ordbok";
import { arstidTekst, manedTekst } from "../tekst/spraak";
import { timeNavn } from "../tid/ord";
import { erApen, klokke, nesteApning, normaliser, tidTilDigital24, tidTilOrd } from "../tid/tid";
import type { Dagsplan, Ferdighet, FerdighetsTilstand, Hylle, Nivaa, Oppgave, OppgaveType, Spraak, Valg, VareId } from "../typer";
import { MALER, malFerdighet, malerFor, type Mal } from "./maler";

export interface OppgaveKontekst {
  tilfeldig: Tilfeldig;
  spraak: Spraak;
  nivaa: Nivaa;
  mestring: Partial<Record<Ferdighet, FerdighetsTilstand>>;
  plan: Dagsplan | null;
  unngaMal: string[];
  unngaNokkel: string;
  /** De siste nøklene fra historikken (gj. 10, C2). */
  unngaNokler?: string[];
  type?: OppgaveType;
  hylle?: Hylle;
  maalForm?: string;
  kjente3d?: string[];
  tidsromPa?: boolean;
  ukedagNavn?: (dag: string) => string;
  blandetValgt?: boolean;
  naa?: number;
}

const HYLLE: Record<Hylle, OppgaveType[]> = {
  form: ["finn-formen", "hvem-passer-ikke", "sorter", "tegn", "monster", "tell"],
  kloss: ["stempel", "tell", "finn-formen"],
  mal: ["lengde"],
  vekt: ["masse", "likevekt"],
};

function si(spraak: Spraak, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return mal(spraak, nb, nn, verdier);
}

/** Nøkler som skal unngås: den siste og historikken. */
function unngas(ctx: OppgaveKontekst, nokkel: string): boolean {
  return nokkel === ctx.unngaNokkel || (ctx.unngaNokler ?? []).includes(nokkel);
}

/** Én av ordlydene for typen, styrt av malvarianten (gj. 10, C2). */
function ordlyd(indeks: number, liste: readonly (readonly [string, string])[]): readonly [string, string] {
  return liste[((indeks % liste.length) + liste.length) % liste.length] ?? liste[0]!;
}

/** Varighet i ord: en halvtime, et kvarter, tre kvarter, en time, en og en halv time, ellers minutter. */
export function varighetTekst(min: number, spraak: Spraak): string {
  if (min === 15) return si(spraak, "et kvarter", "eit kvarter");
  if (min === 30) return si(spraak, "en halvtime", "ein halvtime");
  if (min === 45) return si(spraak, "tre kvarter", "tre kvarter");
  if (min === 60) return si(spraak, "en time", "ein time");
  if (min === 90) return si(spraak, "en og en halv time", "ein og ein halv time");
  if (min === 120) return si(spraak, "to timer", "to timar");
  return si(spraak, "{n} minutter", "{n} minutt", { n: String(min) });
}

function variant(id: string): number {
  const tall = Number(id.slice(id.lastIndexOf("-") + 1));
  return Number.isFinite(tall) && tall > 0 ? tall : 1;
}

function hvem(v: number, spraak: Spraak): string {
  const par = [
    ["ekspeditøren", "ekspeditøren"],
    ["naboen", "naboen"],
    ["treneren", "trenaren"],
    ["skiltet", "skiltet"],
    ["lappen", "lappen"],
    ["kjæledyret", "kjæledyret"],
  ];
  const rad = par[(v - 1) % par.length] ?? par[0]!;
  return si(spraak, rad[0]!, rad[1]!);
}

function nivaTall(nivaa: Nivaa): number {
  if (nivaa === "forste") return 0;
  if (nivaa === "andre") return 1;
  if (nivaa === "utfordrende") return 2;
  return 3;
}

export function malPassert(mal: Mal, ctx: OppgaveKontekst): boolean {
  const justert = malFerdighet(mal);
  if (nivaTall(ctx.nivaa) < justert.niva) return false;
  if (!ferdighetApent(justert.ferdighet, ctx.nivaa, ctx.mestring)) return false;
  if (ctx.tidsromPa === false && (mal.type === "rekker-jeg" || mal.type === "hvor-lenge")) return false;
  if (ctx.hylle && !HYLLE[ctx.hylle].includes(mal.type)) return false;
  if (ctx.hylle === "kloss" && mal.type === "tell" && justert.ferdighet === "telle-2d") return false;
  if (ctx.hylle === "kloss" && justert.ferdighet === "former-grunn") return false;
  if (ctx.hylle === "form" && mal.type === "tell" && justert.ferdighet !== "telle-2d" && justert.ferdighet !== "rette-vinkler") {
    return false;
  }
  return true;
}

function basis(mal: Mal, ctx: OppgaveKontekst, prompt: string, nokkel: string, fasit: string, vare: VareId): Oppgave {
  const justert = malFerdighet(mal);
  return {
    id: `${mal.id}-${nokkel}`,
    type: mal.type,
    mal: mal.id,
    ferdighet: justert.ferdighet,
    prompt,
    nokkel,
    valg: [],
    fasit,
    vare,
    hvem: hvem(variant(mal.id), ctx.spraak),
    overraskelse: mal.overraskelse,
  };
}

function tidUnnga(ctx: OppgaveKontekst, lovlige: number[]): number {
  for (let i = 0; i < 12; i++) {
    const time = 12 + heltall(ctx.tilfeldig, 0, 8);
    const m = trekk(ctx.tilfeldig, lovlige);
    const verdi = klokke(time, m);
    if (!unngas(ctx, `klokke:${verdi}`)) return verdi;
  }
  return klokke(14, lovlige.includes(30) ? 30 : 0);
}

function klokkeValg(
  riktig: number,
  tilfeldig: Tilfeldig,
  som: "ord" | "digital",
  spraak: Spraak,
  lovlige?: readonly number[],
): { valg: Valg[]; fasit: string } {
  const time = Math.floor(riktig / 60) % 12;
  const minutt = riktig % 60;
  const byttet = normaliser((minutt === 0 ? 12 : Math.round(minutt / 5)) * 60 + (time % 12) * 5);
  const innen = (verdi: number) => !lovlige || lovlige.includes(verdi % 60);
  const riktigTekst = som === "ord" ? tidTilOrd(riktig, spraak) : tidTilDigital24(riktig);
  const kandidater = [riktig + 60, riktig - 60, riktig + 30, riktig - 30, riktig + 15, riktig - 15, riktig + 5, riktig - 5, byttet]
    .map((verdi) => normaliser(verdi))
    .filter((verdi, indeks, liste) => verdi !== riktig && innen(verdi) && liste.indexOf(verdi) === indeks);
  const feil: number[] = [];
  const sett = new Set<string>([riktigTekst]);
  for (const tid of stokk(tilfeldig, kandidater)) {
    const tekst = som === "ord" ? tidTilOrd(tid, spraak) : tidTilDigital24(tid);
    if (sett.has(tekst)) continue;
    sett.add(tekst);
    feil.push(tid);
    if (feil.length === 2) break;
  }
  while (feil.length < 2) {
    const ekstra = normaliser(riktig + (feil.length + 1) * 60);
    if (!feil.includes(ekstra) && ekstra !== riktig) feil.push(ekstra);
    else break;
  }
  const tider = stokk(tilfeldig, [riktig, ...feil]);
  const valg = tider.map((tid) => ({
    id: `k${tid}`,
    klokke: tid,
    tekst: som === "ord" ? tidTilOrd(tid, spraak) : tidTilDigital24(tid),
  }));
  return { valg, fasit: `k${riktig}` };
}

function tallValg(riktig: number, tilfeldig: Tilfeldig): { valg: Valg[]; fasit: string } {
  // Riktig svar skal like ofte være minst, i midten og størst (gj. 9, 4.4).
  const monstre = [
    [-2, -1],
    [-1, 1],
    [1, 2],
  ];
  const lovlige = monstre.filter((par) => par.every((d) => riktig + d >= 1));
  const par = trekk(tilfeldig, lovlige.length ? lovlige : [[1, 2]]);
  const andre = (par ?? [1, 2]).map((d) => riktig + d);
  const tallene = stokk(tilfeldig, [riktig, andre[0] ?? 0, andre[1] ?? 1]);
  return {
    valg: tallene.map((tall) => ({ id: `t${tall}`, tall, tekst: String(tall) })),
    fasit: `t${riktig}`,
  };
}

function formUnnga(ctx: OppgaveKontekst, liste: readonly string[]): string {
  const blandet = stokk(ctx.tilfeldig, liste);
  return blandet.find((form) => !unngas(ctx, `form:${form}`)) ?? blandet[0] ?? "sirkel";
}

function vareForForm(form: string): VareId {
  const kart: Record<string, VareId> = {
    sirkel: "vindu-sirkel",
    trekant: "tak-rodt",
    kvadrat: "vindu-kvadrat",
    rektangel: "vindu-rektangel",
    femkant: "vindu-femkant",
    sekskant: "vindu-sekskant",
    halvsirkel: "vindu-halvsirkel",
    oval: "vindu-sirkel",
    kule: "kloss-kule",
    kube: "kloss-kube",
    sylinder: "kloss-sylinder",
    kjegle: "kloss-kjegle",
    pyramide: "kloss-pyramide",
    prisme: "kloss-prisme",
  };
  return kart[form] ?? "planke";
}

function lagStill(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const lovlige = tillatteMinutter(ctx.nivaa, ctx.mestring);
  let tid = tidUnnga(ctx, lovlige.length ? lovlige : [0]);
  if (v === 2 && ctx.plan && !ctx.plan.butikk.stengtHele) tid = ctx.plan.butikk.apner;
  if (v === 3) tid = ctx.plan?.avtaler.find((rad) => rad.slag === "middag")?.start ?? tid;
  if (v === 4 && ctx.plan) tid = ctx.plan.leggetid;
  if (v === 5) tid = ctx.plan?.avtaler.find((rad) => rad.varighet > 0 && rad.slag !== "middag")?.start ?? tid;
  if (v === 6 && lovlige.includes(30)) tid = klokke(14, 30);
  if (v === 7 && lovlige.includes(25)) tid = klokke(14, 25);
  if (v === 8 && lovlige.includes(15)) tid = klokke(16, 15);
  const navn = timeNavn(tid, ctx.spraak);
  const felt = {
    ord: tidTilOrd(tid, ctx.spraak),
    digital: tidTilDigital24(tid),
    hvem: v === 10 ? hvem(v, ctx.spraak).replace(/^./u, (bokstav) => bokstav.toUpperCase()) : hvem(v, ctx.spraak),
    denne: navn.denne,
    neste: navn.neste,
  };
  const maler: [string, string][] = [
    ["Still klokka til {ord}.", "Still klokka til {ord}."],
    ["Butikken åpner klokka {ord}. Vis det.", "Butikken opnar klokka {ord}. Vis det."],
    ["Middagen er klokka {ord}. Still klokka.", "Middagen er klokka {ord}. Still klokka."],
    ["Leggetid er klokka {ord}. Vis det.", "Leggetid er klokka {ord}. Vis det."],
    ["Avtalen starter klokka {ord}. Still viserne.", "Avtala startar klokka {ord}. Still visarane."],
    ["Vis klokka {ord}. Den er halvveis til {neste}.", "Vis klokka {ord}. Den er halvveis til {neste}."],
    ["Vis klokka {ord}.", "Vis klokka {ord}."],
    ["Vis klokka {ord}.", "Vis klokka {ord}."],
    ["Still klokka til {ord}.", "Still klokka til {ord}."],
    ["{hvem} sier klokka {ord}. Still klokka.", "{hvem} seier klokka {ord}. Still klokka."],
    ["Butikkuret står. Still det til klokka {ord}.", "Butikkuret står. Still det til klokka {ord}."],
    ["Lappen sier klokka {ord}. Still klokka.", "Lappen seier klokka {ord}. Still klokka."],
  ];
  const valgt = maler[v - 1] ?? maler[0]!;
  const oppgave = basis(mal, ctx, si(ctx.spraak, valgt[0], valgt[1], felt), `klokke:${tid}`, String(tid), "vindu-sirkel");
  oppgave.maalKlokke = tid;
  oppgave.digital = v === 9;
  return oppgave;
}

function lagLes(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const lovlige = tillatteMinutter(ctx.nivaa, ctx.mestring);
  const tid = v === 6 && lovlige.includes(30) ? klokke(14, 30) : tidUnnga(ctx, lovlige.length ? lovlige : [0]);
  const som = v === 2 ? "digital" : "ord";
  const pakke = klokkeValg(tid, ctx.tilfeldig, som, ctx.spraak, lovlige);
  const lesMaler: [string, string][] = [
    ["Hvilket ord passer til klokka?", "Kva for ord passar til klokka?"],
    ["Hvilken digital tid passer?", "Kva for digital tid passar?"],
    ["Hva viser denne klokka?", "Kva viser denne klokka?"],
    ["Stemmer det at klokka er {ord}?", "Stemmer det at klokka er {ord}?"],
    ["Hvilken tid passer ikke til klokka?", "Kva for tid passar ikkje til klokka?"],
    ["Hva viser klokka?", "Kva viser klokka?"],
    ["Hva er klokka om en halvtime?", "Kva er klokka om ein halvtime?"],
    ["Hva er klokka om en time?", "Kva er klokka om ein time?"],
    ["Når stenger butikken?", "Når stengjer butikken?"],
    ["Når er middagen?", "Når er middagen?"],
    ["Hvilken tid er rett?", "Kva for tid er rett?"],
    ["Hvilken tid på dagen er dette?", "Kva for tid på dagen er dette?"],
  ];
  const lesValgt = lesMaler[v - 1] ?? lesMaler[0]!;
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, lesValgt[0], lesValgt[1], { ord: tidTilOrd(tid, ctx.spraak) }),
    `klokke:${tid}`,
    pakke.fasit,
    "vindu-kvadrat",
  );
  oppgave.maalKlokke = tid;
  oppgave.valg = pakke.valg;
  if (v === 4) {
    const feil = ctx.tilfeldig() < 0.5;
    oppgave.maalKlokke = feil ? normaliser(tid + 60) : tid;
    oppgave.fasit = feil ? "nei" : "ja";
    oppgave.valg = stokk(ctx.tilfeldig, [
      { id: "ja", ja: true, tekst: si(ctx.spraak, "Ja", "Ja") },
      { id: "nei", ja: false, tekst: si(ctx.spraak, "Nei", "Nei") },
    ]);
    oppgave.nokkel = `klokke:${oppgave.maalKlokke}`;
  }
  if (v === 5) {
    const annen = normaliser(tid + 60);
    oppgave.valg = stokk(ctx.tilfeldig, [
      { id: "a", klokke: tid, tekst: `${tidTilOrd(tid, ctx.spraak)} · ${tidTilDigital24(tid)}` },
      { id: "b", klokke: tid, tekst: tidTilOrd(tid, ctx.spraak) },
      { id: "c", klokke: annen, tekst: `${tidTilOrd(annen, ctx.spraak)} · ${tidTilDigital24(annen)}` },
    ]);
    oppgave.fasit = "c";
    oppgave.maalKlokke = tid;
  }
  if (v === 7 || v === 8) {
    const senere = normaliser(tid + (v === 7 ? 30 : 60));
    const pakkeSenere = klokkeValg(senere, ctx.tilfeldig, "ord", ctx.spraak, lovlige);
    oppgave.valg = pakkeSenere.valg;
    oppgave.fasit = pakkeSenere.fasit;
    oppgave.maalKlokke = tid;
    oppgave.nokkel = `klokke:${senere}`;
  }
  if (v === 9 || v === 10) {
    const fraPlan = v === 9 ? ctx.plan?.butikk.stenger : ctx.plan?.avtaler.find((rad) => rad.slag === "middag")?.start;
    const planTid = fraPlan ?? (v === 9 ? klokke(17, 0) : klokke(16, 30));
    const pakkePlan = klokkeValg(planTid, ctx.tilfeldig, "ord", ctx.spraak, lovlige);
    oppgave.valg = pakkePlan.valg;
    oppgave.fasit = pakkePlan.fasit;
    oppgave.maalKlokke = planTid;
    oppgave.nokkel = `klokke:${planTid}`;
    oppgave.prompt = si(
      ctx.spraak,
      v === 9 ? "Når stenger butikken?" : "Når er middagen?",
      v === 9 ? "Når stengjer butikken?" : "Når er middagen?",
    );
  }
  if (v === 12) {
    // En analog skive viser ikke forskjell på morgen og kveld. Vis digital tid (gj. 9, B7).
    oppgave.digital = true;
    const time = [9, 14, 19][heltall(ctx.tilfeldig, 0, 2)] ?? 14;
    const vist = klokke(time, 0);
    const periode = time < 11 ? "formiddag" : time < 17 ? "ettermiddag" : "kveld";
    oppgave.valg = stokk(ctx.tilfeldig, [
      { id: "formiddag", tekst: si(ctx.spraak, "formiddag", "formiddag") },
      { id: "ettermiddag", tekst: si(ctx.spraak, "ettermiddag", "ettermiddag") },
      { id: "kveld", tekst: si(ctx.spraak, "kveld", "kveld") },
    ]);
    oppgave.fasit = periode;
    oppgave.maalKlokke = vist;
    oppgave.prompt = si(ctx.spraak, "Hvilken tid på dagen er dette?", "Kva for tid på dagen er dette?");
  }
  return oppgave;
}

function lagKoble(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const lovlige = tillatteMinutter(ctx.nivaa, ctx.mestring);
  const tid = tidUnnga(ctx, lovlige.length ? lovlige : [0]);
  const som = v % 2 === 0 ? "digital" : "ord";
  const pakke = klokkeValg(tid, ctx.tilfeldig, som, ctx.spraak, lovlige);
  const tekst = ordlyd(v - 1, [
    ["Hvilken tid viser klokka?", "Kva for tid viser klokka?"],
    ["Hva er klokka?", "Kva er klokka?"],
    ["Se på viserne. Hvilken tid er det?", "Sjå på visarane. Kva for tid er det?"],
    ["Finn tiden som passer til klokka.", "Finn tida som passar til klokka."],
    ["Les klokka. Hva viser den?", "Les klokka. Kva viser ho?"],
    ["Hvilket kort passer til klokka?", "Kva for kort passar til klokka?"],
  ]);
  const oppgave = basis(mal, ctx, si(ctx.spraak, tekst[0], tekst[1]), `klokke:${tid}`, pakke.fasit, "vindu-rektangel");
  oppgave.maalKlokke = tid;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function lagRekker(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const forste = nivaTall(ctx.nivaa) === 0;
  // I 1. klasse bare hele og halve timer (gj. 9, B7).
  const halv = (tid: number) => (forste ? Math.ceil(tid / 30) * 30 : tid);
  const naa = halv(ctx.naa ?? ctx.plan?.start ?? klokke(14, 0));
  const avtale = ctx.plan?.avtaler.find((rad) => rad.varighet > 0 && rad.start > naa);
  const handling = forste ? (v % 2 === 0 ? 30 : 60) : v % 2 === 0 ? 30 : 15;
  const kandidat = v % 3 === 0 ? normaliser(naa + (forste ? 30 : 10)) : (avtale?.start ?? normaliser(naa + 120));
  const frist = halv(kandidat > naa ? kandidat : normaliser(naa + 120));
  const rekker = naa + handling <= frist;
  const varighet = varighetTekst(handling, ctx.spraak);
  const tekst = ordlyd(v - 1, [
    ["Du bruker {varighet}. Rekker du det før klokka {tid}?", "Du brukar {varighet}. Rekk du det før klokka {tid}?"],
    ["Leken tar {varighet}. Er du ferdig før klokka {tid}?", "Leiken tek {varighet}. Er du ferdig før klokka {tid}?"],
    ["Vi må være hjemme klokka {tid}. Turen tar {varighet}. Rekker vi det?", "Vi må vere heime klokka {tid}. Turen tek {varighet}. Rekk vi det?"],
    ["Det tar {varighet} å gå til parken. Er du der før klokka {tid}?", "Det tek {varighet} å gå til parken. Er du der før klokka {tid}?"],
    ["Kjæledyret skal ut i {varighet}. Er dere tilbake før klokka {tid}?", "Kjæledyret skal ut i {varighet}. Er de tilbake før klokka {tid}?"],
    ["Snekkeren trenger {varighet}. Er han ferdig før klokka {tid}?", "Snikkaren treng {varighet}. Er han ferdig før klokka {tid}?"],
  ]);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, tekst[0], tekst[1], { varighet, tid: tidTilDigital24(frist) }),
    `klokke:${frist}`,
    rekker ? "ja" : "nei",
    "planke",
  );
  oppgave.maalKlokke = naa;
  oppgave.tall = frist;
  oppgave.valg = stokk(ctx.tilfeldig, [
    { id: "ja", ja: true, tekst: si(ctx.spraak, "Ja", "Ja") },
    { id: "nei", ja: false, tekst: si(ctx.spraak, "Nei", "Nei") },
  ]);
  return oppgave;
}

/** Aktiviteter i «hvor lenge»: bestemt form, bokmål og nynorsk. */
const LENGE_AKTIVITET: readonly (readonly [string, string])[] = [
  ["filmen", "filmen"],
  ["turen", "turen"],
  ["bursdagen", "bursdagen"],
  ["bakingen", "bakinga"],
  ["leken", "leiken"],
  ["treningen", "treninga"],
];

/** Varigheter per nivå: hele og halve timer i 1. klasse, kvarter i 2. klasse, fem minutter på utfordrende. */
function lengeVarigheter(nivaa: Nivaa): number[] {
  if (nivaTall(nivaa) === 0) return [30, 60];
  if (nivaTall(nivaa) === 1) return [15, 30, 45, 60, 90];
  return [20, 25, 35, 40, 45, 50, 55, 70, 75];
}

/**
 * «Hvor lenge» spør etter sluttid, starttid eller varighet, med ulike aktiviteter og tider (gj. 10, C2).
 * Variant 1, 4, 7, 10: sluttid. 2, 5, 8, 11: starttid. 3, 6, 9, 12: hele eller halve timer mellom to tider.
 */
function lagLenge(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const slag = (v - 1) % 3;
  const navn = ordlyd(heltall(ctx.tilfeldig, 0, LENGE_AKTIVITET.length - 1), LENGE_AKTIVITET);
  const akt = si(ctx.spraak, navn[0], navn[1]);
  const Akt = akt.charAt(0).toUpperCase() + akt.slice(1);
  const lovlige = tillatteMinutter(ctx.nivaa, ctx.mestring);
  if (slag < 2) {
    const varighet = trekk(ctx.tilfeldig, lengeVarigheter(ctx.nivaa));
    const steg = nivaTall(ctx.nivaa) === 0 ? 30 : nivaTall(ctx.nivaa) === 1 ? 15 : 5;
    const start = klokke(13 + heltall(ctx.tilfeldig, 0, 5), steg * heltall(ctx.tilfeldig, 0, 60 / steg - 1));
    const slutt = normaliser(start + varighet);
    const sporres = slag === 0 ? slutt : start;
    const pakke = klokkeValg(sporres, ctx.tilfeldig, "ord", ctx.spraak, lovlige.length ? lovlige : undefined);
    const tekst =
      slag === 0
        ? ordlyd(Math.floor((v - 1) / 3), [
            ["{Akt} begynner klokka {fra}. Den varer {varighet}. Når er den ferdig?", "{Akt} byrjar klokka {fra}. Det varer {varighet}. Når er det ferdig?"],
            ["{Akt} varer {varighet}. Vi begynner klokka {fra}. Når er vi ferdige?", "{Akt} varer {varighet}. Vi byrjar klokka {fra}. Når er vi ferdige?"],
            ["Klokka {fra} begynner {akt}. Den tar {varighet}. Når slutter den?", "Klokka {fra} byrjar {akt}. Det tek {varighet}. Når sluttar det?"],
            ["{Akt} tar {varighet} og begynner klokka {fra}. Når er det slutt?", "{Akt} tek {varighet} og byrjar klokka {fra}. Når er det slutt?"],
          ])
        : ordlyd(Math.floor((v - 1) / 3), [
            ["{Akt} er ferdig klokka {til}. Den varte {varighet}. Når begynte den?", "{Akt} er ferdig klokka {til}. Det varte {varighet}. Når byrja det?"],
            ["{Akt} sluttet klokka {til}. Den tok {varighet}. Når begynte vi?", "{Akt} slutta klokka {til}. Det tok {varighet}. Når byrja vi?"],
            ["Vi var ferdige med {akt} klokka {til}. Den varte {varighet}. Når startet vi?", "Vi var ferdige med {akt} klokka {til}. Det varte {varighet}. Når starta vi?"],
            ["{Akt} tok {varighet} og var ferdig klokka {til}. Når begynte den?", "{Akt} tok {varighet} og var ferdig klokka {til}. Når byrja det?"],
          ]);
    const oppgave = basis(
      mal,
      ctx,
      si(ctx.spraak, tekst[0], tekst[1], {
        Akt,
        akt,
        fra: tidTilOrd(start, ctx.spraak),
        til: tidTilOrd(slutt, ctx.spraak),
        varighet: varighetTekst(varighet, ctx.spraak),
      }),
      `klokke:${sporres}`,
      pakke.fasit,
      "planke",
    );
    oppgave.maalKlokke = slag === 0 ? start : slutt;
    oppgave.valg = pakke.valg;
    return oppgave;
  }
  const fra = ctx.plan?.start ?? klokke(14, 0);
  const timerFrem = 1 + heltall(ctx.tilfeldig, 0, nivaTall(ctx.nivaa) === 0 ? 1 : 2);
  const til = normaliser(fra + timerFrem * 60);
  const enhetHalv = v % 2 === 0 && nivaTall(ctx.nivaa) > 0;
  const svar = enhetHalv ? timerFrem * 2 : timerFrem;
  const pakke = tallValg(svar, ctx.tilfeldig);
  const tekst = enhetHalv
    ? ordlyd(Math.floor((v - 1) / 3), [
        ["Fra klokka {fra} til klokka {til}. Hvor mange halve timer?", "Frå klokka {fra} til klokka {til}. Kor mange halve timar?"],
        ["{Akt} varer fra klokka {fra} til klokka {til}. Hvor mange halve timer er det?", "{Akt} varer frå klokka {fra} til klokka {til}. Kor mange halve timar er det?"],
      ])
    : ordlyd(Math.floor((v - 1) / 3), [
        ["Fra klokka {fra} til klokka {til}. Hvor mange timer?", "Frå klokka {fra} til klokka {til}. Kor mange timar?"],
        ["{Akt} varer fra klokka {fra} til klokka {til}. Hvor mange timer er det?", "{Akt} varer frå klokka {fra} til klokka {til}. Kor mange timar er det?"],
      ]);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, tekst[0], tekst[1], { Akt, akt, fra: tidTilOrd(fra, ctx.spraak), til: tidTilOrd(til, ctx.spraak) }),
    `klokke:${fra}-${til}`,
    pakke.fasit,
    "planke",
  );
  oppgave.maalKlokke = fra;
  oppgave.tall = til;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function apenKlokke(ctx: OppgaveKontekst, butikk: { apner: number; stenger: number; stengtFra?: number }): number {
  if (ctx.naa !== undefined) return ctx.naa;
  const rull = Math.floor(ctx.tilfeldig() * 6);
  if (rull === 0) return butikk.apner + 30;
  if (rull === 1) return Math.max(0, butikk.apner - 30);
  if (rull === 2 && butikk.stengtFra !== undefined) return butikk.stengtFra + 5;
  if (rull === 3) return Math.max(0, butikk.apner - 60);
  if (rull === 4) return butikk.stenger - 30;
  return butikk.stenger + 15;
}

function lagApen(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const butikk = ctx.plan?.butikk ?? { apner: klokke(14, 0), stenger: klokke(17, 0), stengtHele: false };
  // Spillets klokke bare i variant 1. Ellers en tenkt tid, og teksten sier det (gj. 10, 7.4).
  const brukNaa = v === 1 && ctx.naa !== undefined;
  const naa = brukNaa ? (ctx.naa ?? 0) : apenKlokke({ ...ctx, naa: undefined }, butikk);
  const apen = erApen(naa, butikk);
  const neste = nesteApning(naa, butikk, ctx.plan?.nesteApning);
  const tekst = brukNaa
    ? (["Er butikken åpen nå? Klokka er {naa}.", "Er butikken open no? Klokka er {naa}."] as const)
    : ordlyd(v - 2, [
        ["Tenk deg at klokka er {naa}. Er butikken åpen?", "Tenk deg at klokka er {naa}. Er butikken open?"],
        ["Se på skiltet. Er det åpent klokka {naa}?", "Sjå på skiltet. Er det ope klokka {naa}?"],
        ["Kan vi handle klokka {naa}?", "Kan vi handle klokka {naa}?"],
        ["Tenk deg at du kommer klokka {naa}. Er døra åpen?", "Tenk deg at du kjem klokka {naa}. Er døra open?"],
        ["Naboen vil handle klokka {naa}. Er butikken åpen da?", "Naboen vil handle klokka {naa}. Er butikken open då?"],
        ["Les skiltet. Er butikken åpen klokka {naa}?", "Les skiltet. Er butikken open klokka {naa}?"],
      ]);
  const oppgave = basis(mal, ctx, si(ctx.spraak, tekst[0], tekst[1], { naa: tidTilOrd(naa, ctx.spraak) }), `klokke:${naa}`, apen ? "ja" : "nei", "dor-rektangel");
  oppgave.maalKlokke = butikk.apner;
  oppgave.tall = butikk.stenger;
  oppgave.skilt = {
    naa,
    apner: butikk.apner,
    stenger: butikk.stenger,
    stengtFra: butikk.stengtFra,
    stengtTil: butikk.stengtTil,
    neste,
  };
  oppgave.valg = stokk(ctx.tilfeldig, [
    { id: "ja", ja: true, tekst: si(ctx.spraak, "Åpen", "Open") },
    { id: "nei", ja: false, tekst: si(ctx.spraak, "Stengt", "Stengt") },
  ]);
  return oppgave;
}

function lagUke(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const dager = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag"];
  const ukedag = ctx.plan?.ukedag;
  const iDag = ukedag && dager.includes(ukedag) ? ukedag : undefined;
  const riktig = iDag ?? trekk(ctx.tilfeldig, dager);
  // Distraktorene er nabodagene, så barnet må lese ukeplanen.
  const indeks = dager.indexOf(riktig);
  const naboer = [dager[indeks - 1], dager[indeks + 1], dager[indeks + 2], dager[indeks - 2]].filter((dag): dag is string => Boolean(dag));
  const andre = naboer.slice(0, 2);
  const navn = (dag: string) => ctx.ukedagNavn?.(dag) ?? dag;
  const valg = stokk(ctx.tilfeldig, [riktig, ...andre]).map((dag) => ({ id: dag, tekst: navn(dag) }));
  const avtale = iDag ? ctx.plan?.avtaler.find((rad) => rad.varighet > 0 && rad.aktivitet && rad.slag !== "middag") : undefined;
  const tekst = ordlyd(variant(mal.id) - 1, [
    ["Se på ukeplanen. Hvilken dag er {navn}?", "Sjå på vekeplanen. Kva for dag er {navn}?"],
    ["Når er {navn}? Se på ukeplanen.", "Når er {navn}? Sjå på vekeplanen."],
    ["Finn {navn} i ukeplanen. Hvilken dag er det?", "Finn {navn} i vekeplanen. Kva for dag er det?"],
    ["Ukeplanen viser {navn}. Hvilken dag?", "Vekeplanen viser {navn}. Kva for dag?"],
    ["Hvilken dag står {navn} i ukeplanen?", "Kva for dag står {navn} i vekeplanen?"],
    ["Les ukeplanen. På hvilken dag er {navn}?", "Les vekeplanen. På kva for dag er {navn}?"],
  ]);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, tekst[0], tekst[1], {
      navn: avtale ? visBestemt(avtale.aktivitet ?? avtale.navn, ctx.spraak) : si(ctx.spraak, "biblioteket", "biblioteket"),
    }),
    `dag:${riktig}`,
    riktig,
    "pynt-flagg",
  );
  oppgave.valg = valg;
  // Dagen med avtalen er merket i ukeplanen (gj. 9, oppfølging).
  oppgave.ukeMerke = riktig;
  return oppgave;
}

function lagKalender(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const maneder = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
  const arstider = [
    { id: "vinter", nb: "vinter", nn: "vinter" },
    { id: "var", nb: "vår", nn: "vår" },
    { id: "sommer", nb: "sommer", nn: "sommar" },
    { id: "host", nb: "høst", nn: "haust" },
  ];
  if ((v === 4 || v === 12) && nivaTall(ctx.nivaa) >= 1) {
    // Spørsmålet nevner måneden, så det kan løses uten å vite datoen i spillet.
    const maned = heltall(ctx.tilfeldig, 1, 12);
    const riktig = maned === 12 || maned <= 2 ? "vinter" : maned <= 5 ? "var" : maned <= 8 ? "sommer" : "host";
    const valg = stokk(ctx.tilfeldig, arstider).map((rad) => ({
      id: rad.id,
      tekst: arstidTekst(ctx.spraak, rad.id),
    }));
    const navn = manedTekst(ctx.spraak, maneder[maned - 1] ?? "januar");
    const oppgave = basis(
      mal,
      ctx,
      si(ctx.spraak, "Hvilken årstid hører {maned} til?", "Kva for årstid høyrer {maned} til?", { maned: navn }),
      `arstid:${riktig}`,
      riktig,
      "jord",
    );
    oppgave.valg = valg;
    return oppgave;
  }
  const justert = malFerdighet(mal);
  if (justert.ferdighet === "maneder" && v !== 4) {
    const fra = (ctx.plan?.dato.maned ?? 8) - 1;
    const indeks = (fra + 1) % 12;
    const riktig = maneder[indeks] ?? "august";
    const andre = [maneder[(indeks + 10) % 12] ?? "mai", maneder[(indeks + 1) % 12] ?? "juni"];
    const valg = stokk(ctx.tilfeldig, [riktig, ...andre]).map((navn) => ({ id: navn, tekst: manedTekst(ctx.spraak, navn) }));
    const oppgave = basis(
      mal,
      ctx,
      si(ctx.spraak, "Hvilken måned kommer etter {maned}?", "Kva for månad kjem etter {maned}?", { maned: manedTekst(ctx.spraak, maneder[fra] ?? "juli") }),
      `maned:${riktig}`,
      riktig,
      "pynt-blomst",
    );
    oppgave.valg = valg;
    return oppgave;
  }
  const dager = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
  const iDag = ctx.plan?.ukedag ?? "mandag";
  const navn = (dag: string) => ctx.ukedagNavn?.(dag) ?? dag;
  const pluss = (dag: string, n: number) => dager[(((dager.indexOf(dag) + n) % 7) + 7) % 7] ?? "mandag";
  // Seks spørsmål om ukedagene. Ukeplanen viser dagen spørsmålet går ut fra (gj. 10, C2).
  const slag = (v - 1) % 6;
  const fra = slag === 3 || slag === 4 ? trekk(ctx.tilfeldig, dager) : iDag;
  const flytt = [1, -1, 2, 1, -1, 0][slag] ?? 1;
  const riktig = pluss(fra, flytt);
  const tekst = ordlyd(slag, [
    ["Hvilken dag er i morgen?", "Kva for dag er i morgon?"],
    ["Hvilken dag var i går?", "Kva for dag var i går?"],
    ["Hvilken dag er i overmorgen?", "Kva for dag er i overmorgon?"],
    ["Hvilken dag kommer etter {dag}?", "Kva for dag kjem etter {dag}?"],
    ["Hvilken dag kommer før {dag}?", "Kva for dag kjem før {dag}?"],
    ["Hvilken dag er det i dag?", "Kva for dag er det i dag?"],
  ]);
  const valgDag = stokk(ctx.tilfeldig, [riktig, pluss(riktig, 1), pluss(riktig, -1)]).map((dag) => ({ id: dag, tekst: navn(dag) }));
  const oppgave = basis(mal, ctx, si(ctx.spraak, tekst[0], tekst[1], { dag: navn(fra) }), `dag:${riktig}`, riktig, "pynt-blomst");
  oppgave.valg = valgDag;
  // Ukeplanen viser dagen spørsmålet går ut fra.
  oppgave.ukeMerke = fra;
  return oppgave;
}

function formerFor(ctx: OppgaveKontekst): Form2dId[] {
  if (nivaTall(ctx.nivaa) === 0) return [...GRUNNFORMER];
  return [...ALLE_2D];
}

function blandLike(ctx: OppgaveKontekst, maal: string, andre: readonly string[]): { figurer: { id: string; form: string }[]; fasit: string } {
  const riktige = 2 + Math.floor(ctx.tilfeldig() * 2);
  const valgt = Array.from({ length: riktige }, () => maal);
  const distrakt = stokk(ctx.tilfeldig, andre.filter((form) => form !== maal));
  while (valgt.length < 5 && distrakt.length > 0) {
    const neste = distrakt.shift();
    if (neste && !valgt.includes(neste)) valgt.push(neste);
  }
  const figurer = stokk(ctx.tilfeldig, valgt).map((form, indeks) => ({ id: `f${indeks}`, form }));
  const fasit = figurer
    .filter((figur) => figur.form === maal)
    .map((figur) => figur.id)
    .sort()
    .join(",");
  return { figurer, fasit };
}

function lagFinn(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const prompt = (id: string) => {
    const navn = formFlertall(id, ctx.spraak);
    const tekst = ordlyd(variant(mal.id) - 1, [
      ["Finn alle {navn}.", "Finn alle {navn}."],
      ["Trykk på alle {navn}.", "Trykk på alle {navn}."],
      ["Hvor er {navn}? Finn alle.", "Kvar er {navn}? Finn alle."],
      ["Se godt etter. Finn alle {navn}.", "Sjå godt etter. Finn alle {navn}."],
      ["Kan du finne alle {navn}?", "Kan du finne alle {navn}?"],
      ["Pek på alle {navn}.", "Peik på alle {navn}."],
    ]);
    return si(ctx.spraak, tekst[0], tekst[1], { navn });
  };
  if (mal.ferdighet === "former-3d") {
    const former = ["kule", "kube", "sylinder", "kjegle"] as const;
    const start = variant(mal.id) % former.length;
    const rotert = [...former.slice(start), ...former.slice(0, start)];
    const onsket = ctx.maalForm && (former as readonly string[]).includes(ctx.maalForm) ? ctx.maalForm : undefined;
    const ukjent = former.find((id) => !(ctx.kjente3d ?? []).includes(id));
    const maal = onsket ?? ukjent ?? rotert.find((id) => !unngas(ctx, `form3d:${id}`)) ?? rotert[0] ?? "kule";
    const blandet = blandLike(ctx, maal, former.filter((id) => id !== maal));
    const vare = maal === "kule" ? "kloss-kule" : maal === "kube" ? "kloss-kube" : maal === "sylinder" ? "kloss-sylinder" : "kloss-kjegle";
    const oppgave = basis(mal, ctx, prompt(maal), `form3d:${maal}`, blandet.fasit, vare);
    oppgave.form = maal;
    oppgave.form3d = maal;
    const forsok = ctx.mestring["former-3d"]?.forsok ?? 0;
    // Forklaringen er en hjelpelinje, ikke en del av oppgaven. Bare de tre første gangene (gj. 9, B5).
    if (maal === "kule" && forsok < 3) oppgave.hjelp = si(ctx.spraak, "Kule = rund som en ball.", "Kule = rund som ein ball.");
    oppgave.varer = blandet.figurer;
    return oppgave;
  }
  const liste = formerFor(ctx);
  const onsket = ctx.maalForm && liste.includes(ctx.maalForm as Form2dId) ? (ctx.maalForm as Form2dId) : undefined;
  const maal = onsket ?? (formUnnga(ctx, liste) as Form2dId);
  const blandet = blandLike(ctx, maal, liste.filter((id) => id !== maal));
  const oppgave = basis(mal, ctx, prompt(maal), `form:${maal}`, blandet.fasit, vareForForm(maal));
  oppgave.form = maal;
  oppgave.varer = blandet.figurer;
  return oppgave;
}

function lagOdd(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  // Formene trekkes, så svaret varierer. Ordlyden følger varianten (gj. 10, C2).
  const liste = formerFor(ctx);
  const like = trekk(ctx.tilfeldig, liste);
  const naer = (a: string, b: string) => (a === "kvadrat" && b === "rektangel") || (a === "rektangel" && b === "kvadrat") || (a === "sirkel" && b === "oval") || (a === "oval" && b === "sirkel");
  const ut = trekk(ctx.tilfeldig, liste.filter((form) => form !== like && !naer(form, like)));
  const inn = [like, like, like];
  const oddTekst = ordlyd(v - 1, [
    ["Hvilken form er ulik de andre?", "Kva for form er ulik dei andre?"],
    ["Én form passer ikke. Hvilken?", "Éi form passar ikkje. Kva for ei?"],
    ["Hvilken form hører ikke med?", "Kva for form høyrer ikkje med?"],
    ["Finn formen som er annerledes.", "Finn forma som er annleis."],
    ["Tre er like. Hvilken er ikke lik?", "Tre er like. Kva for ei er ikkje lik?"],
    ["Hvilken form skal ut av kassen?", "Kva for form skal ut av kassen?"],
  ]);
  const figurer = [
    { id: "a", form: inn[0] ?? "sirkel" },
    { id: "b", form: inn[1] ?? "sirkel" },
    { id: "c", form: inn[2] ?? "sirkel" },
    { id: "d", form: ut },
  ];
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, oddTekst[0], oddTekst[1]),
    `form:${ut}`,
    "d",
    vareForForm(ut),
  );
  oppgave.varer = figurer;
  oppgave.valg = stokk(ctx.tilfeldig, figurer.map((figur) => ({ id: figur.id, form: figur.form, tekst: formNavn(figur.form, ctx.spraak) })));
  oppgave.form = ut;
  return oppgave;
}

function lagSorter(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const regel = v % 3;
  let varer: { id: string; form: string; stor?: number }[];
  let kasser: { id: string; tekst: string; symbol?: string }[];
  let plass: (form: string) => string;
  if (regel === 1) {
    varer = [
      { id: "v1", form: "trekant", stor: 64 },
      { id: "v2", form: "kvadrat", stor: 48 },
      { id: "v3", form: "trekant", stor: 40 },
      { id: "v4", form: "rektangel", stor: 72 },
      { id: "v5", form: "kvadrat", stor: 56 },
      { id: "v6", form: "trekant", stor: 52 },
    ];
    kasser = [
      { id: "tre", tekst: si(ctx.spraak, "3 hjørner", "3 hjørne"), symbol: "trekant" },
      { id: "fire", tekst: si(ctx.spraak, "4 hjørner", "4 hjørne"), symbol: "kvadrat" },
    ];
    plass = (form) => (form === "trekant" ? "tre" : "fire");
  } else if (regel === 2 && nivaTall(ctx.nivaa) > 0) {
    varer = [
      { id: "v1", form: "kule", stor: 56 },
      { id: "v2", form: "kube", stor: 64 },
      { id: "v3", form: "sylinder", stor: 48 },
      { id: "v4", form: "kjegle", stor: 60 },
      { id: "v5", form: "kube", stor: 40 },
    ];
    kasser = [
      { id: "triller", tekst: si(ctx.spraak, "Kan trille", "Kan trille"), symbol: "kule" },
      { id: "stille", tekst: si(ctx.spraak, "Kan ikke trille", "Kan ikkje trille"), symbol: "kube" },
    ];
    plass = (form) => (form === "kube" ? "stille" : "triller");
  } else {
    varer = [
      { id: "v1", form: "sirkel", stor: 64 },
      { id: "v2", form: "trekant", stor: 48 },
      { id: "v3", form: "oval", stor: 56 },
      { id: "v4", form: "kvadrat", stor: 40 },
      { id: "v5", form: "rektangel", stor: 72 },
      { id: "v6", form: "sirkel", stor: 36 },
    ];
    kasser = [
      { id: "rund", tekst: si(ctx.spraak, "Rund", "Rund"), symbol: "sirkel" },
      { id: "kant", tekst: si(ctx.spraak, "Hjørner", "Hjørne"), symbol: "kvadrat" },
    ];
    plass = (form) => (form === "sirkel" || form === "oval" ? "rund" : "kant");
  }
  // Fem av varene trekkes og stokkes, så samme regel ikke gir samme oppgave hver gang (gj. 10, C2).
  varer = stokk(ctx.tilfeldig, varer)
    .slice(0, 5)
    .map((vare, indeks) => ({ ...vare, id: `v${indeks + 1}` }));
  const fasit = varer
    .map((vare) => `${vare.id}:${plass(vare.form)}`)
    .sort()
    .join(",");
  const brukt = regel === 2 && nivaTall(ctx.nivaa) > 0 ? 2 : regel === 1 ? 1 : 0;
  const sortTekst = ordlyd(Math.floor((v - 1) / 3), ([
    [
      ["Rund eller med hjørner? Sorter.", "Rund eller med hjørne? Sorter."],
      ["Legg de runde formene for seg.", "Legg dei runde formene for seg."],
      ["Hjelp ekspeditøren å rydde hylla.", "Hjelp ekspeditøren å rydde hylla."],
    ],
    [
      ["Sorter etter antall hjørner.", "Sorter etter talet på hjørne."],
      ["Tell hjørnene. Legg formene i riktig kasse.", "Tel hjørna. Legg formene i rett kasse."],
      ["Legg formene i riktig kasse.", "Legg formene i rett kasse."],
    ],
    [
      ["Hvilke kan trille? Legg dem i kassen.", "Kva for nokre kan trille? Legg dei i kassen."],
      ["Sorter i kassene.", "Sorter i kassane."],
      ["Hjelp ekspeditøren. Hva kan trille?", "Hjelp ekspeditøren. Kva kan trille?"],
    ],
  ] as (readonly [string, string])[][])[brukt] ?? []);
  const oppgave = basis(mal, ctx, si(ctx.spraak, sortTekst[0], sortTekst[1]), "form:sorter", fasit, "vindu-kvadrat");
  oppgave.varer = varer;
  oppgave.kasser = kasser;
  return oppgave;
}

function lagTegn(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const lov = nivaTall(ctx.nivaa) === 0 ? (["sirkel", "trekant", "kvadrat", "rektangel"] as Form2dId[]) : formerFor(ctx);
  const onsket = ctx.maalForm && lov.includes(ctx.maalForm as Form2dId) ? (ctx.maalForm as Form2dId) : undefined;
  const form = onsket ?? formUnnga(ctx, lov);
  const tekst = ordlyd(variant(mal.id) - 1, [
    ["Tegn {formA}.", "Teikn {formA}."],
    ["Kan du tegne {formA}?", "Kan du teikne {formA}?"],
    ["Lag {formA} med fingeren.", "Lag {formA} med fingeren."],
    ["Tegn {formA} på arket.", "Teikn {formA} på arket."],
    ["Snekkeren trenger {formA}. Tegn den.", "Snikkaren treng {formA}. Teikn den."],
    ["Bruk fingeren. Tegn {formA}.", "Bruk fingeren. Teikn {formA}."],
  ]);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, tekst[0], tekst[1], { formA: formMedArtikkel(form, ctx.spraak) }),
    `form:${form}`,
    "ok",
    vareForForm(form),
  );
  oppgave.form = form;
  return oppgave;
}

function lagTell(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  if (v === 3 || v === 4 || v === 11) {
    const onsket3d = ctx.maalForm && (ALLE_3D as readonly string[]).includes(ctx.maalForm) ? (ctx.maalForm as Form3dId) : undefined;
    const flate = ALLE_3D.filter((form) => form === "kube" || form === "prisme" || form === "pyramide");
    const id = v === 4 ? (onsket3d && (flate as readonly string[]).includes(onsket3d) ? onsket3d : trekk(ctx.tilfeldig, flate)) : (onsket3d ?? trekk(ctx.tilfeldig, ALLE_3D));
    const form = form3d(id);
    const tall = v === 4 ? form.flater : v === 11 ? form.hjorner : form.kanter;
    const pakke = tallValg(tall, ctx.tilfeldig);
    const oppgave = basis(
      mal,
      ctx,
      si(
        ctx.spraak,
        v === 4 ? "Hvor mange flater har klossen?" : v === 11 ? "Tell hjørnene på klossen." : "Hvor mange kanter har klossen?",
        v === 4 ? "Kor mange flater har klossen?" : v === 11 ? "Tel hjørna på klossen." : "Kor mange kantar har klossen?",
      ),
      `form:${id}`,
      pakke.fasit,
      vareForForm(id),
    );
    oppgave.form3d = id;
    oppgave.tall = tall;
    oppgave.valg = pakke.valg;
    oppgave.ferdighet = "telle-3d";
    return oppgave;
  }
  const med2d = formerFor(ctx).filter((form) => form2d(form).sider > 0);
  const onsket2d = ctx.maalForm && (med2d as readonly string[]).includes(ctx.maalForm) ? (ctx.maalForm as Form2dId) : undefined;
  const id = onsket2d ?? (formUnnga(ctx, med2d) as Form2dId);
  const form = form2d(id);
  const tall = v === 6 ? form.retteVinkler : v % 2 === 0 ? form.hjorner : form.sider;
  const pakke = tallValg(tall, ctx.tilfeldig);
  const ordlydTell = ordlyd(
    Math.floor((v - 1) / 2),
    v % 2 === 0
      ? [
          ["Tell hjørnene.", "Tel hjørna."],
          ["Hvor mange hjørner har formen?", "Kor mange hjørne har forma?"],
          ["Tell alle hjørnene på formen.", "Tel alle hjørna på forma."],
        ]
      : [
          ["Tell sidene.", "Tel sidene."],
          ["Hvor mange sider har formen?", "Kor mange sider har forma?"],
          ["Tell alle sidene på formen.", "Tel alle sidene på forma."],
        ],
  );
  const prompt = v === 6 ? "Hvor mange hjørner er helt rette, som hjørnet på en bok?" : ordlydTell[0];
  const promptNn = v === 6 ? "Kor mange hjørne er heilt rette, som hjørnet på ei bok?" : ordlydTell[1];
  const oppgave = basis(mal, ctx, si(ctx.spraak, prompt, promptNn), `form:${id}`, pakke.fasit, vareForForm(id));
  oppgave.form = id;
  oppgave.tall = tall;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function monsterPar(v: number, voksende: boolean): { sekvens: string[]; neste: string; farge?: string[]; stor?: number[] } {
  const a = "kvadrat";
  const b = "sirkel";
  const c = "trekant";
  if (voksende) return { sekvens: [a, a, b, a, b, b], neste: a };
  const m = v % 5;
  if (m === 1) return { sekvens: [a, a, b, a, a, b], neste: a };
  if (m === 2) return { sekvens: [a, b, c, a, b, c], neste: a };
  if (m === 3) return { sekvens: [a, b, b, a, b, b], neste: a };
  if (m === 4) {
    const farge = ["takRodt", "takBlatt", "takRodt", "takBlatt"];
    return { sekvens: [b, b, b, b], neste: b, farge: [...farge, "takRodt"] };
  }
  const stor = [1, 2, 1, 2, 1];
  return { sekvens: [a, a, a, a], neste: "1", stor };
}

function lagMonster(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const voksende = ctx.nivaa === "utfordrende" && v % 5 === 0;
  const laget = monsterPar(v, voksende);
  const neste = laget.farge ? (laget.farge.at(-1) ?? "takRodt") : laget.stor ? String(laget.stor.at(-1) ?? 1) : laget.neste;
  const sekvens = laget.sekvens;
  const pakke = laget.farge
    ? ["takRodt", "takBlatt", "aksentGul"]
    : laget.stor
      ? ["1", "2", "3"]
      : stokk(ctx.tilfeldig, [laget.neste, laget.neste === "kvadrat" ? "sirkel" : "kvadrat", "trekant"]);
  const unike = [...new Set(pakke)];
  while (!laget.farge && unike.length < 3) unike.push(unike.length === 1 ? "rektangel" : "femkant");
  const oppgave = basis(
    mal,
    ctx,
    (() => {
      const tekst = ordlyd(v - 1, [
        ["Hva kommer etterpå?", "Kva kjem etterpå?"],
        ["Hvilken form mangler?", "Kva for form manglar?"],
        ["Fortsett rekka.", "Hald fram med rekkja."],
        ["Hva skal stå på det tomme feltet?", "Kva skal stå på det tomme feltet?"],
        ["Hjelp kjæledyret å legge ferdig fortauet.", "Hjelp kjæledyret å leggje ferdig fortauet."],
        ["Hvilken flis kommer nå?", "Kva for flis kjem no?"],
      ]);
      const setning = si(ctx.spraak, tekst[0], tekst[1]);
      return voksende ? `${si(ctx.spraak, "Mønsteret vokser.", "Mønsteret veks.")} ${setning}` : setning;
    })(),
    `form:${neste}`,
    neste,
    vareForForm(laget.neste),
  );
  oppgave.monster = sekvens;
  oppgave.monsterFarge = laget.farge?.slice(0, -1);
  oppgave.monsterStor = laget.stor?.slice(0, -1);
  oppgave.valg = laget.stor
    ? [
        { id: "1", form: "kvadrat", tekst: "liten" },
        { id: "2", form: "kvadrat", tekst: "stor" },
        { id: "3", form: "kvadrat", tekst: "størst" },
      ]
    : unike.slice(0, 3).map((form) => ({
        id: form,
        form: laget.farge ? "sirkel" : form,
        tekst: form === "takRodt" ? "rød" : form === "takBlatt" ? "blå" : form === "aksentGul" ? "gul" : undefined,
      }));
  oppgave.fasit = neste;
  return oppgave;
}

function lagStempel(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const onsket = ctx.maalForm && (ALLE_3D as readonly string[]).includes(ctx.maalForm) ? (ctx.maalForm as Form3dId) : undefined;
  const id = onsket ?? (formUnnga(ctx, ALLE_3D) as Form3dId);
  const stempel = form3d(id).stempel;
  const flater = id === "pyramide" ? (["kvadrat", "trekant"] as Form2dId[]) : [stempel];
  const andre = ALLE_2D.filter((form) => !flater.includes(form)).slice(0, 2);
  const valg = stokk(ctx.tilfeldig, [...new Set([...flater, ...andre])]).map((form) => ({ id: form, form, tekst: formNavn(form, ctx.spraak) }));
  const oppgave = basis(
    mal,
    ctx,
    (() => {
      const tekst = ordlyd(variant(mal.id) - 1, [
        ["Klossen trykkes ned i sanden. Hvilken form får merket?", "Klossen vert trykt ned i sanden. Kva for form får merket?"],
        ["Hvilken form blir avtrykket?", "Kva for form blir avtrykket?"],
        ["Klossen lager et merke i leira. Hvilken form har merket?", "Klossen lagar eit merke i leira. Kva for form har merket?"],
        ["Vi trykker klossen ned i deigen. Hvilken form får merket?", "Vi trykkjer klossen ned i deigen. Kva for form får merket?"],
        ["Klossen står i snøen. Hvilket merke blir igjen?", "Klossen står i snøen. Kva for merke blir att?"],
        ["Hvilken form har flaten klossen står på?", "Kva for form har flata klossen står på?"],
      ]);
      return si(ctx.spraak, tekst[0], tekst[1]);
    })(),
    `form:${id}`,
    stempel,
    vareForForm(id),
  );
  oppgave.form3d = id;
  oppgave.valg = valg;
  oppgave.form = stempel;
  return oppgave;
}

function lagLengde(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const planke = trekk(ctx.tilfeldig, PLANKER);
  const cm = variant(mal.id) % 2 === 0 && nivaTall(ctx.nivaa) > 0;
  const svar = cm ? planke.cm : planke.klosser;
  const pakke = cm ? tiValg(svar, ctx.tilfeldig) : tallValg(svar, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    (() => {
      const indeks = Math.floor((variant(mal.id) - 1) / 2);
      const tekst = cm
        ? ordlyd(indeks, [
            ["Linjalen viser centimeter. Hvor mange centimeter er planken?", "Linjalen viser centimeter. Kor mange centimeter er planken?"],
            ["Hvor lang er planken i centimeter?", "Kor lang er planken i centimeter?"],
            ["Les linjalen. Hvor mange centimeter er planken?", "Les linjalen. Kor mange centimeter er planken?"],
          ])
        : ordlyd(indeks, [
            ["Hvor mange klosser lang er planken?", "Kor mange klossar lang er planken?"],
            ["Mål planken med klosser. Hvor mange trengs?", "Mål planken med klossar. Kor mange trengst?"],
            ["Planken er like lang som noen klosser. Hvor mange?", "Planken er like lang som nokre klossar. Kor mange?"],
          ]);
      return si(ctx.spraak, tekst[0], tekst[1]);
    })(),
    `planke:${planke.id}`,
    pakke.fasit,
    "planke",
  );
  oppgave.tall = svar;
  oppgave.valg = pakke.valg;
  oppgave.form = planke.id;
  oppgave.planke = { klosser: planke.klosser, cm };
  return oppgave;
}

/** Svar i hele tiere: 30, 40, 50 cm. */
function tiValg(riktig: number, tilfeldig: Tilfeldig): { valg: Valg[]; fasit: string } {
  const pakke = tallValg(riktig / 10, tilfeldig);
  return {
    valg: pakke.valg.map((valg) => ({ id: `t${(valg.tall ?? 0) * 10}`, tall: (valg.tall ?? 0) * 10, tekst: String((valg.tall ?? 0) * 10) })),
    fasit: `t${riktig}`,
  };
}

const KILO_TEKST: readonly (readonly [string, string])[] = [
  ["Hvor mange kilo veier sekken? Hvert lodd veier 1 kilo.", "Kor mange kilo veg sekken? Kvart lodd veg 1 kilo."],
  ["Vekta er i likevekt. Hvert lodd er 1 kilo. Hvor tung er sekken?", "Vekta er i likevekt. Kvart lodd er 1 kilo. Kor tung er sekken?"],
  ["Tell loddene. Hvert lodd veier 1 kilo. Hvor mange kilo veier sekken?", "Tel lodda. Kvart lodd veg 1 kilo. Kor mange kilo veg sekken?"],
];

function lagMasse(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const varer = Object.entries(VEKT_KG);
  const [navn, kg] = trekk(ctx.tilfeldig, varer);
  const v = variant(mal.id);
  if (v % 2 === 0) {
    const liten = navn === "spiker" ? "maling" : "spiker";
    const litenKg = VEKT_KG[liten] ?? 1;
    if (kg % litenKg !== 0) {
      const pakkeKg = tallValg(kg, ctx.tilfeldig);
      const kiloTekst = ordlyd(Math.floor((v - 1) / 2), KILO_TEKST);
      const kilo = basis(
        mal,
        ctx,
        si(ctx.spraak, kiloTekst[0], kiloTekst[1]),
        `vekt:${navn}`,
        pakkeKg.fasit,
        navn as VareId,
      );
      kilo.tall = kg;
      kilo.valg = pakkeKg.valg;
      kilo.form = navn;
      kilo.vekt = { lodd: kg, loddKg: 1 };
      return kilo;
    }
    const svar = kg / litenKg;
    const pakke = tallValg(svar, ctx.tilfeldig);
    const oppgave = basis(
      mal,
      ctx,
      (() => {
        const tekst = ordlyd(Math.floor((v - 1) / 2), [
          ["Sekken veier {kg} kilo. Hvor mange {vare} veier like mye?", "Sekken veg {kg} kilo. Kor mange {vare} veg like mykje?"],
          ["Hvor mange {vare} må på vekta for å veie som sekken? Sekken veier {kg} kilo.", "Kor mange {vare} må på vekta for å vege som sekken? Sekken veg {kg} kilo."],
          ["Vekta skal være i likevekt. Sekken veier {kg} kilo. Hvor mange {vare} trengs?", "Vekta skal vere i likevekt. Sekken veg {kg} kilo. Kor mange {vare} trengst?"],
        ]);
        return si(ctx.spraak, tekst[0], tekst[1], { kg: String(kg), vare: navnVare(liten, ctx.spraak) });
      })(),
      `vekt:${navn}`,
      pakke.fasit,
      navn as VareId,
    );
    oppgave.tall = svar;
    oppgave.valg = pakke.valg;
    oppgave.form = navn;
    oppgave.vekt = { sekkKg: kg, lodd: 1, loddKg: litenKg };
    return oppgave;
  }
  const pakke = tallValg(kg, ctx.tilfeldig);
  const kiloTekst = ordlyd(Math.floor((v - 1) / 2), KILO_TEKST);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, kiloTekst[0], kiloTekst[1]),
    `vekt:${navn}`,
    pakke.fasit,
    navn as VareId,
  );
  oppgave.tall = kg;
  oppgave.valg = pakke.valg;
  oppgave.form = navn;
  // Vekta er i likevekt: sekken på den ene siden, like mange kilolodd på den andre (gj. 9, oppfølging).
  oppgave.vekt = { lodd: kg, loddKg: 1 };
  return oppgave;
}

function lagAreal(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const trenger = 4 + heltall(ctx.tilfeldig, 0, 3);
  const roller = stokk(ctx.tilfeldig, ["A1", "B2", "C3"]);
  const tomter = [
    { id: roller[0] ?? "A1", ruter: trenger - 2 },
    { id: roller[1] ?? "B2", ruter: trenger },
    { id: roller[2] ?? "C3", ruter: trenger + 2 },
  ];
  const v = variant(mal.id);
  const slag = (v - 1) % 3;
  const arealTekst = ordlyd(v - 1, [
    ["Du trenger {n} ruter. Hvilken tomt har akkurat nok plass?", "Du treng {n} ruter. Kva for tomt har akkurat nok plass?"],
    ["Hvilken tomt er størst?", "Kva for tomt er størst?"],
    ["Hvilken tomt er minst?", "Kva for tomt er minst?"],
    ["Huset trenger {n} ruter. Hvilken tomt passer akkurat?", "Huset treng {n} ruter. Kva for tomt passar akkurat?"],
    ["Tell rutene. Hvilken tomt har flest?", "Tel rutene. Kva for tomt har flest?"],
    ["Tell rutene. Hvilken tomt har færrest?", "Tel rutene. Kva for tomt har færrast?"],
  ]);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, arealTekst[0], arealTekst[1], { n: String(trenger) }),
    `areal:${trenger}`,
    slag === 1 ? (roller[2] ?? "C3") : slag === 2 ? (roller[0] ?? "A1") : (roller[1] ?? "B2"),
    "jord",
  );
  oppgave.ruter = tomter;
  oppgave.tall = trenger;
  oppgave.valg = stokk(
    ctx.tilfeldig,
    tomter.map((tomt) => ({ id: tomt.id, tall: tomt.ruter, tekst: tomt.id })),
  );
  return oppgave;
}

function lagKoord(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const x = heltall(ctx.tilfeldig, 0, 5);
  const y = heltall(ctx.tilfeldig, 0, 5);
  const riktig = ruteNavn(x, y);
  const andre = [ruteNavn((x + 1) % 6, y), ruteNavn(x, (y + 1) % 6)];
  const valg = stokk(ctx.tilfeldig, [riktig, ...andre]).map((id) => ({ id, tekst: id }));
  const oppgave = basis(
    mal,
    ctx,
    (() => {
      const tekst = ordlyd(variant(mal.id) - 1, [
        ["Hvor skal du bygge?", "Kor skal du byggje?"],
        ["Hvilken rute er merket?", "Kva for rute er merkt?"],
        ["Les kartet. Hva heter ruta?", "Les kartet. Kva heiter ruta?"],
        ["Hvor står flagget på kartet?", "Kvar står flagget på kartet?"],
        ["Finn ruta til tomta. Hvilken er det?", "Finn ruta til tomta. Kva for ei er det?"],
        ["Bokstav og tall. Hvilken rute er det?", "Bokstav og tal. Kva for rute er det?"],
      ]);
      return si(ctx.spraak, tekst[0], tekst[1]);
    })(),
    `rute:${riktig}`,
    riktig,
    "vegg-stein",
  );
  oppgave.koordinat = riktig;
  oppgave.valg = valg;
  return oppgave;
}

function lagVekt(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const liten = 2 + heltall(ctx.tilfeldig, 0, 1);
  const antall = 2 + heltall(ctx.tilfeldig, 0, 2);
  const stor = liten * antall;
  const pakke = tallValg(antall, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    (() => {
      const tekst = ordlyd(variant(mal.id) - 1, [
        ["Den store veier {stor} kilo. Hver liten veier {liten} kilo. Hvor mange småsekker veier like mye?", "Den store veg {stor} kilo. Kvar liten veg {liten} kilo. Kor mange småsekkar veg like mykje?"],
        ["Hvor mange småsekker må til for å veie {stor} kilo? Hver veier {liten} kilo.", "Kor mange småsekkar må til for å vege {stor} kilo? Kvar veg {liten} kilo."],
        ["Vekta skal være i likevekt. Den store sekken veier {stor} kilo. Småsekkene veier {liten} kilo. Hvor mange trengs?", "Vekta skal vere i likevekt. Den store sekken veg {stor} kilo. Småsekkane veg {liten} kilo. Kor mange trengst?"],
        ["Småsekkene veier {liten} kilo hver. Hvor mange veier like mye som {stor} kilo?", "Småsekkane veg {liten} kilo kvar. Kor mange veg like mykje som {stor} kilo?"],
        ["Fyll den andre siden. Hver sekk er {liten} kilo, og den store er {stor} kilo. Hvor mange sekker?", "Fyll den andre sida. Kvar sekk er {liten} kilo, og den store er {stor} kilo. Kor mange sekkar?"],
        ["Hvor mange sekker på {liten} kilo veier som én sekk på {stor} kilo?", "Kor mange sekkar på {liten} kilo veg som éin sekk på {stor} kilo?"],
      ]);
      return si(ctx.spraak, tekst[0], tekst[1], { stor: String(stor), liten: String(liten) });
    })(),
    `vekt:${stor}`,
    pakke.fasit,
    "sand",
  );
  oppgave.tall = stor;
  oppgave.valg = pakke.valg;
  oppgave.form = String(liten);
  oppgave.vekt = { sekkKg: stor, lodd: 1, loddKg: liten };
  return oppgave;
}

const LAG: Record<OppgaveType, (mal: Mal, ctx: OppgaveKontekst) => Oppgave> = {
  "still-klokka": lagStill,
  "les-klokka": lagLes,
  koble: lagKoble,
  "rekker-jeg": lagRekker,
  "hvor-lenge": lagLenge,
  apningstider: lagApen,
  ukeplan: lagUke,
  kalender: lagKalender,
  "finn-formen": lagFinn,
  "hvem-passer-ikke": lagOdd,
  sorter: lagSorter,
  tegn: lagTegn,
  tell: lagTell,
  monster: lagMonster,
  stempel: lagStempel,
  lengde: lagLengde,
  masse: lagMasse,
  areal: lagAreal,
  koordinater: lagKoord,
  likevekt: lagVekt,
};

export function lagFraMal(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  return LAG[mal.type](mal, ctx);
}

export function trekkType(type: OppgaveType, ctx: OppgaveKontekst): Oppgave {
  const maler = malerFor(type).filter((mal) => !ctx.unngaMal.includes(mal.id) && malPassert(mal, ctx));
  if (maler.length === 0) throw new Error(`ingen mal for ${type}`);
  return lagFraMal(trekk(ctx.tilfeldig, maler), ctx);
}

export function likOppgave(oppgave: Oppgave, ctx: OppgaveKontekst): Oppgave {
  const mal = MALER.find((rad) => rad.id === oppgave.mal);
  if (!mal) return trekkOppgave(ctx);
  return lagFraMal(mal, ctx);
}

const ROM = ["kule", "kube", "sylinder", "kjegle"];

export function trekkOppgave(ctx: OppgaveKontekst): Oppgave {
  if (ctx.nivaa === "blandet" && !ctx.blandetValgt) {
    const rull = spredt(ctx.tilfeldig());
    const nivaa = rull < 1 / 3 ? "forste" : rull < 2 / 3 ? "andre" : "utfordrende";
    return trekkOppgave({ ...ctx, nivaa, blandetValgt: true });
  }
  let alle = MALER.filter((mal) => malPassert(mal, ctx) && (ctx.type ? mal.type === ctx.type : true));
  if (ctx.maalForm && ROM.includes(ctx.maalForm)) {
    const tredimensjonal = alle.filter((mal) => mal.ferdighet === "former-3d");
    if (tredimensjonal.length) alle = tredimensjonal;
  }
  const ledige = alle.filter((mal) => !ctx.unngaMal.includes(mal.id));
  const pool = ledige.length ? ledige : alle;
  if (pool.length === 0) {
    if (ctx.hylle && (ctx.type || ctx.maalForm)) return trekkOppgave({ ...ctx, type: undefined, maalForm: undefined, blandetValgt: true });
    return trekkOppgave({ ...ctx, type: undefined, hylle: undefined, maalForm: undefined, blandetValgt: true });
  }
  const vilHaOverraskelse = spredt(ctx.tilfeldig()) < 1 / 8;
  const overraskelse = pool.filter((mal) => mal.overraskelse);
  const vanlige = pool.filter((mal) => !mal.overraskelse);
  const valgt = trekk(ctx.tilfeldig, vilHaOverraskelse && overraskelse.length ? overraskelse : vanlige.length ? vanlige : pool);
  return lagFraMal(valgt, ctx);
}
