import { ruteNavn } from "../bygg/kart";
import { PLANKER, VEKT_KG } from "../bygg/katalog";
import { heltall, stokk, trekk, type Tilfeldig } from "../felles/tilfeldig";
import { ALLE_2D, ALLE_3D, GRUNNFORMER, form2d, form3d, type Form2dId, type Form3dId } from "../former/definisjoner";
import { ferdighetApent, tillatteMinutter } from "../tilpasning/mestring";
import { formFlertall, formNavn, mal, navnVare } from "../tekst/ordbok";
import { arstidTekst, manedTekst } from "../tekst/spraak";
import { timeNavn } from "../tid/ord";
import { klokke, normaliser, tidTilDigital24, tidTilOrd } from "../tid/tid";
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
  type?: OppgaveType;
  hylle?: Hylle;
  maalForm?: string;
  kjente3d?: string[];
  tidsromPa?: boolean;
  ukedagNavn?: (dag: string) => string;
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
    if (`klokke:${verdi}` !== ctx.unngaNokkel) return verdi;
  }
  return klokke(14, lovlige.includes(30) ? 30 : 0);
}

function klokkeValg(riktig: number, tilfeldig: Tilfeldig, som: "ord" | "digital", spraak: Spraak): { valg: Valg[]; fasit: string } {
  const kandidater = [60, -60, 30, -30, 5, -5]
    .map((delta) => normaliser(riktig + delta))
    .filter((verdi, indeks, liste) => verdi !== riktig && liste.indexOf(verdi) === indeks);
  const tider = stokk(tilfeldig, [riktig, ...kandidater.slice(0, 2)]);
  const valg = tider.map((tid) => ({
    id: `k${tid}`,
    klokke: tid,
    tekst: som === "ord" ? tidTilOrd(tid, spraak) : tidTilDigital24(tid),
  }));
  return { valg, fasit: `k${riktig}` };
}

function tallValg(riktig: number, tilfeldig: Tilfeldig): { valg: Valg[]; fasit: string } {
  const andre = [riktig + 1, Math.max(0, riktig - 1), riktig + 2].filter(
    (tall, indeks, liste) => tall !== riktig && liste.indexOf(tall) === indeks,
  );
  while (andre.length < 2) andre.push(riktig + andre.length + 3);
  const tallene = stokk(tilfeldig, [riktig, andre[0] ?? 0, andre[1] ?? 1]);
  return {
    valg: tallene.map((tall) => ({ id: `t${tall}`, tall, tekst: String(tall) })),
    fasit: `t${riktig}`,
  };
}

function formUnnga(ctx: OppgaveKontekst, liste: readonly string[]): string {
  const blandet = stokk(ctx.tilfeldig, liste);
  return blandet.find((form) => `form:${form}` !== ctx.unngaNokkel) ?? blandet[0] ?? "sirkel";
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
  if (v === 6 && lovlige.includes(30)) tid = klokke(14, 30);
  if (v === 7 && lovlige.includes(25)) tid = klokke(14, 25);
  if (v === 8 && lovlige.includes(15)) tid = klokke(16, 15);
  const navn = timeNavn(tid, ctx.spraak);
  const felt = {
    ord: tidTilOrd(tid, ctx.spraak),
    digital: tidTilDigital24(tid),
    hvem: hvem(v, ctx.spraak),
    denne: navn.denne,
    neste: navn.neste,
  };
  const maler: [string, string][] = [
    ["Still klokka til {ord}.", "Still klokka til {ord}."],
    ["Butikken åpner {ord}. Vis det.", "Butikken opnar {ord}. Vis det."],
    ["Middagen er {ord}. Still klokka.", "Middagen er {ord}. Still klokka."],
    ["Leggetid er {ord}. Vis det.", "Leggetid er {ord}. Vis det."],
    ["Avtalen starter {ord}. Still viserne.", "Avtala startar {ord}. Still visarane."],
    ["Vis {ord}. Den er halvveis til {neste}.", "Vis {ord}. Den er halvveis til {neste}."],
    ["Vis {ord}.", "Vis {ord}."],
    ["Vis {ord}.", "Vis {ord}."],
    ["Skriv tiden digitalt: {digital}.", "Skriv tida digitalt: {digital}."],
    ["{hvem} sier {ord}. Still klokka.", "{hvem} seier {ord}. Still klokka."],
    ["Tårnuret har stoppet. Still det til {ord}.", "Tårnuret har stoppa. Still det til {ord}."],
    ["Lappen sier {ord}. Still klokka.", "Lappen seier {ord}. Still klokka."],
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
  const pakke = klokkeValg(tid, ctx.tilfeldig, som, ctx.spraak);
  const lesMaler: [string, string][] = [
    ["Hvilket ord passer til klokka?", "Kva for ord passar til klokka?"],
    ["Hvilken digital tid passer?", "Kva for digital tid passar?"],
    ["Hvilken klokke viser tiden?", "Kva for klokke viser tida?"],
    ["Stemmer det at klokka er {ord}?", "Stemmer det at klokka er {ord}?"],
    ["Hvilken merkelapp er feil?", "Kva for merkelapp er feil?"],
    ["Hva er {ord}?", "Kva er {ord}?"],
    ["Hva er klokka om en halvtime?", "Kva er klokka om ein halvtime?"],
    ["Hva er klokka om en time?", "Kva er klokka om ein time?"],
    ["Når stenger butikken?", "Når stengjer butikken?"],
    ["Når er middagen?", "Når er middagen?"],
    ["Tårnuret viser feil. Hvilken er rett?", "Tårnuret viser feil. Kva for ei er rett?"],
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
      { id: "b", klokke: annen, tekst: `${tidTilOrd(annen, ctx.spraak)} · ${tidTilDigital24(annen)}` },
      { id: "c", klokke: annen, tekst: `${tidTilOrd(tid, ctx.spraak)} · ${tidTilDigital24(annen)}` },
    ]);
    oppgave.fasit = "c";
    oppgave.maalKlokke = tid;
  }
  if (v === 7 || v === 8) {
    const senere = normaliser(tid + (v === 7 ? 30 : 60));
    const pakkeSenere = klokkeValg(senere, ctx.tilfeldig, "ord", ctx.spraak);
    oppgave.valg = pakkeSenere.valg;
    oppgave.fasit = pakkeSenere.fasit;
    oppgave.maalKlokke = tid;
    oppgave.nokkel = `klokke:${senere}`;
  }
  return oppgave;
}

function lagKoble(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const lovlige = tillatteMinutter(ctx.nivaa, ctx.mestring);
  const tid = tidUnnga(ctx, lovlige.length ? lovlige : [0]);
  const som = v % 2 === 0 ? "digital" : "ord";
  const pakke = klokkeValg(tid, ctx.tilfeldig, som, ctx.spraak);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Koble klokka med riktig tid.", "Kopla klokka med rett tid."),
    `klokke:${tid}`,
    pakke.fasit,
    "vindu-rektangel",
  );
  oppgave.maalKlokke = tid;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function lagRekker(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const naa = ctx.plan?.start ?? klokke(14, 0);
  const avtale = ctx.plan?.avtaler.find((rad) => rad.varighet > 0);
  const handling = v % 2 === 0 ? 30 : 15;
  const frist = v % 3 === 0 ? normaliser(naa - 30) : (avtale?.start ?? klokke(16, 30));
  const rekker = naa + handling <= frist;
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Du bruker {min} minutter. Rekker du fristen?", "Du brukar {min} minutt. Rekk du fristen?", {
      min: String(handling),
    }),
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

function lagLenge(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const fra = ctx.plan?.start ?? klokke(14, 0);
  const timerFrem = v % 3 === 0 ? 2 : 1;
  const til = normaliser(fra + timerFrem * 60);
  const enhetHalv = v % 2 === 0 && nivaTall(ctx.nivaa) > 0;
  const svar = enhetHalv ? timerFrem * 2 : timerFrem;
  const pakke = tallValg(svar, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    si(
      ctx.spraak,
      enhetHalv ? "Fra {fra} til {til}. Hvor mange halvtimer?" : "Fra {fra} til {til}. Hvor mange timer?",
      enhetHalv ? "Frå {fra} til {til}. Kor mange halvtimar?" : "Frå {fra} til {til}. Kor mange timar?",
      { fra: tidTilOrd(fra, ctx.spraak), til: tidTilOrd(til, ctx.spraak) },
    ),
    `klokke:${fra}-${til}`,
    pakke.fasit,
    "planke",
  );
  oppgave.maalKlokke = fra;
  oppgave.tall = til;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function lagApen(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const butikk = ctx.plan?.butikk ?? { apner: klokke(14, 0), stenger: klokke(17, 0), stengtHele: false };
  const v = variant(mal.id);
  const naa = v === 5 || butikk.stengtHele ? klokke(12, 0) : v % 2 === 0 ? butikk.apner : normaliser(butikk.stenger + 30);
  const apen = !butikk.stengtHele && naa >= butikk.apner && naa < butikk.stenger && !(butikk.stengtFra !== undefined && naa >= butikk.stengtFra && butikk.stengtTil !== undefined && naa < butikk.stengtTil);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Er butikken åpen nå?", "Er butikken open no?"),
    `klokke:${naa}`,
    apen ? "ja" : "nei",
    "dor-rektangel",
  );
  oppgave.maalKlokke = naa;
  oppgave.tall = butikk.apner;
  oppgave.valg = stokk(ctx.tilfeldig, [
    { id: "ja", ja: true, tekst: si(ctx.spraak, "Åpen", "Open") },
    { id: "nei", ja: false, tekst: si(ctx.spraak, "Stengt", "Stengt") },
  ]);
  return oppgave;
}

function lagUke(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const dager = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag"];
  const riktig = ctx.plan?.ukedag && dager.includes(ctx.plan.ukedag) ? ctx.plan.ukedag : "tirsdag";
  const andre = dager.filter((dag) => dag !== riktig).slice(0, 2);
  const navn = (dag: string) => ctx.ukedagNavn?.(dag) ?? dag;
  const valg = stokk(ctx.tilfeldig, [riktig, ...andre]).map((dag) => ({ id: dag, tekst: navn(dag) }));
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hvilken dag er avtalen?", "Kva for dag er avtala?"),
    `dag:${riktig}`,
    riktig,
    "pynt-flagg",
  );
  oppgave.valg = valg;
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
    const riktig = ctx.plan?.arstid ?? "host";
    const valg = stokk(ctx.tilfeldig, arstider).map((rad) => ({
      id: rad.id,
      tekst: arstidTekst(ctx.spraak, rad.id),
    }));
    const oppgave = basis(mal, ctx, si(ctx.spraak, "Hvilken årstid er det?", "Kva for årstid er det?"), `arstid:${riktig}`, riktig, "jord");
    oppgave.valg = valg;
    return oppgave;
  }
  const justert = malFerdighet(mal);
  if (justert.ferdighet === "maneder" && v !== 4) {
    const indeks = (ctx.plan?.dato.maned ?? 8) - 1;
    const riktig = maneder[indeks] ?? "august";
    const andre = [maneder[(indeks + 1) % 12] ?? "mai", maneder[(indeks + 3) % 12] ?? "juni"];
    const valg = stokk(ctx.tilfeldig, [riktig, ...andre]).map((navn) => ({ id: navn, tekst: manedTekst(ctx.spraak, navn) }));
    const oppgave = basis(
      mal,
      ctx,
      si(ctx.spraak, "Hvilken måned er det?", "Kva for månad er det?"),
      `maned:${riktig}`,
      riktig,
      "pynt-blomst",
    );
    oppgave.valg = valg;
    return oppgave;
  }
  const dager = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
  const iDag = ctx.plan?.ukedag ?? "mandag";
  const neste = dager[(dager.indexOf(iDag) + 1) % 7] ?? "tirsdag";
  const navn = (dag: string) => ctx.ukedagNavn?.(dag) ?? dag;
  const valgDag = stokk(
    ctx.tilfeldig,
    [neste, dager[(dager.indexOf(neste) + 1) % 7] ?? "onsdag", dager[(dager.indexOf(neste) + 2) % 7] ?? "torsdag"],
  ).map((dag) => ({ id: dag, tekst: navn(dag) }));
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hvilken dag er i morgen?", "Kva for dag er i morgon?"),
    `dag:${neste}`,
    neste,
    "pynt-blomst",
  );
  oppgave.valg = valgDag;
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
    const setning = si(ctx.spraak, "Finn alle {navn}.", "Finn alle {navn}.", { navn });
    if (id === "kule" && !(ctx.kjente3d ?? []).includes("kule")) {
      return `${setning} ${si(ctx.spraak, "Kule = rund som en ball.", "Kule = rund som ein ball.")}`;
    }
    return setning;
  };
  if (mal.ferdighet === "former-3d") {
    const former = ["kule", "kube", "sylinder", "kjegle"] as const;
    const start = variant(mal.id) % former.length;
    const rotert = [...former.slice(start), ...former.slice(0, start)];
    const onsket = ctx.maalForm && (former as readonly string[]).includes(ctx.maalForm) ? ctx.maalForm : undefined;
    const ukjent = former.find((id) => !(ctx.kjente3d ?? []).includes(id));
    const maal = onsket ?? ukjent ?? rotert.find((id) => `form3d:${id}` !== ctx.unngaNokkel) ?? rotert[0] ?? "kule";
    const blandet = blandLike(ctx, maal, former.filter((id) => id !== maal));
    const vare = maal === "kule" ? "kloss-kule" : maal === "kube" ? "kloss-kube" : maal === "sylinder" ? "kloss-sylinder" : "kloss-kjegle";
    const oppgave = basis(mal, ctx, prompt(maal), `form3d:${maal}`, blandet.fasit, vare);
    oppgave.form = maal;
    oppgave.form3d = maal;
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
  const rund = v % 2 === 0;
  const inn = rund ? (["sirkel", "oval", "sirkel"] as Form2dId[]) : (["trekant", "kvadrat", "rektangel"] as Form2dId[]);
  const ut = rund ? "trekant" : "sirkel";
  const figurer = [
    { id: "a", form: inn[0] ?? "sirkel" },
    { id: "b", form: inn[1] ?? "sirkel" },
    { id: "c", form: inn[2] ?? "sirkel" },
    { id: "d", form: ut },
  ];
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hvem passer ikke inn?", "Kven passar ikkje inn?"),
    `form:${ut}`,
    "d",
    vareForForm(ut),
  );
  oppgave.varer = figurer;
  oppgave.valg = stokk(ctx.tilfeldig, figurer.map((figur) => ({ id: figur.id, form: figur.form })));
  oppgave.form = ut;
  return oppgave;
}

function lagSorter(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const varer = [
    { id: "v1", form: "sirkel" },
    { id: "v2", form: "trekant" },
    { id: "v3", form: "kvadrat" },
  ];
  const kasser = [
    { id: "rund", tekst: si(ctx.spraak, "Rund", "Rund") },
    { id: "kant", tekst: si(ctx.spraak, "Ikke rund", "Ikkje rund") },
  ];
  const fasit = varer
    .map((vare) => `${vare.id}:${form2d(vare.form as Form2dId).rund ? "rund" : "kant"}`)
    .sort()
    .join(",");
  const oppgave = basis(mal, ctx, si(ctx.spraak, "Sorter i kassene.", "Sorter i kassane."), "form:sorter", fasit, "vindu-kvadrat");
  oppgave.varer = varer;
  oppgave.kasser = kasser;
  return oppgave;
}

function artikkel(form: string): { nb: string; nn: string } {
  const intet = form === "kvadrat" || form === "rektangel" || form === "prisme";
  return intet ? { nb: "Tegn et {form}.", nn: "Teikn eit {form}." } : { nb: "Tegn en {form}.", nn: "Teikn ein {form}." };
}

function lagTegn(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const lov = nivaTall(ctx.nivaa) === 0 ? (["sirkel", "trekant", "kvadrat"] as Form2dId[]) : formerFor(ctx);
  const form = formUnnga(ctx, lov);
  const ledd = artikkel(form);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, ledd.nb, ledd.nn, { form: formNavn(form, ctx.spraak) }),
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
    const id = trekk(ctx.tilfeldig, ALLE_3D);
    const form = form3d(id);
    const tall = v === 4 ? form.flater : v === 11 ? form.hjorner : form.kanter;
    const pakke = tallValg(tall, ctx.tilfeldig);
    const oppgave = basis(
      mal,
      ctx,
      si(
        ctx.spraak,
        v === 4 ? "Tell flatene." : v === 11 ? "Tell hjørnene." : "Tell kantene.",
        v === 4 ? "Tel flatene." : v === 11 ? "Tel hjørna." : "Tel kantane.",
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
  const id = formUnnga(ctx, formerFor(ctx).filter((form) => form2d(form).sider > 0)) as Form2dId;
  const form = form2d(id);
  const tall = v === 6 ? form.retteVinkler : v % 2 === 0 ? form.hjorner : form.sider;
  const pakke = tallValg(tall, ctx.tilfeldig);
  const prompt = v === 6 ? "Tell de rette hjørnene." : v % 2 === 0 ? "Tell hjørnene." : "Tell sidene.";
  const promptNn = v === 6 ? "Tel dei rette hjørna." : v % 2 === 0 ? "Tel hjørna." : "Tel sidene.";
  const oppgave = basis(mal, ctx, si(ctx.spraak, prompt, promptNn), `form:${id}`, pakke.fasit, vareForForm(id));
  oppgave.form = id;
  oppgave.tall = tall;
  oppgave.valg = pakke.valg;
  return oppgave;
}

function lagMonster(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const v = variant(mal.id);
  const a = "kvadrat";
  const b = "sirkel";
  const c = "trekant";
  let sekvens: string[] = [a, b, a, b];
  let neste = a;
  if (v % 3 === 2) {
    sekvens = [a, a, b, a, a];
    neste = b;
  } else if (v % 3 === 0) {
    sekvens = [a, b, c, a, b];
    neste = c;
  }
  if (v >= 9) {
    sekvens = [a, a, b, a, b, c];
    neste = a;
  }
  const pakkeFormer = stokk(ctx.tilfeldig, [neste, neste === a ? b : a, c]).slice(0, 3);
  const unike = [...new Set(pakkeFormer)];
  while (unike.length < 3) unike.push(unike.length === 1 ? "rektangel" : "femkant");
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hva kommer etterpå?", "Kva kjem etterpå?"),
    `form:${neste}`,
    neste,
    vareForForm(neste),
  );
  oppgave.monster = sekvens;
  oppgave.valg = unike.slice(0, 3).map((form) => ({ id: form, form }));
  oppgave.fasit = neste;
  return oppgave;
}

function lagStempel(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const id = formUnnga(ctx, ALLE_3D) as Form3dId;
  const stempel = form3d(id).stempel;
  const andre = ALLE_2D.filter((form) => form !== stempel).slice(0, 2);
  const valg = stokk(ctx.tilfeldig, [stempel, ...andre]).map((form) => ({ id: form, form }));
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hvilken form får du når du stempler?", "Kva for form får du når du stemplar?"),
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
  const pakke = tallValg(svar, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    si(
      ctx.spraak,
      cm ? "Hvor mange centimeter er planken?" : "Hvor mange klosser lang er planken?",
      cm ? "Kor mange centimeter er planken?" : "Kor mange klossar lang er planken?",
    ),
    `planke:${planke.id}`,
    pakke.fasit,
    "planke",
  );
  oppgave.tall = svar;
  oppgave.valg = pakke.valg;
  oppgave.form = planke.id;
  return oppgave;
}

function lagMasse(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const varer = Object.entries(VEKT_KG);
  const [navn, kg] = trekk(ctx.tilfeldig, varer);
  const v = variant(mal.id);
  if (v % 2 === 0) {
    const liten = navn === "spiker" ? "maling" : "spiker";
    const litenKg = VEKT_KG[liten] ?? 1;
    if (kg % litenKg !== 0) {
      const pakkeKg = tallValg(kg, ctx.tilfeldig);
      const kilo = basis(
        mal,
        ctx,
        si(ctx.spraak, "Hvor mange kilo veier sekken?", "Kor mange kilo veg sekken?"),
        `vekt:${navn}`,
        pakkeKg.fasit,
        navn as VareId,
      );
      kilo.tall = kg;
      kilo.valg = pakkeKg.valg;
      kilo.form = navn;
      return kilo;
    }
    const svar = kg / litenKg;
    const pakke = tallValg(svar, ctx.tilfeldig);
    const oppgave = basis(
      mal,
      ctx,
      si(ctx.spraak, "Hvor mange {vare} veier like mye?", "Kor mange {vare} veg like mykje?", {
        vare: navnVare(liten, ctx.spraak),
      }),
      `vekt:${navn}`,
      pakke.fasit,
      navn as VareId,
    );
    oppgave.tall = svar;
    oppgave.valg = pakke.valg;
    oppgave.form = navn;
    return oppgave;
  }
  const pakke = tallValg(kg, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    si(ctx.spraak, "Hvor mange kilo veier sekken?", "Kor mange kilo veg sekken?"),
    `vekt:${navn}`,
    pakke.fasit,
    navn as VareId,
  );
  oppgave.tall = kg;
  oppgave.valg = pakke.valg;
  oppgave.form = navn;
  return oppgave;
}

function lagAreal(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const trenger = 4 + heltall(ctx.tilfeldig, 0, 3);
  const tomter = [
    { id: "A1", ruter: trenger - 2 },
    { id: "B2", ruter: trenger },
    { id: "C3", ruter: trenger + 2 },
  ];
  const storst = variant(mal.id) % 2 === 0;
  const oppgave = basis(
    mal,
    ctx,
    si(
      ctx.spraak,
      storst ? "Hvilken tomt er størst?" : "Hvilken tomt har akkurat nok plass?",
      storst ? "Kva for tomt er størst?" : "Kva for tomt har akkurat nok plass?",
    ),
    `areal:${trenger}`,
    storst ? "C3" : "B2",
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
    si(ctx.spraak, "Hvor skal du bygge?", "Kor skal du byggje?"),
    `rute:${riktig}`,
    riktig,
    "vegg-stein",
  );
  oppgave.koordinat = riktig;
  oppgave.valg = valg;
  return oppgave;
}

function lagVekt(mal: Mal, ctx: OppgaveKontekst): Oppgave {
  const liten = 2;
  const antall = 2 + heltall(ctx.tilfeldig, 0, 2);
  const stor = liten * antall;
  const pakke = tallValg(antall, ctx.tilfeldig);
  const oppgave = basis(
    mal,
    ctx,
    si(
      ctx.spraak,
      "Hvor mange småsekker veier like mye som den store?",
      "Kor mange småsekkar veg like mykje som den store?",
    ),
    `vekt:${stor}`,
    pakke.fasit,
    "sand",
  );
  oppgave.tall = stor;
  oppgave.valg = pakke.valg;
  oppgave.form = String(liten);
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
  let alle = MALER.filter((mal) => malPassert(mal, ctx) && (ctx.type ? mal.type === ctx.type : true));
  if (ctx.maalForm && ROM.includes(ctx.maalForm)) {
    const tredimensjonal = alle.filter((mal) => mal.ferdighet === "former-3d");
    if (tredimensjonal.length) alle = tredimensjonal;
  }
  const ledige = alle.filter((mal) => !ctx.unngaMal.includes(mal.id));
  const pool = ledige.length ? ledige : alle;
  const vilHaOverraskelse = ctx.tilfeldig() < 1 / 8;
  const overraskelse = pool.filter((mal) => mal.overraskelse);
  const vanlige = pool.filter((mal) => !mal.overraskelse);
  const valgt = trekk(ctx.tilfeldig, vilHaOverraskelse && overraskelse.length ? overraskelse : vanlige.length ? vanlige : pool);
  return lagFraMal(valgt, ctx);
}
