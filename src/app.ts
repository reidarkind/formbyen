import { registerSW } from "virtual:pwa-register";
import { maalBygg, manglendeDeler } from "./bygg/handleliste";
import { byggSomKanStartes, byenErFerdig, ferdigeBygg, ledigeTomter, lesRute, nesteByggId, ruteNavn } from "./bygg/kart";
import { byggDef } from "./bygg/katalog";
import { celleFor } from "./bygg/landemerker";
import { tegnBygg, tegnFremdrift, tegnKart } from "./grafikk/bygg-svg";
import { delSvg } from "./grafikk/fasade";
import { byggmester, ikon, kjaeledyr } from "./grafikk/figurer";
import { formSvg } from "./grafikk/former-svg";
import { FARGER, type Farge } from "./grafikk/stil";
import { tallPosisjoner, urskive } from "./grafikk/klokke";
import { ALLE_2D, ALLE_3D, erForm2d, erForm3d, form2d, form3d } from "./former/definisjoner";
import { importer, lesLagring, skrivLagring, standardLagret } from "./lagring/lagring";
import { beVarigLagring } from "./pwa/lagring";
import { oppdateringTekst, sjekkForOppdatering } from "./pwa/oppdatering";
import { sporsmalViser, svarViser } from "./oppgaver/visning";
import { anbefalt, gangMinutter, nesteSteg } from "./spill/anbefaling";
import { aktivOppgave, apningTekst, utfor, type Handling } from "./spill/okt";
import { omrissForForm } from "./tegning/omriss";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { visNavn } from "./dag/aktiviteter";
import { lagDagsplan, nesteDato, ukedagFor } from "./dag/plan";
import { fraNb, formNavn, mal, navnBygg, navnVare, vareFlertall } from "./tekst/ordbok";
import { manedTekst, si, SPRAAK_NAVN, ukedagTekst } from "./tekst/spraak";
import { himmel, leggTil, tidTilDigital24, tidTilOrd, minutt, timer, klokke } from "./tid/tid";
import { erSpraak, SPRAAK, type ByggId, type Lagret, type Nivaa, type NokkelLager, type Oppgave, type SkiltTid, type Spraak, type StedId, type Ukedag, type VareId } from "./typer";
import { lagVoksenStykke } from "./voksen";
import { klikk } from "./lyd/lyd";
import { bindDra } from "./felles/dra";
import "./style.css";

const lager: NokkelLager = {
  getItem: (nokkel) => localStorage.getItem(nokkel),
  setItem: (nokkel, verdi) => localStorage.setItem(nokkel, verdi),
  removeItem: (nokkel) => localStorage.removeItem(nokkel),
};

type Skjerm = "intro" | "velg" | "meny" | "pause" | "dagstart" | "verden" | "kart" | "bygg" | "pynt" | "kveld" | "innstillinger" | "voksen" | "om" | "installer" | "dagbok" | "album" | "ur" | "kurv";

let lagret: Lagret = lesLagring(lager);
let skjerm: Skjerm = lagret.startet ? (lagret.aktivDag ? "verden" : "meny") : "intro";
let melding: string | null = null;
let bannerTimer = 0;
let visPlan = false;
let visUr = false;
let reaksjon: { riktig: boolean; tekst: string } | null = null;
let svarLase = 0;
let gar: { sted: StedId; x: number; y: number } | null = null;
let introSide = 0;
let pekerTid = 12 * 60;
let urRunde: number[] = [];
let urStegNr = 0;
let valgte = new Set<string>();
let sorter: Record<string, string> = {};
let ristVarer = new Set<string>();
let sorterHake = false;
let valgtVare = "";
let valgtBygg: ByggId | null = null;
let voksen = lagVoksenStykke(lagret.fro);
let voksenInne = false;
let voksenFelt = "";
let visOppdater = false;
let statusOppdater = "";
let nullSteg = 0;
let voksenFane: "mestring" | "avtaler" | "data" | "om" = "mestring";
let voksenStolpe = "";
let bekreftAvslutt = false;
let bekreftNyBy = false;
let innFane: "figur" | "nivaa" | "sprak" | "voksen" = "figur";
let kveldOrden: number[] = [];
let kveldApne = false;
const rotEl = document.querySelector("#app");
if (!(rotEl instanceof HTMLElement)) throw new Error("mangler app");
const rot: HTMLElement = rotEl;

const oppdaterSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    visOppdater = true;
    tegn();
  },
});

void beVarigLagring();

function dyrNavn(dyr: string): string {
  if (dyr === "hund") return si(spraak(), "Pelle", "Pelle");
  if (dyr === "katt") return si(spraak(), "Mons", "Mons");
  return si(spraak(), "Trine", "Trine");
}

function spraak(): Spraak {
  return lagret.innstillinger.spraak;
}

function esc(verdi: string): string {
  return verdi.replace(/[&<>"']/g, (tegn) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[tegn] ?? tegn);
}

function lagre(): void {
  skrivLagring(lager, lagret);
}

const NIVA: Nivaa[] = ["forste", "andre", "utfordrende", "blandet"];
const UKEDAGER: Ukedag[] = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lordag", "sondag"];
const BYGGNAVN: Record<ByggId, [string, string]> = {
  ronne: ["Rønne", "Rønne"],
  hytte: ["Hytte", "Hytte"],
  hus: ["Hus", "Hus"],
  villa: ["Villa", "Villa"],
  borg: ["Borg", "Borg"],
  slott: ["Slott", "Slott"],
  bronn: ["Brønn", "Brunn"],
  gjerde: ["Gjerde", "Gjerde"],
  vedskjul: ["Vedskjul", "Vedskjul"],
  bakeri: ["Bakeri", "Bakeri"],
  lekeplass: ["Lekeplass", "Lekeplass"],
  bro: ["Bro", "Bru"],
  skole: ["Skole", "Skule"],
  idrettshall: ["Idrettshall", "Idrettshall"],
  korpslokale: ["Korpslokale", "Korpslokale"],
  musikkskole: ["Musikkskole", "Musikkskule"],
  bibliotek: ["Bibliotek", "Bibliotek"],
  togstasjon: ["Togstasjon", "Togstasjon"],
  kirke: ["Kirke", "Kyrkje"],
  vanntaarn: ["Vanntårn", "Vasstårn"],
  fyrtarn: ["Fyrtårn", "Fyrtårn"],
  ringmur: ["Ringmur", "Ringmur"],
  park: ["Park", "Park"],
  festplass: ["Festplass", "Festplass"],
  klokketarn: ["Klokketårn", "Klokketårn"],
};

function byggNavn(id: ByggId): string {
  const par = BYGGNAVN[id];
  return navnBygg(id, spraak(), par[0], par[1]);
}

function tilfeldigStart(): Lagret["dato"] {
  const start = new Date(2026, 0, 5);
  start.setDate(start.getDate() + Math.floor(Math.random() * 40) * 7 + Math.floor(Math.random() * 5));
  return { aar: start.getFullYear(), maned: start.getMonth() + 1, dag: start.getDate() };
}

function bestemtBygg(id: ByggId): string {
  const tabell: Partial<Record<ByggId, [string, string]>> = {
    bronn: ["Brønnen", "Brunnen"],
    gjerde: ["Gjerdet", "Gjerdet"],
    vedskjul: ["Vedskjulet", "Vedskjulet"],
    hytte: ["Hytta", "Hytta"],
    hus: ["Huset", "Huset"],
    slott: ["Slottet", "Slottet"],
    lekeplass: ["Lekeplassen", "Leikeplassen"],
    ronne: ["Rønna", "Rønna"],
    bakeri: ["Bakeriet", "Bakeriet"],
    bro: ["Broa", "Brua"],
    skole: ["Skolen", "Skulen"],
    villa: ["Villaen", "Villaen"],
    borg: ["Borgen", "Borga"],
  };
  const par = tabell[id];
  if (par) return mal(spraak(), par[0], par[1]);
  return byggNavn(id);
}

function erNivaa(verdi: string): verdi is Nivaa {
  return NIVA.includes(verdi as Nivaa);
}

function erUkedag(verdi: string): verdi is Ukedag {
  return UKEDAGER.includes(verdi as Ukedag);
}

type UrVis = "full" | "analog" | "ord" | "digital" | "hud";

function urIndre(tid: number, lite = false, vis: UrVis = "full", storrelse = lite ? 36 : 160): string {
  const tall =
    storrelse >= 96
      ? tallPosisjoner(120, 120, 108)
          .map((pos) => `<span class="tall" data-tall="${pos.tall}" style="left:${(pos.x / 240) * 100}%;top:${(pos.y / 240) * 100}%">${pos.tall}</span>`)
          .join("")
      : "";
  const analog = `<div class="skive">${urskive(tid)}<div class="tall-lag">${tall}</div></div>`;
  const ord = `<p class="ord">${esc(tidTilOrd(tid, spraak()))}</p>`;
  const digital = `<p class="digital">${tidTilDigital24(tid)}</p>`;
  if (vis === "analog") return analog;
  if (vis === "ord") return ord;
  if (vis === "digital") return digital;
  if (vis === "hud") return `${analog}${lagret.innstillinger.skjulDigital ? "" : digital}`;
  return `${analog}${ord}${lagret.innstillinger.skjulDigital ? "" : digital}`;
}

function urHtml(tid: number, lite = false, justerbar = false, vis: UrVis = "full", storrelse?: 36 | 96 | 120 | 160 | 200): string {
  const str = storrelse ?? (lite ? 36 : 160);
  return `<div class="ur ur-${str} ${lite ? "lite" : ""}" ${justerbar ? "data-ur" : ""}>${urIndre(tid, lite, vis, str)}</div>`;
}

function skrivPeker(): void {
  const boks = document.querySelector("[data-ur]");
  if (boks) boks.innerHTML = urIndre(pekerTid, boks.classList.contains("lite"), "analog");
}

function gjor(handling: Handling): void {
  const haddeDag = lagret.aktivDag !== null;
  const ut = utfor(lagret, handling);
  const forrigeOppgave = aktivOppgave(lagret)?.id;
  lagret = ut.lagret;
  melding = ut.melding;
  window.clearTimeout(bannerTimer);
  if (melding) {
    const tekst = melding;
    bannerTimer = window.setTimeout(() => {
      if (melding === tekst) {
        melding = null;
        tegn();
      }
    }, 1500);
  }
  const ny = aktivOppgave(lagret);
  if (handling.slag === "fortsett" && ny && ny.id === forrigeOppgave && ny.type === "sorter") {
    const fasit = new Set(ny.fasit.split(","));
    const behold: Record<string, string> = {};
    ristVarer = new Set();
    for (const [vare, kasse] of Object.entries(sorter)) {
      if (fasit.has(`${vare}:${kasse}`)) behold[vare] = kasse;
      else ristVarer.add(vare);
    }
    sorter = behold;
    sorterHake = true;
    valgtVare = "";
  } else if (handling.slag === "fortsett" || (ny && ny.id !== forrigeOppgave)) {
    valgte = new Set();
    sorter = {};
    valgtVare = "";
    sorterHake = false;
    ristVarer = new Set();
  }
  if (ny && ny.id !== forrigeOppgave && ny.maalKlokke !== undefined) pekerTid = 12 * 60;
  if (handling.slag === "svar") svarLase = Date.now();
  if (handling.slag === "svar" && ut.melding && !lagret.aktivDag?.forklaring) {
    klikk(lagret.innstillinger.lydPa, "riktig");
    reaksjon = { riktig: true, tekst: ut.melding };
    window.setTimeout(() => {
      reaksjon = null;
      tegn();
    }, 600);
  }
  if (handling.slag === "fortsett" || handling.slag === "start") reaksjon = null;
  if (handling.slag === "steg") klikk(lagret.innstillinger.lydPa, "hammer");
  if (haddeDag && !lagret.aktivDag) {
    skjerm = "kveld";
    kveldOrden = [];
    kveldApne = false;
  }
  if (handling.slag === "start") {
    skjerm = "dagstart";
    visPlan = false;
    visUr = false;
  }
  lagre();
  tegn();
}

function startGange(maal: { sted: StedId; x: number; y: number; instans?: string; tomt?: { x: number; y: number; bygg: ByggId } }): void {
  const dag = lagret.aktivDag;
  if (!dag || gar) return;
  if (dag.sted === maal.sted && !maal.tomt && (!maal.instans || dag.valgtInstans === maal.instans)) {
    const fase = maal.sted === "butikk" ? "handel" : "aktivitet";
    lagret = { ...lagret, aktivDag: { ...dag, fase, ko: [], forklaring: null, feil: 0 } };
    lagre();
    tegn();
    return;
  }
  gar = { sted: maal.sted, x: maal.x, y: maal.y };
  const fra = dag.tid;
  const tilTid = leggTil(fra, gangMinutter(dag.sted, maal.sted, lagret.innstillinger.nivaa));
  tegn();
  const startet = performance.now();
  const tick = (naa: number) => {
    if (!gar) return;
    const andel = Math.min(1, (naa - startet) / 1000);
    const steg = minuttSteg();
    const vis = fra + Math.round(((tilTid - fra) * andel) / steg) * steg;
    const el = document.querySelector(".hud .klokke");
    if (el) el.innerHTML = urHtml(vis, true, false, "hud");
    if (andel < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  window.setTimeout(() => {
    gar = null;
    if (!lagret.aktivDag) return;
    if (maal.instans) lagret = utfor(lagret, { slag: "velg", instans: maal.instans }).lagret;
    const gikk = utfor(lagret, { slag: "ga", sted: maal.sted });
    lagret = gikk.lagret;
    melding = gikk.melding;
    if (maal.tomt && lagret.aktivDag) {
      const plassert = utfor(lagret, { slag: "velg-bygg", bygg: maal.tomt.bygg, x: maal.tomt.x, y: maal.tomt.y });
      lagret = plassert.lagret;
      if (plassert.melding) melding = plassert.melding;
    }
    if (!lagret.aktivDag) skjerm = "kveld";
    lagre();
    tegn();
  }, 1000);
}

const DELFARGE: Farge[] = [FARGER.takRodt, FARGER.takBlatt, FARGER.tre, FARGER.gress, FARGER.mur, FARGER.vann];

function minuttSteg(): number {
  if (lagret.innstillinger.nivaa === "forste") return 30;
  if (lagret.innstillinger.nivaa === "andre") return 15;
  return 5;
}

function sammeUrskive(a: number, b: number): boolean {
  return timer(a) % 12 === timer(b) % 12 && minutt(a) === minutt(b);
}

function snapTilSteg(tid: number): number {
  const steg = minuttSteg();
  const avrundet = Math.round(minutt(tid) / steg) * steg;
  return klokke(timer(tid) + Math.floor(avrundet / 60), avrundet % 60);
}

function iMorgenTider(): number[] {
  const start = snapTilSteg(lagret.aktivDag?.tid ?? 12 * 60);
  const plan = lagDagsplan({
    fro: lagret.fro + 1,
    dato: nesteDato(lagret.dato),
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  });
  const kandidater = [...plan.avtaler.map((avtale) => avtale.start), plan.butikk.apner, plan.leggetid].map(snapTilSteg);
  const unike: number[] = [];
  for (const tid of kandidater) {
    if (tid !== start && !unike.includes(tid)) unike.push(tid);
  }
  let ekstra = ((unike.at(-1) ?? start) + minuttSteg()) % (24 * 60);
  while (unike.length < 5) {
    if (ekstra !== start && !unike.includes(ekstra)) unike.push(ekstra);
    ekstra = (ekstra + minuttSteg()) % (24 * 60);
  }
  return unike.slice(0, 5);
}

function fargeFor(id: string): Farge {
  const sum = [...id].reduce((tall, tegn) => tall + tegn.charCodeAt(0), 0);
  return DELFARGE[sum % DELFARGE.length] ?? FARGER.tre;
}

function skiltHtml(skilt: SkiltTid): string {
  const rad = (fra: number, til: number) =>
    `<div class="skilt-rad">${urHtml(fra, false, false, "analog", 36)}${urHtml(til, false, false, "analog", 36)}<span>${tidTilDigital24(fra)}–${tidTilDigital24(til)}</span></div>`;
  const tider =
    skilt.stengtFra !== undefined && skilt.stengtTil !== undefined
      ? `${rad(skilt.apner, skilt.stengtFra)}${rad(skilt.stengtTil, skilt.stenger)}`
      : skilt.apner !== skilt.stenger
        ? rad(skilt.apner, skilt.stenger)
        : "";
  return `<div class="dorskilt"><div class="skilt-tider"><p class="ord">${si(spraak(), "Nå", "No")}</p>${urHtml(skilt.naa, false, false, "analog", 96)}</div><div class="skilt-tider">${tider}</div></div>`;
}

function oppgaveBilde(oppgave: Oppgave): string {
  if (oppgave.id.startsWith("dor-")) return "";
  if (oppgave.type === "still-klokka" && oppgave.maalKlokke !== undefined) {
    const vis = sporsmalViser(oppgave);
    const maal = vis === "digital" ? tidTilDigital24(oppgave.maalKlokke) : tidTilOrd(oppgave.maalKlokke, spraak());
    return `<p class="klokkemal">${esc(maal)}</p>${urHtml(pekerTid, false, true, "analog", 160)}
      <div class="rad">
        <button type="button" data-time="-1" aria-label="${si(spraak(), "time minus", "time minus")}">time −</button>
        <button type="button" data-time="1" aria-label="${si(spraak(), "time pluss", "time pluss")}">time +</button>
        <button type="button" data-minutt="-${minuttSteg()}">${minuttSteg()} −</button>
        <button type="button" data-minutt="${minuttSteg()}">${minuttSteg()} +</button>
      </div>`;
  }
  if (oppgave.type === "hvem-passer-ikke") return "";
  if (oppgave.type === "lengde" && oppgave.tall !== undefined) return plankeBilde(oppgave.tall);
  if (oppgave.type === "masse" || oppgave.type === "likevekt") return sekkBilde(oppgave.type === "likevekt" || oppgave.prompt.includes("like"), oppgave.tall);
  if (oppgave.type === "areal") return "";
  if (oppgave.koordinat) return koordinatBilde(oppgave.koordinat);
  if (oppgave.type === "ukeplan" || oppgave.type === "kalender") return ukeBilde();
  if (oppgave.monster) {
    const bredde = Math.max(28, Math.min(56, Math.floor(280 / (oppgave.monster.length + 1))));
    const fargeNavn: Record<string, Farge> = { takRodt: FARGER.takRodt, takBlatt: FARGER.takBlatt, aksentGul: FARGER.aksentGul };
    return `<div class="monster">${oppgave.monster
      .map((form, indeks) => {
        const stor = oppgave.monsterStor?.[indeks] ?? 1;
        const farge = oppgave.monsterFarge ? fargeNavn[oppgave.monsterFarge[indeks] ?? ""] ?? FARGER.takBlatt : FARGER.takBlatt;
        return formSvg(form, Math.round(bredde * (oppgave.monsterStor ? 0.55 + stor * 0.35 : 1)), -Math.PI / 2, farge);
      })
      .join("")}<span class="plass">?</span></div>`;
  }
  if (oppgave.varer) {
    const malform = oppgave.type === "finn-formen" && oppgave.form ? `<div class="malform">${formSvg(oppgave.form, 72)}<p>${si(spraak(), "Fargen betyr ikke noe. Se på formen.", "Fargen betyr ikkje noko. Sjå på forma.")}</p></div>` : "";
    return `${malform}<div class="valg">${oppgave.varer
      .filter((vare) => !sorter[vare.id])
      .map((vare) => {
        const merket = valgte.has(vare.id);
        const loftet = valgtVare === vare.id ? " loftet" : "";
        const rist = ristVarer.has(vare.id) ? " rist" : "";
        return `<button type="button" data-vare="${esc(vare.id)}" class="${merket ? "valgt" : ""}${loftet}${rist}" aria-pressed="${merket || valgtVare === vare.id ? "true" : "false"}">${formSvg(vare.form, vare.stor ?? 72, -Math.PI / 2, fargeFor(vare.id + vare.form))}</button>`;
      })
      .join("")}</div>${
      oppgave.kasser
        ? `<div class="kasser">${oppgave.kasser
            .map((kasse) => {
              const inni = (oppgave.varer ?? []).filter((vare) => sorter[vare.id] === kasse.id);
              const figurer = inni.map((vare) => formSvg(vare.form, 36, -Math.PI / 2, fargeFor(vare.id + vare.form))).join("");
              const symbol = kasse.symbol ? formSvg(kasse.symbol, 28) : "";
              const hake = sorterHake && inni.length > 0 ? `<span class="hake">✓</span>` : "";
              const lys = valgtVare ? " lyser" : "";
              return `<button type="button" class="kasse${lys}" data-kasse="${esc(kasse.id)}"><span class="lokk">${symbol}<span>${esc(kasse.tekst)}</span></span>${figurer}${hake}</button>`;
            })
            .join("")}</div>`
        : ""
    }`;
  }
  if (oppgave.type === "tegn" && oppgave.form) {
    return `<div class="tegn-oppgave">${formSvg(oppgave.form, 72)}<div class="lerret-boks"><canvas id="spokelse" width="240" height="240"></canvas><canvas id="lerret" width="240" height="240"></canvas></div></div>
      <div class="rad"><button type="button" data-tom="1">${si(spraak(), "Tøm", "Tøm")}</button>
      </div>`;
  }
  if ((oppgave.type === "hvor-lenge" || oppgave.type === "rekker-jeg" || oppgave.type === "apningstider") && oppgave.maalKlokke !== undefined && oppgave.tall !== undefined) {
    const venstre = oppgave.type === "hvor-lenge" ? si(spraak(), "Fra", "Frå") : oppgave.type === "apningstider" ? si(spraak(), "Åpner", "Opnar") : si(spraak(), "Nå", "No");
    const hoyre = oppgave.type === "apningstider" ? si(spraak(), "Stenger", "Stengjer") : si(spraak(), "Til", "Til");
    const pause =
      oppgave.skilt?.stengtFra !== undefined && oppgave.skilt.stengtTil !== undefined
        ? `<p class="ord">${tidTilDigital24(oppgave.skilt.apner)}–${tidTilDigital24(oppgave.skilt.stengtFra)} · ${tidTilDigital24(oppgave.skilt.stengtTil)}–${tidTilDigital24(oppgave.skilt.stenger)}</p>`
        : "";
    return `<div class="sammenlign"><div><p class="ord">${venstre}</p>${urHtml(oppgave.maalKlokke, false, false, "analog", 120)}</div><div><p class="ord">${hoyre}</p>${urHtml(oppgave.tall, false, false, "analog", 120)}</div></div>${pause}`;
  }
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "still-klokka") return urHtml(oppgave.maalKlokke, false, false, sporsmalViser(oppgave) === "full" ? "analog" : sporsmalViser(oppgave));
  if (oppgave.form3d) {
    const ligg = lagret.innstillinger.nivaa === "utfordrende" && (oppgave.form3d === "sylinder" || oppgave.form3d === "kjegle") ? 0 : -Math.PI / 2;
    return formSvg(oppgave.form3d, 120, ligg);
  }
  if (oppgave.form) return formSvg(oppgave.form, 120);
  return ikon(ikonFor(oppgave.type));
}

function plankeBilde(tall: number): string {
  const enheter = tall > 12 ? Math.max(2, Math.round(tall / 10)) : tall;
  const b = 16 + enheter * 28;
  const biter = Array.from({ length: enheter }, (_, i) => `<rect x="${8 + i * 28}" y="8" width="24" height="16" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`).join("");
  return `<svg viewBox="0 0 ${b} 32" width="${b}" height="32">${biter}</svg>`;
}

function sekkBilde(vekt: boolean, _kilo?: number): string {
  const merke = "";
  const liten = `<ellipse cx="18" cy="28" rx="10" ry="8" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  const stor = `<ellipse cx="58" cy="24" rx="16" ry="14" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>${merke}`;
  return `<svg viewBox="0 0 80 44" width="160" height="88">${vekt ? `${liten}${stor}` : stor}</svg>`;
}

function koordinatBilde(kode: string): string {
  const punkt = lesRute(kode);
  const cell = 26;
  const n = 6;
  const marg = 18;
  let celler = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const merket = punkt?.x === x && punkt.y === y;
      celler += `<rect x="${marg + x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${merket ? FARGER.aksentGul : FARGER.gress}" stroke="${FARGER.kontur}"/>`;
    }
  }
  const bokstaver = "ABCDEF";
  const merker = Array.from({ length: n }, (_, i) => `<text x="${marg + i * cell + cell / 2}" y="${n * cell + 14}" text-anchor="middle" font-size="12" font-weight="700" fill="${FARGER.kontur}">${bokstaver[i]}</text><text x="10" y="${i * cell + 18}" text-anchor="middle" font-size="12" font-weight="700" fill="${FARGER.kontur}">${i + 1}</text>`).join("");
  return `<svg viewBox="0 0 ${marg + n * cell} ${n * cell + 18}" width="174" height="174">${celler}${merker}</svg>`;
}

function ukeBilde(): string {
  const dager = ["ma", "ti", "on", "to", "fr"];
  const ruter = dager
    .map((dag, i) => `<rect x="${i * 36}" y="0" width="32" height="32" fill="${FARGER.papir}" stroke="${FARGER.kontur}" stroke-width="2"/><text x="${i * 36 + 16}" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="${FARGER.kontur}">${dag}</text>`)
    .join("");
  return `<svg viewBox="0 0 180 32" width="180" height="32">${ruter}</svg>`;
}

function rutenettBilde(ruter: number): string {
  const side = Math.ceil(Math.sqrt(Math.max(1, ruter)));
  const cell = 18;
  const hoyde = Math.ceil(ruter / side) * cell;
  let celler = "";
  for (let i = 0; i < ruter; i++) {
    const x = (i % side) * cell;
    const y = Math.floor(i / side) * cell;
    celler += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" fill="${FARGER.gress}" stroke="${FARGER.kontur}"/>`;
  }
  return `<svg viewBox="0 0 ${side * cell} ${hoyde}" width="${side * cell}" height="${hoyde}">${celler}</svg>`;
}

function ikonFor(type: string): string {
  const kart: Record<string, string> = {
    "still-klokka": "still",
    "les-klokka": "les",
    koble: "koble",
    "rekker-jeg": "ja",
    "hvor-lenge": "les",
    apningstider: "les",
    ukeplan: "velg",
    kalender: "velg",
    "finn-formen": "velg",
    "hvem-passer-ikke": "feil",
    sorter: "sorter",
    tegn: "tegn",
    tell: "tell",
    monster: "velg",
    stempel: "velg",
    lengde: "mal",
    masse: "vekt",
    areal: "mal",
    koordinater: "velg",
    likevekt: "vekt",
  };
  return kart[type] ?? "velg";
}

function valgHtml(oppgave: Oppgave): string {
  if (oppgave.type === "still-klokka" || oppgave.type === "tegn" || oppgave.type === "finn-formen" || oppgave.type === "sorter") return "";
  const vis = svarViser(oppgave);
  return `<div class="valg">${oppgave.valg
    .map((valg) => {
      const bilde =
        oppgave.type === "areal" && valg.tall !== undefined
          ? rutenettBilde(valg.tall)
          : vis === "analog" && valg.klokke !== undefined
            ? urHtml(valg.klokke, false, false, "analog", 96)
            : vis === "digital" && valg.klokke !== undefined
              ? ""
              : valg.form
                ? formSvg(
                    valg.form,
                    oppgave.monsterStor ? (valg.id === "1" ? 48 : valg.id === "3" ? 96 : 72) : 72,
                    -Math.PI / 2,
                    ({ takRodt: FARGER.takRodt, takBlatt: FARGER.takBlatt, aksentGul: FARGER.aksentGul } as Record<string, Farge>)[valg.id] ??
                      fargeFor(valg.id + (valg.form ?? "")),
                  )
                : valg.tall !== undefined
                  ? ""
                  : valg.ja === true
                    ? ikon("ja")
                    : valg.ja === false
                      ? ikon("nei")
                      : "";
      const tekst =
        vis === "digital" && valg.klokke !== undefined
          ? tidTilDigital24(valg.klokke)
          : oppgave.type === "areal"
            ? esc(valg.tekst ?? valg.id)
            : vis === "ord" || (!bilde && valg.tall === undefined)
              ? esc(valg.tekst ?? valg.id)
              : valg.tall !== undefined
                ? `<strong>${valg.tall}</strong>`
                : "";
      return `<button type="button" data-svar="${esc(valg.id)}" aria-label="${esc(valg.tekst ?? valg.id)}">${bilde}${tekst}</button>`;
    })
    .join("")}</div>`;
}

function sorterFasit(oppgave: Oppgave): string {
  if (!oppgave.kasser || !oppgave.varer) return "";
  const par = new Map(oppgave.fasit.split(",").map((del) => del.split(":") as [string, string]));
  return `<div class="kasser">${oppgave.kasser
    .map((kasse) => {
      const inni = (oppgave.varer ?? []).filter((vare) => par.get(vare.id) === kasse.id);
      const symbol = kasse.symbol ? formSvg(kasse.symbol, 28) : "";
      const figurer = inni.map((vare) => formSvg(vare.form, 36)).join("");
      return `<div class="kasse"><span class="lokk">${symbol}<span>${esc(kasse.tekst)}</span></span>${figurer}</div>`;
    })
    .join("")}</div>`;
}

function oppgaveHtml(oppgave: Oppgave): string {
  const dag = lagret.aktivDag;
  const forklaring = dag?.forklaring;
  const videre = (dag?.feil ?? 0) >= 2;
  const prikker = dag && dag.ko.length > 1 ? `<p class="prikker">${dag.ko.map((_, i) => (i <= (dag.aktiv ?? 0) ? "●" : "○")).join("")}</p>` : "";
  if (forklaring) {
    const rett = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
    const visTid = videre ? (rett?.klokke ?? oppgave.maalKlokke) : undefined;
    const klokke = visTid !== undefined ? urHtml(visTid, false, false, "analog", 120) : "";
    const kasser = videre && oppgave.type === "sorter" ? sorterFasit(oppgave) : "";
    const fasitForm = videre ? (oppgave.type === "monster" ? oppgave.fasit : oppgave.form ?? rett?.form) : undefined;
    const svarTekst = videre && rett?.tekst && oppgave.type !== "tell" ? `<p class="valgt-svar">${esc(rett.tekst)}</p>` : "";
    return `<article class="kort feil">${prikker}<p>${esc(forklaring)}</p>${klokke}${kasser}${svarTekst}${fasitForm ? formSvg(fasitForm, 96) : ""}<button type="button" class="hoved" data-handling="fortsett">${videre ? si(spraak(), "Fortsett", "Hald fram") : si(spraak(), "Prøv igjen", "Prøv igjen")}</button></article>`;
  }
  const skilt = oppgave.skilt && oppgave.id.startsWith("dor-") ? skiltHtml(oppgave.skilt) : "";
  const ut = dag && dag.ko.length > 1 && dag.fase === "handel" && !oppgave.id.startsWith("dor-") ? `<button type="button" data-ute="1">${si(spraak(), "Gå ut", "Gå ut")}</button>` : "";
  return `<article class="kort" aria-label="${esc(oppgave.prompt)}">
    ${prikker}
    <div class="rad">${ikon(ikonFor(oppgave.type))}<p>${esc(oppgave.hvem)}</p>${ut}</div>
    ${skilt}
    <h2>${esc(oppgave.prompt)}</h2>
    ${oppgave.hint && (oppgave.hintVist ?? 1) < oppgave.hint.length ? `<button type="button" data-hint="1">${si(spraak(), "Neste hint", "Neste hint")}</button>` : ""}
    ${oppgaveBilde(oppgave)}
    ${valgHtml(oppgave)}
  </article>`;
}

function oppdragMerke(): string {
  const dag = lagret.aktivDag;
  if (!dag || dag.oppdragFerdig || dag.ko.length > 0 || dag.forklaring) return "";
  const frist = dag.plan.avtaler.find((avtale) => avtale.start > dag.tid && avtale.varighet > 0)?.start ?? dag.plan.leggetid;
  return `<button type="button" class="oppdrag-merke" data-handling="oppdrag"><span class="oppdrag-ikon" aria-hidden="true">★</span><span>${tidTilDigital24(frist)} · +2</span></button>`;
}

function delBilde(id: string): string {
  return delSvg(id, 48);
}

function ikonNavn(navn: string): string {
  const tekst = navn.toLowerCase();
  if (tekst.includes("skole") || tekst.includes("skule")) return "skole";
  if (tekst.includes("butikk")) return "butikk";
  if (tekst.includes("tann")) return "tann";
  if (tekst.includes("middag")) return "mat";
  if (tekst.includes("svøm") || tekst.includes("symj") || tekst.includes("svom")) return "svom";
  if (tekst.includes("barnehage") || tekst.includes("lilles")) return "barnehage";
  if (tekst.includes("hund")) return "hund";
  if (tekst.includes("lekse")) return "lekse";
  if (tekst.includes("legg")) return "seng";
  return "avtale";
}

function planPunkter(): { tid: number; navn: string }[] {
  const dag = lagret.aktivDag;
  if (!dag) return [];
  const punkter: { tid: number; navn: string }[] = [];
  if (dag.plan.skoleslutt !== null) {
    punkter.push({
      tid: dag.plan.skoleslutt,
      navn: dag.plan.sisteTime
        ? mal(spraak(), "Skolen slutter etter {fag}", "Skulen sluttar etter {fag}", { fag: visNavn(dag.plan.sisteTime, spraak()) })
        : si(spraak(), "Skolen slutter", "Skulen sluttar"),
    });
  }
  if (!dag.plan.butikk.stengtHele) {
    const pause =
      dag.plan.butikk.stengtFra !== undefined && dag.plan.butikk.stengtTil !== undefined
        ? `, ${tidTilDigital24(dag.plan.butikk.stengtTil)}–${tidTilDigital24(dag.plan.butikk.stenger)}`
        : "";
    const førsteSlutt = dag.plan.butikk.stengtFra ?? dag.plan.butikk.stenger;
    punkter.push({
      tid: dag.plan.butikk.apner,
      navn: `${si(spraak(), "Butikken", "Butikken")} ${tidTilDigital24(dag.plan.butikk.apner)}–${tidTilDigital24(førsteSlutt)}${pause}`,
    });
  } else {
    punkter.push({ tid: dag.plan.butikk.apner, navn: si(spraak(), "Butikken er stengt", "Butikken er stengt") });
  }
  const hjemme: string[] = [];
  let hjemTid = dag.plan.leggetid;
  for (const avtale of dag.plan.avtaler) {
    if (avtale.slag === "hendelse" || avtale.varighet <= 0) continue;
    if (avtale.sted === "hjemme" && avtale.slag !== "middag") {
      hjemme.push(visNavn(avtale.aktivitet ?? avtale.navn, spraak()).toLowerCase());
      hjemTid = Math.min(hjemTid, avtale.start);
      continue;
    }
    punkter.push({ tid: avtale.start, navn: visNavn(avtale.aktivitet ?? avtale.navn, spraak()) });
  }
  if (hjemme.length > 0) punkter.push({ tid: hjemTid, navn: `${si(spraak(), "Hjemme", "Heime")}: ${hjemme.join(", ")}` });
  punkter.push({ tid: dag.plan.leggetid, navn: si(spraak(), "Leggetid", "Leggetid") });
  punkter.sort((a, b) => a.tid - b.tid);
  return punkter;
}

function stripeHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const punkter = planPunkter();
  const pagar = punkter.find((punkt) => dag.tid >= punkt.tid && dag.tid < punkt.tid + 30);
  const naa = pagar ?? punkter.find((punkt) => punkt.tid > dag.tid) ?? punkter.at(-1);
  return `<button type="button" class="stripe" data-plan="${visPlan ? "lukk" : "apne"}" aria-label="${si(spraak(), "Dagens plan", "Dagens plan")}">${punkter
    .map((punkt) => {
      const klasse = punkt === naa ? "punkt naa" : punkt.tid < dag.tid ? "punkt" : "punkt kommende";
      return `<span class="${klasse}">${ikon(ikonNavn(punkt.navn), "ikon-s")}<span class="tid">${tidTilDigital24(punkt.tid)}</span></span>`;
    })
    .join("")}</button>`;
}

function planHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  return `<button type="button" class="plan-bak" data-plan="lukk" aria-label="${si(spraak(), "Lukk", "Lukk")}"></button><div class="planliste">${planPunkter()
    .map((punkt) => `<div class="dagrad">${ikon(ikonNavn(punkt.navn))}<span class="dagtid">${tidTilDigital24(punkt.tid)}</span><p>${esc(punkt.navn)}</p></div>`)
    .join("")}</div>`;
}

function raad(): string {
  const dag = lagret.aktivDag;
  if (!dag) return si(spraak(), "Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka.");
  const oppgave = aktivOppgave(lagret);
  if (oppgave && !dag.forklaring) return oppgave.prompt;
  return nesteSteg(lagret).grunn;
}

function handlelisteRader(): { vare: VareId; har: boolean }[] {
  const maal = maalBygg(lagret);
  if (!maal) return [];
  const kurv = { ...lagret.kurv };
  return byggDef(maal.id).oppskrift.slice(maal.steg).map((trinn) => {
    const har = (kurv[trinn.vare] ?? 0) > 0;
    if (har) kurv[trinn.vare] = (kurv[trinn.vare] ?? 0) - 1;
    return { vare: trinn.vare, har };
  });
}

function pulsSted(): string | null {
  return nesteSteg(lagret).puls;
}

function kartNavn(): Record<string, string> {
  return {
    butikk: si(spraak(), "Butikk", "Butikk"),
    torg: si(spraak(), "Torget", "Torget"),
    tannlege: si(spraak(), "Tannlege", "Tannlækjar"),
    svommehall: si(spraak(), "Svømmehall", "Symjehall"),
    barnehage: si(spraak(), "Barnehage", "Barnehage"),
    hjemme: si(spraak(), "Hjem", "Heim"),
    pynt: si(spraak(), "Pyntebu", "Pyntebu"),
    taarn: si(spraak(), "Tårnet", "Tårnet"),
  };
}

function bybilde(tid = lagret.aktivDag?.tid ?? 15 * 60): string {
  const dag = lagret.aktivDag;
  const valg = anbefalt(lagret);
  const tomter = dag && valg.slag === "bygg" && !valg.instans ? ledigeTomter(lagret.by, valg.bygg).slice(0, 4) : [];
  const naa = celleFor(lagret);
  const avtaleSted = dag?.plan.avtaler.find((rad) => rad.varighet > 0 && !dag.besokt.includes(rad.id))?.sted ?? null;
  return `<div class="bykart">${tegnKart(lagret.by, tid, dag?.plan.leggetid ?? 20 * 60, {
    figur: gar ?? naa,
    garFra: gar ? naa : undefined,
    puls: pulsSted(),
    aktivitet: avtaleSted,
    tomter,
    navn: kartNavn(),
  })}</div>`;
}

function sceneHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const tilbake = `<button type="button" data-ute="1">${si(spraak(), "← Byen", "← Byen")}</button>`;
  if (dag.sted === "butikk") {
    const rader = handlelisteRader();
    const apning = dag.dorLest ? `<p>${esc(apningTekst(lagret))}</p>` : "";
    return `${tilbake}<section class="scene"><h1>${si(spraak(), "Butikken", "Butikken")}</h1>${apning}<div class="hyller">${rader
      .map((rad) => `<div class="kurv-rad${rad.har ? " har" : ""}">${delBilde(rad.vare)}<p>${rad.har ? "✓ " : ""}${esc(navnVare(rad.vare, spraak()))}</p></div>`)
      .join("")}</div><div class="ekspeditor">${byggmester(1)}</div></section>`;
  }
  if (dag.sted === "hjemme") {
    const spiser = nesteSteg(lagret).handling.slag === "spis";
    const hjem = lagret.by.bygg.find((bygg) => byggDef(bygg.bygg).hjem && !bygg.uthus);
    return `${tilbake}<section class="scene"><h1>${si(spraak(), "Hjemme", "Heime")}</h1>${tegnBygg(hjem?.bygg ?? "ronne", dag.tid >= 18 * 60)}${spiser ? `<p>${si(spraak(), "Familien er sulten.", "Familien er svolten.")}</p>` : ""}</section>`;
  }
  if (dag.sted === "byggeplass") {
    const plassert = lagret.by.bygg.find((bygg) => bygg.instans === dag.valgtInstans);
    if (!plassert) return tilbake;
    const def = byggDef(plassert.bygg);
    const steg = def.oppskrift[plassert.steg];
    const har = steg ? (lagret.kurv[steg.vare] ?? 0) > 0 : false;
    return `${tilbake}<section class="scene"><h1>${esc(byggNavn(plassert.bygg))}</h1>${tegnFremdrift(plassert.bygg, plassert.steg, def.oppskrift.length)}${
      steg
        ? `<div class="kurv-rad${har ? " har" : ""}">${delBilde(steg.vare)}<p>${esc(navnVare(steg.vare, spraak()))}</p></div>`
        : `<p>${si(spraak(), "Ferdig.", "Ferdig.")}</p>`
    }</section>`;
  }
  if (dag.sted === "torg") return `${tilbake}<section class="scene"><h1>${si(spraak(), "Torget", "Torget")}</h1>${urHtml(dag.tid)}</section>`;
  const tittel =
    dag.sted === "tannlege"
      ? si(spraak(), "Tannlegen", "Tannlækjaren")
      : dag.sted === "svommehall"
        ? si(spraak(), "Svømmehallen", "Symjehallen")
        : dag.sted === "barnehage"
          ? si(spraak(), "Barnehagen", "Barnehagen")
          : si(spraak(), "Aktivitet", "Aktivitet");
  return `${tilbake}<section class="scene"><h1>${tittel}</h1>${urHtml(dag.tid, true)}</section>`;
}

function enHandling(): string {
  const dag = lagret.aktivDag;
  const oppgave = aktivOppgave(lagret);
  if (oppgave && !dag?.forklaring) {
    if (oppgave.type === "still-klokka") return `<button type="button" class="hoved" data-svar="${pekerTid}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    if (oppgave.type === "sorter") {
      const antall = oppgave.varer?.length ?? 0;
      const ferdig = Object.keys(sorter).length >= antall && antall > 0;
      const tekst = Object.entries(sorter)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([vare, kasse]) => `${vare}:${kasse}`)
        .join(",");
      return `<button type="button" class="hoved" ${ferdig ? `data-svar="${tekst}"` : "disabled"}>${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    }
    if (oppgave.type === "finn-formen") {
      return `<button type="button" class="hoved" data-svar="${[...valgte].sort().join(",")}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    }
    if (oppgave.type === "tegn" && oppgave.form) {
      return `<button type="button" class="hoved" data-tegn="${esc(oppgave.form)}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    }
  }
  if (visPlan) return `<button type="button" class="hoved" data-plan="lukk">${si(spraak(), "Lukk", "Lukk")}</button>`;
  if (!dag || oppgave) return "";
  const steg = nesteSteg(lagret);
  if (steg.nei) {
    return `<button type="button" data-handling="ekstra-nei">${esc(steg.nei)}</button><button type="button" class="hoved" data-handling="ekstra-ja">${esc(steg.knapp)}</button>`;
  }
  const valg = steg.handling;
  const tekst = esc(steg.knapp);
  if (valg.slag === "mot") return `<button type="button" class="hoved" data-handling="mot">${tekst}</button>`;
  if (valg.slag === "spis") return `<button type="button" class="hoved" data-handling="spis">${tekst}</button>`;
  if (valg.slag === "handle") return `<button type="button" class="hoved" data-handling="handle">${tekst}</button>`;
  if (valg.slag === "gaa") return `<button type="button" class="hoved" data-ga="${valg.sted}">${tekst}</button>`;
  if (valg.slag === "bygg" && valg.instans && dag.sted === "byggeplass" && dag.valgtInstans === valg.instans) {
    return `<button type="button" class="hoved" data-handling="steg">${tekst}</button>`;
  }
  if (valg.slag === "bygg" && valg.instans) return `<button type="button" class="hoved" data-sted="bygg:${valg.instans}">${tekst}</button>`;
  if (valg.slag === "bygg") return `<button type="button" class="hoved" data-tomt-ga="1">${tekst}</button>`;
  if (valg.slag === "vent") return `<button type="button" class="hoved" data-handling="vent" data-tid="${valg.tid}">${tekst}</button>`;
  if (valg.slag === "legg") {
    const klokke = dag.plan.leggetid - dag.tid > 30 ? `<button type="button" data-handling="klokke">${si(spraak(), "Klokkeleken", "Klokkeleiken")}</button>` : "";
    return `${klokke}<button type="button" class="hoved" data-handling="avslutt">${tekst}</button>`;
  }
  if (valg.slag === "klokke") return `<button type="button" class="hoved" data-handling="klokke">${tekst}</button>`;
  return "";
}

function verdenHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const oppgave = aktivOppgave(lagret);
  const klokkeOppgave = oppgave !== null && ["les-klokka", "still-klokka", "hvor-lenge", "rekker-jeg", "koble", "apningstider"].includes(oppgave.type);
  const antall = Object.values(lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0);
  const viserScene = !gar && dag.fase !== "ute" && !oppgave;
  const riktigKort = reaksjon?.riktig === true;
  const viserOppgave = oppgave !== null && !riktigKort;
  return `<div class="verden"><header class="hud"><button type="button" data-skjerm="pause" aria-label="${si(spraak(), "Pause", "Pause")}">≡</button><button type="button" data-skjerm="kurv" aria-label="${si(spraak(), "Kurven", "Korga")}">${ikon("kurv")}<span>${antall}</span></button><span class="mynt" aria-label="${si(spraak(), "Mynter", "Myntar")}">${lagret.mynter}</span>${klokkeOppgave ? "" : `<button type="button" class="klokke" data-klokke="1" aria-label="${esc(tidTilOrd(dag.tid, spraak()))}">${urHtml(dag.tid, true, false, "hud")}</button>`}</header>
    ${stripeHtml()}
    ${melding ? `<p class="banner${melding.includes("flytter") ? " innflytting" : ""}">${melding.includes("flytter") ? byggmester() : ""}${esc(melding)}</p>` : ""}
    ${riktigKort && reaksjon ? `<article class="reaksjon riktig"><p>${esc(reaksjon.tekst)}</p></article>` : ""}
    <div class="verden-midten">${visPlan ? planHtml() : viserOppgave || riktigKort ? "" : `${ekstraBilde()}${viserScene ? sceneHtml() : bybilde()}`}
    ${visUr && !oppgave ? urHtml(dag.tid) : ""}
    ${viserOppgave && oppgave ? oppgaveHtml(oppgave) : ""}</div>
    <div class="verden-bunn">${viserOppgave || riktigKort || visPlan ? "" : `${oppdragMerke()}<div class="boble">${kjaeledyr(lagret.innstillinger.kjaeledyr)}<p>${esc(raad())}</p></div>`}
    ${enHandling()}</div></div>`;
}

function ekstraBilde(): string {
  const valg = anbefalt(lagret);
  if (valg.slag !== "ekstra") return "";
  const id = nesteByggId(lagret.by);
  if (!id) return "";
  return `<div class="silhuett">${tegnBygg(id)}<p>${esc(byggNavn(id))}</p></div>`;
}

function kartHtml(): string {
  const kan = byggSomKanStartes(lagret.by);
  const tomter = valgtBygg ? ledigeTomter(lagret.by, valgtBygg).slice(0, 8) : [];
  const vinkel = lagret.by.rotasjon * 90;
  return `<button type="button" data-skjerm="verden">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>${si(spraak(), "Byen", "Byen")}</h1>
    <div class="kart-bilde"><div style="transform:translate(${lagret.by.panX}px, ${lagret.by.panY}px) rotate(${vinkel}deg) scale(${lagret.by.skala})">${tegnKart(lagret.by, lagret.aktivDag?.tid ?? 15 * 60, lagret.aktivDag?.plan.leggetid ?? 20 * 60, { navn: kartNavn() })}</div></div>
    <div class="rad">
      <button type="button" data-kart="roter">${si(spraak(), "Snu", "Snu")}</button>
      <button type="button" data-kart="inn" aria-label="${si(spraak(), "Større", "Større")}">+</button>
      <button type="button" data-kart="ut" aria-label="${si(spraak(), "Mindre", "Mindre")}">−</button>
      <button type="button" data-kart="venstre" aria-label="${si(spraak(), "Venstre", "Venstre")}">←</button>
      <button type="button" data-kart="hoyre" aria-label="${si(spraak(), "Høyre", "Høgre")}">→</button>
      <button type="button" data-kart="opp" aria-label="${si(spraak(), "Opp", "Opp")}">↑</button>
      <button type="button" data-kart="ned" aria-label="${si(spraak(), "Ned", "Ned")}">↓</button>
    </div>
    <div class="liste">${kan
      .map((id) => `<button type="button" data-bygg="${id}">${tegnBygg(id)}${esc(byggNavn(id))}</button>`)
      .join("")}</div>
    <div class="liste">${tomter
      .map((tomt) => `<button type="button" data-tomt="${tomt.x},${tomt.y}">${esc(ruteNavn(tomt.x, tomt.y))}</button>`)
      .join("")}</div>
    <div class="liste">${lagret.by.bygg
      .map((bygg) => `<button type="button" data-apne="${esc(bygg.instans)}">${esc(byggNavn(bygg.bygg))} ${bygg.ferdig ? "★" : `${bygg.steg}`}</button>`)
      .join("")}</div>`;
}

let valgtPynt: VareId | "" = "";

function pyntRuter(): [number, number][] {
  const opptatt = new Set((lagret.by.pynt ?? []).map((pynt) => `${pynt.x},${pynt.y}`));
  const ut: [number, number][] = [];
  for (const bygg of lagret.by.bygg.filter((rad) => rad.ferdig)) {
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const x = bygg.x + dx;
      const y = bygg.y + dy;
      const nokkel = `${x},${y}`;
      if (x < 0 || y < 0 || opptatt.has(nokkel) || ut.some((rad) => rad[0] === x && rad[1] === y)) continue;
      ut.push([x, y]);
      if (ut.length >= 4) return ut;
    }
  }
  return ut;
}

function pyntHtml(): string {
  const ferdig = lagret.by.bygg.some((bygg) => bygg.bygg === "bronn" && bygg.ferdig);
  const varer = ["pynt-blomst", "pynt-flagg", "pynt-benk", "pynt-lykt"] as VareId[];
  const ruter = pyntRuter();
  return `<button type="button" data-skjerm="${lagret.aktivDag ? "verden" : "meny"}">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>${si(spraak(), "Pyntebu", "Pyntebu")}</h1>
    <p>${lagret.mynter} ${si(spraak(), "mynter. En pynt koster 2.", "myntar. Ein pynt kostar 2.")}</p>
    ${
      ferdig
        ? `<div class="liste">${varer
            .map((vare) => `<button type="button" data-pynt="${vare}" class="${valgtPynt === vare ? "valgt" : ""}">${esc(navnVare(vare, spraak()))}</button>`)
            .join("")}</div>${
            valgtPynt
              ? `<div class="liste">${ruter
                  .map(([x, y]) => `<button type="button" data-rute="${x},${y}">${esc(ruteNavn(x, y))}</button>`)
                  .join("")}</div>`
              : ""
          }`
        : `<p>${si(spraak(), "Brønnen må være ferdig først.", "Bronnen må vere ferdig først.")}</p>`
    }`;
}

function byggHtml(): string {
  const instans = lagret.aktivDag?.valgtInstans;
  const plassert = lagret.by.bygg.find((bygg) => bygg.instans === instans);
  if (!plassert) return `<button type="button" data-skjerm="kart">${si(spraak(), "Velg et bygg", "Vel eit bygg")}</button>`;
  const def = byggDef(plassert.bygg);
  const steg = def.oppskrift[plassert.steg];
  const tekst = steg ? fraNb(spraak(), steg.nb, steg.nn) : si(spraak(), "Ferdig.", "Ferdig.");
  return `<button type="button" data-skjerm="kart">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>${esc(byggNavn(plassert.bygg))}</h1>
    ${melding ? `<p class="boble">${esc(melding)}</p>` : ""}
    ${plassert.ferdig ? tegnBygg(plassert.bygg, (lagret.aktivDag?.tid ?? 0) >= 18 * 60) : steg ? `<div class="kurv-rad">${delBilde(steg.vare)}<p>${esc(tekst)} ${(lagret.kurv[steg.vare] ?? 0) > 0 ? si(spraak(), "Du har delen.", "Du har delen.") : si(spraak(), "Du trenger delen.", "Du treng delen.")}</p></div>` : ""}
    <ol>${def.oppskrift
      .map((rad, indeks) => `<li>${indeks < plassert.steg ? "✓ " : indeks === plassert.steg ? "→ " : ""}${esc(fraNb(spraak(), rad.nb, rad.nn))}</li>`)
      .join("")}</ol>
    ${steg ? `<button type="button" class="hoved" data-handling="steg">${si(spraak(), "Bygg steget", "Bygg steget")}</button>` : ""}
    <button type="button" data-handling="angre">${si(spraak(), "Angre", "Angre")}</button>
    <div class="rad">${(["pynt-blomst", "pynt-flagg", "pynt-benk", "pynt-lykt"] as VareId[])
      .map((vare) => `<button type="button" data-pynt="${vare}">${vare.replace("pynt-", "")}</button>`)
      .join("")}</div>`;
}

function menyHtml(): string {
  if (byenErFerdig(lagret.by)) {
    return `<div class="forside"><h1>${si(spraak(), "Byen er ferdig!", "Byen er ferdig!")}</h1>
      <p>${si(spraak(), "Slottsball! Byen feirer.", "Slottsball! Byen feirar.")}</p>
      ${bybilde(15 * 60)}
      <button type="button" class="hoved" data-handling="start">${si(spraak(), "Spill", "Spel")}</button>
      <button type="button" data-skjerm="pynt">${si(spraak(), "Pynt byen", "Pynt byen")}</button>
      <button type="button" data-skjerm="ur">${si(spraak(), "Klokkeleken", "Klokkeleiken")}</button>
      <div class="ikonrad">
        <button type="button" data-skjerm="dagbok">${si(spraak(), "Dagboka", "Dagboka")}</button>
        <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
      </div>
      ${
        bekreftNyBy
          ? `<p>${si(spraak(), "Dette sletter byen.", "Dette slettar byen.")}</p><button type="button" data-handling="ny-by">${si(spraak(), "Ja, start en ny by", "Ja, start ein ny by")}</button>`
          : `<button type="button" data-handling="spor-ny-by">${si(spraak(), "Start en ny by", "Start ein ny by")}</button>`
      }
    </div>`;
  }
  return `<div class="forside">
    ${bybilde(15 * 60)}
    <h1>Formbyen</h1>
    <p class="fremdrift">${esc(fremdriftTekst())}</p>
    <button type="button" class="hoved stor" data-handling="${lagret.aktivDag ? "fortsett-dag" : "start"}">${lagret.aktivDag ? si(spraak(), "Fortsett dagen", "Hald fram") : si(spraak(), "Spill", "Spel")}</button>
    <div class="ikonrad">
      <button type="button" data-skjerm="dagbok">${si(spraak(), "Dagboka", "Dagboka")}</button>
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
    </div>
  </div>`;
}

const MANED_ID = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

function skiltKort(): string {
  const dag = lagret.aktivDag;
  if (!dag || dag.dorLest || dag.plan.butikk.stengtHele || dag.sted !== "hjemme") return "";
  return `<button type="button" data-handling="dor">${si(spraak(), "Les åpningstidene før du går", "Les opningstidene før du går")}</button>`;
}

function fremdriftTekst(): string {
  const maal = maalBygg(lagret);
  const nivaa = String(lagret.by.nivaa);
  if (!maal) return mal(spraak(), "Bynivå {nivaa}.", "Bynivå {nivaa}.", { nivaa });
  const et = ["gjerde", "vedskjul", "hus", "slott", "bakeri"].includes(maal.id);
  return mal(spraak(), "Bynivå {nivaa}. Du bygger {bygg}.", "Bynivå {nivaa}. Du byggjer {bygg}.", {
    nivaa,
    bygg: `${et ? "et" : "en"} ${byggNavn(maal.id).toLowerCase()}`,
  });
}

function dagstartHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return menyHtml();
  const uke = ukedagTekst(spraak(), dag.plan.ukedag);
  const ukedag = uke.charAt(0).toUpperCase() + uke.slice(1);
  const maned = manedTekst(spraak(), MANED_ID[dag.plan.dato.maned - 1] ?? "januar");
  const maal = maalBygg(lagret);
  const grupper = grupperteDeler();
  const deler = grupper
    .map((rad) => {
      const navn = rad.antall === 1 ? `1 ${navnVare(rad.vare, spraak())}` : `${rad.antall} ${vareFlertall(rad.vare, spraak())}`;
      return `<span class="del ${rad.har === rad.antall ? "har" : ""}">${delSvg(rad.vare, 32)} ${esc(navn)}</span>`;
    })
    .join("");
  return `<div class="dagstart">
    <div class="dagstart-scroll">
    <p class="dato">${esc(ukedag)} ${dag.plan.dato.dag}. ${esc(maned)}</p>
    <h1>${si(spraak(), "Dagens plan", "Dagens plan")}</h1>
    <div class="dagliste">${planPunkter()
      .map((punkt) => `<div class="dagrad">${ikon(ikonNavn(punkt.navn))}<span class="dagtid">${tidTilDigital24(punkt.tid)}</span><p>${esc(punkt.navn)}</p></div>`)
      .join("")}</div>
    ${maal ? `<div class="bygg-start"><div class="bygg-lite">${tegnBygg(maal.id, false)}</div><h2>${esc(si(spraak(), "I dag bygger vi", "I dag byggjer vi"))} ${esc(bestemtBygg(maal.id).toLowerCase())}</h2><p>${esc(bestemtBygg(maal.id))} ${si(spraak(), "trenger:", "treng:")}</p><div class="delrad">${deler}</div></div>` : ""}
    </div>
    <div class="dagstart-bunn">${skiltKort()}
    <button type="button" class="hoved dagstart-start" data-handling="start-ettermiddag">${dag.plan.ukedag === "lordag" || dag.plan.ukedag === "sondag" ? si(spraak(), "Start dagen", "Start dagen") : si(spraak(), "Start ettermiddagen", "Start ettermiddagen")}</button></div>
  </div>`;
}

function grupperteDeler(): { vare: VareId; antall: number; har: number }[] {
  const ut: { vare: VareId; antall: number; har: number }[] = [];
  for (const rad of handlelisteRader()) {
    const funnet = ut.find((gruppe) => gruppe.vare === rad.vare);
    if (funnet) {
      funnet.antall += 1;
      if (rad.har) funnet.har += 1;
    } else ut.push({ vare: rad.vare, antall: 1, har: rad.har ? 1 : 0 });
  }
  return ut;
}

function introHtml(): string {
  const sider = [
    si(spraak(), "Her er byen din. Rønna står klar.", "Her er byen din. Rønna står klar."),
    si(spraak(), "Her står en rønne. Du kan bo her.", "Her står ei rønne. Du kan bu her."),
    si(spraak(), "Bygg helt til slottet.", "Bygg heilt til slottet."),
    si(spraak(), "Pass på klokka. Butikken har åpningstid.", "Pass på klokka. Butikken har opningstid."),
  ];
  const bilder = [
    bybilde(10 * 60),
    tegnBygg("ronne"),
    tegnKart(lagret.by, 16 * 60, 20 * 60, { navn: kartNavn() }),
    urHtml(14 * 60 + 30),
  ];
  const figur = introSide === 4
    ? `<h2>${si(spraak(), "Velg figur", "Vel figur")}</h2><div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${lagret.innstillinger.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div><h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2><div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "valgt" : ""}">${kjaeledyr(dyr)}</button>`).join("")}</div>`
    : "";
  const bilde = introSide < 4 ? (bilder[introSide] ?? "") : "";
  const setning = introSide < 4 ? sider[introSide] ?? "" : si(spraak(), "Velg hvem som bygger.", "Vel kven som byggjer.");
  return `<div class="forside intro"><h1>Formbyen</h1>${bilde}<p>${esc(setning)}</p>${figur}
    <button type="button" class="hoved" data-intro="neste">${introSide >= 4 ? si(spraak(), "Spill", "Spel") : si(spraak(), "Neste", "Neste")}</button>
    <button type="button" data-intro="hopp">${si(spraak(), "Hopp over", "Hopp over")}</button></div>`;
}

function pauseHtml(): string {
  return `<h1>${si(spraak(), "Pause", "Pause")}</h1>
    <div class="liste">
      <button type="button" class="hoved" data-skjerm="verden">${si(spraak(), "Fortsett", "Hald fram")}</button>
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
      ${
        bekreftAvslutt
          ? `<p>${si(spraak(), "Avslutte dagen nå?", "Avslutte dagen no?")}</p><button type="button" data-handling="avslutt">${si(spraak(), "Ja, avslutt", "Ja, avslutt")}</button>`
          : `<button type="button" data-handling="spor-avslutt">${si(spraak(), "Avslutt dagen", "Avslutt dagen")}</button>`
      }
    </div>`;
}

function velgHtml(): string {
  return `<h1>${si(spraak(), "Hvem bygger?", "Kven byggjer?")}</h1>
    <div class="figurer">${[0, 1, 2, 3]
      .map((variant) => `<button type="button" data-figur="${variant}" class="${lagret.innstillinger.figur === variant ? "riktig" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`)
      .join("")}</div>
    <div class="figurer">${(["hund", "katt", "kanin"] as const)
      .map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "riktig" : ""}" aria-label="${dyrNavn(dyr)}">${kjaeledyr(dyr)}</button>`)
      .join("")}</div>
    <button type="button" class="hoved" data-start="1">${si(spraak(), "Klar", "Klar")}</button>`;
}

function innstillingerHtml(): string {
  const inn = lagret.innstillinger;
  const niva: Nivaa[] = ["forste", "andre", "utfordrende", "blandet"];
  const navn: Record<Nivaa, [string, string]> = {
    forste: ["1. klasse", "1. klasse"],
    andre: ["2. klasse", "2. klasse"],
    utfordrende: ["Utfordrende", "Utfordrande"],
    blandet: ["Blandet", "Blanda"],
  };
  const linje: Record<Nivaa, [string, string]> = {
    forste: ["Hele timer og halve.", "Heile timar og halve."],
    andre: ["Kvartene også.", "Kvartane også."],
    utfordrende: ["Fem minutter.", "Fem minutt."],
    blandet: ["Litt av hvert.", "Litt av kvart."],
  };
  const tilbake = lagret.aktivDag ? "pause" : "meny";
  const faner = (["figur", "nivaa", "sprak", "voksen"] as const)
    .map((id) => {
      const navnFane =
        id === "figur"
          ? si(spraak(), "Figur", "Figur")
          : id === "nivaa"
            ? si(spraak(), "Nivå", "Nivå")
            : id === "sprak"
              ? si(spraak(), "Språk", "Språk")
              : si(spraak(), "Voksen", "Vaksen");
      return `<button type="button" data-fane="${id}" class="${innFane === id ? "valgt" : ""}">${navnFane}</button>`;
    })
    .join("");
  const figur =
    innFane === "figur"
      ? `<h2>${si(spraak(), "Velg figur", "Vel figur")}</h2>
    <div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${inn.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div>
    <h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2>
    <div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${inn.kjaeledyr === dyr ? "valgt" : ""}" aria-label="${dyrNavn(dyr)}">${kjaeledyr(dyr)}</button>`).join("")}</div>
    <button type="button" data-intro="se">${si(spraak(), "Se introduksjonen", "Sjå introduksjonen")}</button>`
      : "";
  const nivaaBlokk =
    innFane === "nivaa"
      ? `<h2>${si(spraak(), "Nivå", "Nivå")}</h2><div class="liste">${niva.map((id) => `<button type="button" data-nivaa="${id}" class="nivaa-kort ${inn.nivaa === id ? "valgt" : ""}"><strong>${si(spraak(), navn[id][0], navn[id][1])}</strong><span>${si(spraak(), linje[id][0], linje[id][1])}</span></button>`).join("")}</div>`
      : "";
  const sprak =
    innFane === "sprak"
      ? `<h2>${si(spraak(), "Lyd og visning", "Lyd og vising")}</h2>
    <div class="rad">
      <button type="button" class="bryter" data-lyd="1" aria-pressed="${inn.lydPa ? "true" : "false"}"><span>${si(spraak(), "Lyd", "Lyd")}</span><span>${inn.lydPa ? si(spraak(), "Lyd på", "Lyd på") : si(spraak(), "Lyd av", "Lyd av")}</span></button>
      <button type="button" class="bryter" data-digital="1" aria-pressed="${inn.skjulDigital ? "false" : "true"}"><span>${si(spraak(), "Digital klokke", "Digital klokke")}</span><span>${inn.skjulDigital ? si(spraak(), "Klokke av", "Klokke av") : si(spraak(), "Klokke på", "Klokke på")}</span></button>
    </div>
    <h2>${si(spraak(), "Språk", "Språk")}</h2>
    <select id="spraak" class="spraak">${SPRAAK.map((kode) => `<option value="${kode}" ${inn.spraak === kode ? "selected" : ""}>${SPRAAK_NAVN[kode]}</option>`).join("")}</select>`
      : "";
  const voksen =
    innFane === "voksen"
      ? `<h2>${si(spraak(), "For voksne", "For vaksne")}</h2>
    <button type="button" data-skjerm="voksen">${si(spraak(), "Kompetansemål", "Kompetansemål")}</button>
    <button type="button" data-skjerm="installer">${si(spraak(), "Installer", "Installer")}</button>
    <button type="button" data-skjerm="om">${si(spraak(), "Les mer", "Les meir")}</button>`
      : "";
  return `<div class="innstillinger"><button type="button" data-skjerm="${tilbake}">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Innstillinger", "Innstillingar")}</h1>
    <div class="rad">${faner}</div>
    <div class="inn-midten">${figur}${nivaaBlokk}${sprak}${voksen}</div>
    <button type="button" data-oppdater="1">${si(spraak(), "Sjekk for oppdateringer", "Sjekk for oppdateringar")}</button>
    ${statusOppdater ? `<p>${esc(fraNb(spraak(), statusOppdater))}</p>` : ""}</div>`;
}

function voksenHtml(): string {
  if (!voksenInne) {
    return `<button type="button" data-skjerm="innstillinger">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "For voksne", "For vaksne")}</h1><p>${esc(voksen.tekst)}</p><input id="voksen-svar" inputmode="numeric" value="${esc(voksenFelt)}"/><button type="button" data-voksen="sjekk">${si(spraak(), "Åpne", "Opne")}</button>`;
  }
  const maal = [
    ["Klokke og kalender", ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24", "tidsrom", "periode", "ukedager", "maneder"]],
    ["Former", ["former-grunn", "former-flere", "sortere", "telle-2d", "tegne", "monster"]],
    ["3D og måling", ["former-3d", "telle-3d", "stempel", "lengde", "masse", "areal", "koordinater", "likevekt"]],
  ] as const;
  const ferdigNavn: Record<string, [string, string]> = {
    "hele-timer": ["Hele timer", "Heile timar"],
    halv: ["Halvtime", "Halvtime"],
    kvart: ["Kvart", "Kvart"],
    "fem-minutter": ["Fem minutter", "Fem minutt"],
    "digital-24": ["Digital klokke", "Digital klokke"],
    tidsrom: ["Tidsrom", "Tidsrom"],
    periode: ["Tid på dagen", "Tid på dagen"],
    ukedager: ["Ukedager", "Vekedagar"],
    maneder: ["Måneder", "Månader"],
    "former-grunn": ["Sirkel, trekant og kvadrat", "Sirkel, trekant og kvadrat"],
    "former-flere": ["Flere former", "Fleire former"],
    sortere: ["Sortere", "Sortere"],
    "telle-2d": ["Telle sider og hjørner", "Telje sider og hjørne"],
    tegne: ["Tegne", "Teikne"],
    monster: ["Mønster", "Mønster"],
    "former-3d": ["Romformer", "Romformer"],
    "telle-3d": ["Telle kanter og flater", "Telje kantar og flater"],
    stempel: ["Stempel", "Stempel"],
    lengde: ["Lengde", "Lengde"],
    masse: ["Masse", "Masse"],
    areal: ["Areal", "Areal"],
    koordinater: ["Koordinater", "Koordinatar"],
    likevekt: ["Likevekt", "Likevekt"],
  };
  const snitt = (ids: readonly string[]) => {
    const sum = ids.reduce((antall, id) => antall + (lagret.mestring[id as keyof typeof lagret.mestring]?.riktige ?? 0), 0);
    return Math.min(100, Math.round((sum / (ids.length * 3)) * 100));
  };
  const klokkeIds = maal[0]?.[1] ?? [];
  const formIds = [...(maal[1]?.[1] ?? []), ...(maal[2]?.[1] ?? [])];
  const detalj =
    voksenStolpe === "klokke" ? klokkeIds : voksenStolpe === "former" ? formIds.slice(0, 6) : [];
  const mestring = `<button type="button" data-stolpe="klokke">${si(spraak(), "Klokke", "Klokke")}</button><div class="maal"><span style="width:${snitt(klokkeIds)}%"></span></div>
    <button type="button" data-stolpe="former">${si(spraak(), "Former", "Former")}</button><div class="maal"><span style="width:${snitt(formIds)}%"></span></div>
    ${detalj
      .map((id) => {
        const rad = lagret.mestring[id];
        const bredde = Math.min(100, Math.round(((rad?.riktige ?? 0) / 3) * 100));
        const par = ferdigNavn[id] ?? [id, id];
        return `<p>${si(spraak(), par[0], par[1])}</p><div class="maal"><span style="width:${bredde}%"></span></div>`;
      })
      .join("")}
    <button type="button" data-tidsrom="1" class="${lagret.innstillinger.tidsromPa ? "valgt" : ""}">${si(spraak(), "Tidsrom", "Tidsrom")}</button>
    <button type="button" data-rekord="1" class="${lagret.innstillinger.rekordlistePa ? "valgt" : ""}">${si(spraak(), "Dagbokliste", "Dagbokliste")}</button>`;
  const avtaler = `<div class="rad">
      <select id="fast-aktivitet">${(["lekser", "hund", "tannlege", "svomming", "dans", "fotball", "korps", "piano", "kor", "bibliotek"] as const).map((id) => `<option value="${id}">${esc(visNavn(id, spraak()))}</option>`).join("")}</select>
      <select id="fast-dag">${(["mandag", "tirsdag", "onsdag", "torsdag", "fredag"] as const).map((dag) => `<option value="${dag}">${ukedagTekst(spraak(), dag)}</option>`).join("")}</select>
      <select id="fast-tid">${[15, 16, 17, 18, 19].map((time) => `<option value="${time * 60}">${tidTilDigital24(time * 60)}</option>`).join("")}</select>
      <button type="button" data-fast="1">${si(spraak(), "Fest avtale", "Fest avtale")}</button>
    </div>
    ${lagret.innstillinger.fasteAvtaler.map((avtale, indeks) => `<p>${esc(avtale.aktivitet)} ${ukedagTekst(spraak(), avtale.ukedag)} ${tidTilDigital24(avtale.start)} <button type="button" data-fjern="${indeks}">×</button></p>`).join("")}`;
  const slett =
    nullSteg >= 2
      ? `<p>${si(spraak(), "Slette byen på denne telefonen?", "Slette byen på denne telefonen?")}</p><button type="button" data-null="ja">${si(spraak(), "Slett", "Slett")}</button>`
      : nullSteg === 1
        ? `<p>${si(spraak(), "Er du sikker?", "Er du sikker?")}</p><button type="button" data-null="sikker">${si(spraak(), "Er du sikker?", "Er du sikker?")}</button>`
        : `<button type="button" data-null="spor">${si(spraak(), "Nullstill byen", "Nullstill byen")}</button>`;
  const data = `<button type="button" data-eksport="1">${si(spraak(), "Eksporter byen", "Eksporter byen")}</button>
    <input id="import-fil" type="file" accept="application/json"/>
    ${slett}`;
  const om = `<p>Formbyen</p><button type="button" data-oppdater="1">${si(spraak(), "Sjekk for oppdateringer", "Sjekk for oppdateringar")}</button>
    <p>${si(spraak(), "Barnet øver former og klokka. Ingen konto og ingen analyse.", "Barnet øver former og klokka. Ingen konto og ingen analyse.")}</p>`;
  const seksjon = (id: "mestring" | "avtaler" | "data" | "om", tittel: string, innhold: string) =>
    `<button type="button" data-fane="${id}">${tittel}</button>${voksenFane === id ? `<div class="voksen-innhold">${innhold}</div>` : ""}`;
  return `<div class="voksen"><button type="button" data-skjerm="innstillinger">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "For voksne", "For vaksne")}</h1>
    ${seksjon("mestring", si(spraak(), "Mestring", "Mestring"), mestring)}
    ${seksjon("avtaler", si(spraak(), "Faste avtaler", "Faste avtalar"), avtaler)}
    ${seksjon("data", si(spraak(), "Data", "Data"), data)}
    ${seksjon("om", si(spraak(), "Om appen", "Om appen"), om)}</div>`;
}

function omHtml(): string {
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>Formbyen</h1>
    <p>${si(spraak(), "Et byggespill om former og klokka for 1. og 2. klasse. Riktige svar gir materialer. Ingenting som er bygget, forsvinner.", "Eit byggespel om former og klokka for 1. og 2. klasse. Rette svar gir materiale. Ingenting som er bygd, forsvinn.")}</p>
    <h2>${si(spraak(), "Personvern", "Personvern")}</h2>
    <p>${si(spraak(), "Ingen konto. Ingen sky. Ingen analyse. Byen ligger bare på telefonen. Du kan eksportere den som fil.", "Ingen konto. Ingen sky. Ingen analyse. Byen ligg berre på telefonen. Du kan eksportere han som fil.")}</p>
    <p>${si(spraak(), "Ideen er Reidar Kind sin. Utviklet ved hjelp av AI.", "Ideen er Reidar Kind sin. Utvikla ved hjelp av AI.")}</p>
    <a class="knapp" href="https://reidarkind.github.io/myapps/" target="_blank" rel="noopener noreferrer">${si(spraak(), "Andre apper", "Andre appar")}</a>`;
}

function installerHtml(): string {
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>Formbyen</h1>
    <p>${si(spraak(), "Formbyen er en nettside du legger på hjemskjermen. Den ligger ikke i App Store.", "Formbyen er ei nettside du legg på heimeskjermen. Ho ligg ikkje i App Store.")}</p>
    <h2>iPhone</h2>
    <ol>
      <li>${si(spraak(), "Åpne Formbyen i Safari.", "Opne Formbyen i Safari.")}</li>
      <li>${si(spraak(), "Trykk Del.", "Trykk Del.")}</li>
      <li>${si(spraak(), "Trykk Legg til på Hjem-skjerm.", "Trykk Legg til på Heim-skjerm.")}</li>
    </ol>
    <h2>Android</h2>
    <ol>
      <li>${si(spraak(), "Åpne Formbyen i Chrome.", "Opne Formbyen i Chrome.")}</li>
      <li>${si(spraak(), "Trykk menyen og Installer app.", "Trykk menyen og Installer app.")}</li>
    </ol>
    <p>${si(spraak(), "Når du har åpnet appen én gang, kan du spille uten nett.", "Når du har opna appen éin gong, kan du spele utan nett.")}</p>`;
}

function kveldHtml(): string {
  const sist = lagret.dagbok.at(-1);
  const bygget = sist?.bygget.map((id) => byggNavn(id as ByggId)).join(", ") || si(spraak(), "Ingen nye bygg.", "Ingen nye bygg.");
  const former = (sist?.former ?? []).filter((id) => formNavn(id, spraak()) !== id || ["kule", "kube", "sylinder", "kjegle", "sirkel", "trekant", "kvadrat", "rektangel"].includes(id));
  const linjer = (sist?.avtaler ?? [])
    .map((avtale) => {
      const navn = visNavn(avtale.aktivitet, spraak());
      const merke = avtale.gjort ? "✓" : "✗";
      const ekstra = avtale.gjort ? "" : avtale.ikke ? si(spraak(), " – ikke i dag", " – ikkje i dag") : si(spraak(), " – vi kom for sent", " – vi kom for seint");
      return `<p>${merke} ${esc(navn)} ${tidTilDigital24(avtale.start)}${esc(ekstra)}</p>`;
    })
    .join("");
  const tidligere = new Set(lagret.dagbok.slice(0, -1).flatMap((inn) => inn.former));
  const nye = former.filter((id) => !tidligere.has(id));
  const stjerneLinjer = (sist?.merknad ?? "").split("\n").filter(Boolean);
  const formLinje = nye.length
    ? `<p>${esc(si(spraak(), "Ny form i dag:", "Ny form i dag:"))} ${esc(nye.map((id) => formNavn(id, spraak())).join(", "))}</p>`
    : "";
  const antall = sist?.stjerner ?? (sist?.stjerne ? 1 : 0);
  const fest = sist && ukedagFor(sist.dato) === "fredag" && fredagsfest(sist.dato) ? `<p>${esc(si(spraak(), "Fredagsfest på torget.", "Fredagsfest på torget."))}</p>` : "";
  const avtaleLinje = (sist?.avtaler?.length ?? 0) > 4 && !kveldApne
    ? `<button type="button" data-kveld="avtaler">${"✓"} ${(sist?.avtaler ?? []).filter((avtale) => avtale.gjort).length} ${si(spraak(), "av", "av")} ${sist?.avtaler?.length ?? 0} ${si(spraak(), "avtaler", "avtalar")}</button>`
    : linjer;
  const hendelser = (sist?.avtaler ?? []).slice(0, 6);
  const valgt = kveldOrden.filter((indeks) => indeks >= 0 && indeks < hendelser.length);
  const igjen = hendelser.map((avtale, indeks) => ({ avtale, indeks })).filter((rad) => !valgt.includes(rad.indeks));
  const rekkefolge = hendelser.length
    ? `<div class="rekkefolge"><p>${si(spraak(), "Min dag i rekkefølge", "Min dag i rekkjefølgje")}</p>${igjen
        .map((rad) => `<button type="button" data-kveld="${rad.indeks}">${esc(visNavn(rad.avtale.aktivitet, spraak()))} ${tidTilDigital24(rad.avtale.start)}</button>`)
        .join("")}${valgt.map((indeks) => `<p>${tidTilDigital24(hendelser[indeks]?.start ?? 0)}</p>`).join("")}</div>`
    : "";
  return `<div class="kveld"><div class="kveld-midt"><h1>${si(spraak(), "Kvelden kommer", "Kvelden kjem")}</h1>
    <div class="kveld-kart">${tegnKart(lagret.by, 20 * 60, 20 * 60, { hele: true, navn: kartNavn() })}</div>
    <p class="stjerner">${"★".repeat(antall) || "·"}</p>
    ${stjerneLinjer.map((linje) => `<p>${esc(linje)}</p>`).join("")}
    ${fest}
    ${rekkefolge}
    ${avtaleLinje}
    <p>${esc(bygget)}</p>
    ${formLinje}</div>
    <div class="kveld-bunn"><button type="button" class="hoved" data-skjerm="meny">${si(spraak(), "God natt", "God natt")}</button></div></div>`;
}

function kurvHtml(): string {
  const rader = Object.entries(lagret.kurv).filter((rad) => (rad[1] ?? 0) > 0);
  const mangler = manglendeDeler(lagret);
  return `<button type="button" data-skjerm="verden">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Kurven", "Korga")}</h1>
    ${rader.map(([id, antall]) => `<div class="kurv-rad">${delBilde(id)}<p>${esc(navnVare(id, spraak()))} × ${antall}</p></div>`).join("") || `<p>${si(spraak(), "Kurven er tom.", "Korga er tom.")}</p>`}
    <h2>${si(spraak(), "Neste del", "Neste del")}</h2>
    ${mangler.length ? `<div class="kurv-rad">${delBilde(mangler[0] ?? "")}<p>${esc(navnVare(mangler[0] ?? "", spraak()))}</p></div>` : `<p>${si(spraak(), "Handlelisten er tom.", "Handlelista er tom.")}</p>`}`;
}

function dagbokHtml(): string {
  const liste = lagret.innstillinger.rekordlistePa ? lagret.dagbok : lagret.dagbok.slice(-7);
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Dagboka", "Dagboka")}</h1>
    ${liste.map((inn) => `<p>${inn.dato.dag}.${inn.dato.maned} ${"★".repeat(inn.stjerner ?? (inn.stjerne ? 1 : 0)) || "·"} ${esc(inn.bygget.map((id) => byggNavn(id as ByggId)).join(", "))} ${esc(inn.former.map((id) => formNavn(id, spraak())).join(", "))}</p>`).join("") || `<p>${si(spraak(), "Ingen dager ennå.", "Ingen dagar enno.")}</p>`}
    <button type="button" data-skjerm="album">${si(spraak(), "Fotoalbum", "Fotoalbum")}</button>`;
}

function kjentForm(id: string): boolean {
  if (lagret.by.kjente3d.includes(id)) return true;
  if (lagret.aktivDag?.formerIDag.includes(id)) return true;
  return lagret.dagbok.some((inn) => inn.former.includes(id));
}

function formEgenskap(id: string): string {
  const hjorner = erForm3d(id) ? form3d(id).hjorner : erForm2d(id) ? form2d(id).hjorner : 0;
  if (id === "kule" || id === "sylinder" || id === "kjegle") return si(spraak(), "Kan trille", "Kan trille");
  if (hjorner === 0) return si(spraak(), "Ingen hjørner", "Ingen hjørne");
  return mal(spraak(), "{tall} hjørner", "{tal} hjørne", { tall: String(hjorner), tal: String(hjorner) });
}

function fredagsfest(dato: Lagret["dato"]): boolean {
  const dag = new Date(Date.UTC(dato.aar, dato.maned - 1, dato.dag));
  const ukedag = dag.getUTCDay();
  const mandag = new Date(dag);
  mandag.setUTCDate(dag.getUTCDate() - (ukedag === 0 ? 6 : ukedag - 1));
  const sondag = new Date(mandag);
  sondag.setUTCDate(mandag.getUTCDate() + 6);
  const treff = lagret.dagbok.filter((inn) => {
    const d = new Date(Date.UTC(inn.dato.aar, inn.dato.maned - 1, inn.dato.dag));
    const stjerner = inn.stjerner ?? (inn.stjerne ? 1 : 0);
    return d >= mandag && d <= sondag && stjerner >= 1;
  });
  return treff.length >= 5;
}

function albumHtml(): string {
  const kort = [...ALLE_2D, ...ALLE_3D]
    .map((id) => {
      const kjent = kjentForm(id);
      return `<article class="formkort${kjent ? "" : " ukjent"}">${formSvg(id, 64)}<p>${esc(formNavn(id, spraak()))}</p>${kjent ? `<p>${esc(formEgenskap(id))}</p>` : ""}</article>`;
    })
    .join("");
  return `<button type="button" data-skjerm="dagbok">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Fotoalbum", "Fotoalbum")}</h1>
    ${lagret.album.map((foto, indeks) => `<article class="kort">${foto.svg}<button type="button" data-del="${indeks}">${si(spraak(), "Del bilde", "Del bilete")}</button></article>`).join("") || `<p>${si(spraak(), "Bildene kommer når byen vokser.", "Bileta kjem når byen veks.")}</p>`}
    <h2>${si(spraak(), "Pynt", "Pynt")}</h2>
    ${(lagret.by.pynt ?? []).map((pynt) => `<p>${esc(navnVare(pynt.vare, spraak()))} ${esc(ruteNavn(pynt.x, pynt.y))}</p>`).join("") || `<p>${si(spraak(), "Ingen pynt ennå.", "Ingen pynt enno.")}</p>`}
    <h2>${si(spraak(), "Former", "Former")}</h2>
    <div class="formalbum">${kort}</div>`;
}

function iMorgenNavn(tid: number): string {
  const plan = lagDagsplan({
    fro: lagret.fro + 1,
    dato: nesteDato(lagret.dato),
    nivaa: lagret.innstillinger.nivaa,
    spraak: lagret.innstillinger.spraak,
    ferdige: ferdigeBygg(lagret.by),
    ukerytme: lagret.ukerytme,
    fasteAvtaler: lagret.innstillinger.fasteAvtaler,
    siste: lagret.sistePlaner,
    bursdager: lagret.bursdager,
  });
  const avtale = plan.avtaler.find((rad) => snapTilSteg(rad.start) === tid && rad.varighet > 0);
  return avtale ? visNavn(avtale.aktivitet ?? avtale.navn, spraak()) : "";
}

function urFriHtml(): string {
  const steg = minuttSteg();
  const maal = urRunde[urStegNr] ?? snapTilSteg(lagret.aktivDag?.tid ?? 12 * 60);
  const navn = iMorgenNavn(maal).toLowerCase();
  const ord = tidTilOrd(maal, spraak());
  const prompt = navn
    ? mal(spraak(), "I morgen begynner {navn} klokka {ord}. Still tårnuret så folk kommer i tide.", "I morgon byrjar {navn} klokka {ord}. Still tårnuret så folk kjem i tide.", { navn, ord })
    : mal(spraak(), "I morgen er klokka {ord}. Still tårnuret så folk kommer i tide.", "I morgon er klokka {ord}. Still tårnuret så folk kjem i tide.", { ord });
  const arm = lagret.aktivDag ? `<div class="armband">${urHtml(lagret.aktivDag.tid, true, false, "hud")}</div>` : "";
  return `<div class="ur-skjerm">
    <div class="ur-topp"><button type="button" data-skjerm="verden">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Tårnuret", "Tårnuret")}</h1>${arm}<span>${urStegNr + 1}/${Math.max(urRunde.length, 1)}</span></div>
    <p class="ur-prompt">${esc(prompt)}</p>
    ${melding ? `<p class="banner">${esc(melding)}</p>` : ""}
    <div class="ur-midten">${urHtml(pekerTid, false, true, "analog", 96)}</div>
    <div class="ur-bunn"><div class="rad"><button type="button" data-minutt="-${steg}">${mal(spraak(), "− {tall} min", "− {tall} min", { tall: String(steg) })}</button><button type="button" data-minutt="${steg}">${mal(spraak(), "+ {tall} min", "+ {tall} min", { tall: String(steg) })}</button><button type="button" data-time="-1">${si(spraak(), "− 1 time", "− 1 time")}</button><button type="button" data-time="1">${si(spraak(), "+ 1 time", "+ 1 time")}</button></div>
    <button type="button" class="hoved" data-handling="ur-ferdig">${si(spraak(), "Ferdig", "Ferdig")}</button></div></div>`;
}

function tegn(): string {
  const klasse = lagret.aktivDag ? `himmel-${himmel(lagret.aktivDag.tid)}` : "himmel-dag";
  document.body.className = klasse;
  document.documentElement.lang = spraak();
  const innhold =
    skjerm === "intro"
      ? introHtml()
      : skjerm === "velg"
      ? velgHtml()
        : skjerm === "meny"
        ? menyHtml()
        : skjerm === "dagstart"
          ? dagstartHtml()
        : skjerm === "pause"
          ? pauseHtml()
          : skjerm === "kurv"
            ? kurvHtml()
        : skjerm === "verden"
          ? verdenHtml()
          : skjerm === "kart"
            ? kartHtml()
            : skjerm === "bygg"
              ? byggHtml()
              : skjerm === "pynt"
                ? pyntHtml()
              : skjerm === "kveld"
                ? kveldHtml()
                : skjerm === "innstillinger"
                  ? innstillingerHtml()
                  : skjerm === "voksen"
                    ? voksenHtml()
                    : skjerm === "om"
                      ? omHtml()
                      : skjerm === "installer"
                        ? installerHtml()
                        : skjerm === "dagbok"
                          ? dagbokHtml()
                          : skjerm === "album"
                            ? albumHtml()
                            : urFriHtml();
  const aapen = skjerm === "verden" || skjerm === "meny" || skjerm === "kveld";
  rot.innerHTML = `${visOppdater ? `<div class="banner"><p>${si(spraak(), "Ny versjon.", "Ny versjon.")}</p><button type="button" data-last="1">${si(spraak(), "Åpne på nytt", "Opne på nytt")}</button></div>` : ""}<main class="${aapen ? "by" : "kort"}">${innhold}</main>`;
  klargjorLerret();
  kobleDra();
  return "";
}

function kobleDra(): void {
  const flate = document.querySelector(".valg");
  if (!flate || aktivOppgave(lagret)?.type !== "sorter") return;
  bindDra(flate, (vare, kasse) => {
    if (!kasse) return;
    sorter[vare] = kasse;
    valgtVare = "";
    ristVarer.delete(vare);
    hoppKlikk = true;
    window.setTimeout(() => {
      hoppKlikk = false;
    }, 0);
    tegn();
  });
}

function klargjorLerret(): void {
  const spokelse = document.querySelector<HTMLCanvasElement>("#spokelse");
  const oppgave = aktivOppgave(lagret);
  if (!spokelse || !oppgave?.form) return;
  if (!erForm2d(oppgave.form)) return;
  const maske = omrissForForm(oppgave.form, 240, 240);
  const ctx = spokelse.getContext("2d");
  if (!ctx) return;
  const bilde = ctx.createImageData(240, 240);
  for (let i = 0; i < maske.maske.length; i++) {
    if (!maske.maske[i]) continue;
    bilde.data[i * 4] = 59;
    bilde.data[i * 4 + 1] = 47;
    bilde.data[i * 4 + 2] = 42;
    bilde.data[i * 4 + 3] = 70;
  }
  ctx.putImageData(bilde, 0, 0);
}

let tegner = false;
let drarUr = false;
let droUr = false;
let hoppKlikk = false;

function justerUr(ur: Element, hendelse: PointerEvent): void {
  const svg = ur.querySelector("svg");
  if (!svg) return;
  const rect = svg.getBoundingClientRect();
  const dx = hendelse.clientX - (rect.left + rect.width / 2);
  const dy = hendelse.clientY - (rect.top + rect.height / 2);
  let grader = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (grader < 0) grader += 360;
  const steg = minuttSteg();
  const minutter = (Math.round(grader / (6 * steg)) * steg) % 60;
  pekerTid = klokke(timer(pekerTid), minutter);
}

rot.addEventListener("pointerdown", (hendelse) => {
  const mal = hendelse.target;
  if (!(mal instanceof Element)) return;
  const lerret = mal.closest("#lerret");
  if (lerret instanceof HTMLCanvasElement) {
    tegner = true;
    tegnStrek(lerret, hendelse);
    return;
  }
  const ur = mal.closest("[data-ur]");
  if (ur instanceof HTMLElement && !mal.closest("button") && !mal.closest("[data-tall]")) {
    drarUr = true;
    droUr = false;
    ur.setPointerCapture(hendelse.pointerId);
    justerUr(ur, hendelse);
    skrivPeker();
  }
});
rot.addEventListener("pointermove", (hendelse) => {
  if (tegner) {
    const lerret = document.querySelector<HTMLCanvasElement>("#lerret");
    if (lerret) tegnStrek(lerret, hendelse);
    return;
  }
  if (!drarUr) return;
  const ur = document.querySelector("[data-ur]");
  if (!ur) return;
  droUr = true;
  justerUr(ur, hendelse);
  skrivPeker();
});
rot.addEventListener("pointerup", () => {
  tegner = false;
  if (!drarUr) return;
  drarUr = false;
  if (droUr) {
    hoppKlikk = true;
    window.setTimeout(() => {
      hoppKlikk = false;
    }, 0);
  }
  droUr = false;
  tegn();
});

function tegnStrek(lerret: HTMLCanvasElement, hendelse: PointerEvent): void {
  const rect = lerret.getBoundingClientRect();
  const x = ((hendelse.clientX - rect.left) / rect.width) * lerret.width;
  const y = ((hendelse.clientY - rect.top) / rect.height) * lerret.height;
  const ctx = lerret.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#3B2F2A";
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
}

function settPeker(timeDelta: number, minuttDelta: number, byttDogn: boolean): void {
  let minutter = pekerTid + timeDelta * 60 + minuttDelta;
  if (byttDogn) minutter += timer(pekerTid) < 12 ? 12 * 60 : -12 * 60;
  pekerTid = ((minutter % (24 * 60)) + 24 * 60) % (24 * 60);
  tegn();
}

rot.addEventListener("change", (hendelse) => {
  const mal = hendelse.target;
  if (!(mal instanceof HTMLSelectElement) || mal.id !== "spraak" || !erSpraak(mal.value)) return;
  lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, spraak: mal.value } };
  lagre();
  tegn();
});

rot.addEventListener("click", (hendelse) => {
  if (hoppKlikk) {
    hoppKlikk = false;
    return;
  }
  const mal = hendelse.target;
  if (!(mal instanceof Element)) return;
  const tallEl = mal.closest("[data-tall]");
  if (tallEl instanceof HTMLElement && tallEl.closest("[data-ur]") && tallEl.dataset.tall) {
    const tall = Number(tallEl.dataset.tall);
    const base = tall === 12 ? 0 : tall;
    pekerTid = klokke(base + (timer(pekerTid) >= 12 ? 12 : 0), minutt(pekerTid));
    tegn();
    return;
  }
  const stedEl = mal.closest("[data-sted]");
  if (stedEl instanceof Element && skjerm === "verden" && !aktivOppgave(lagret) && lagret.aktivDag) {
    const id = stedEl.getAttribute("data-sted") ?? "";
    if (id.startsWith("tomt:")) {
      const [xs, ys] = id.slice(5).split(",");
      const valg = anbefalt(lagret);
      const x = Number(xs);
      const y = Number(ys);
      if (valg.slag === "bygg") startGange({ sted: "byggeplass", x, y, tomt: { x, y, bygg: valg.bygg } });
      return;
    }
    if (id.startsWith("bygg:")) {
      const instans = id.slice("bygg:".length);
      const bygg = lagret.by.bygg.find((rad) => rad.instans === instans);
      if (!bygg) return;
      if (bygg.ferdig) return;
      startGange({ sted: "byggeplass", x: bygg.x, y: bygg.y, instans });
      return;
    }
    if (id === "taarn") {
      urRunde = iMorgenTider();
      urStegNr = 0;
      pekerTid = snapTilSteg((lagret.aktivDag?.tid ?? 12 * 60) + minuttSteg());
      if (urRunde[0] !== undefined && sammeUrskive(pekerTid, urRunde[0])) pekerTid = snapTilSteg(pekerTid + minuttSteg());
      skjerm = "ur";
      tegn();
      return;
    }
    if (id === "pynt") {
      skjerm = "pynt";
      tegn();
      return;
    }
    if (id === "hjemme" || id === "butikk" || id === "torg" || id === "tannlege" || id === "svommehall" || id === "aktivitet" || id === "barnehage") {
      const celle = celleFor(lagret, id);
      startGange({ sted: id, x: celle.x, y: celle.y });
    }
    return;
  }
  const knapp = mal.closest("button");
  if (!knapp) return;
  if (knapp.dataset.hint) {
    const dag = lagret.aktivDag;
    const oppgave = aktivOppgave(lagret);
    if (dag && oppgave?.hint) {
      const vist = Math.min((oppgave.hintVist ?? 1) + 1, oppgave.hint.length);
      const tekst = oppgave.hint[vist - 1] ?? oppgave.prompt;
      const ko = dag.ko.map((rad, indeks) => (indeks === dag.aktiv ? { ...rad, hintVist: vist, prompt: tekst } : rad));
      lagret = { ...lagret, aktivDag: { ...dag, ko } };
      lagre();
      tegn();
    }
    return;
  }
  if (knapp.dataset.kveld === "avtaler") {
    kveldApne = !kveldApne;
    tegn();
    return;
  }
  if (knapp.dataset.kveld !== undefined) {
    kveldOrden = [...kveldOrden, Number(knapp.dataset.kveld)];
    tegn();
    return;
  }
  if (Date.now() - svarLase < 600 && (knapp.dataset.svar !== undefined || knapp.dataset.handling === "fortsett")) return;
  const svar = knapp.dataset.svar;
  const ga = knapp.dataset.ga;
  const handling = knapp.dataset.handling;
  const til = knapp.dataset.skjerm as Skjerm | undefined;
  if (knapp.dataset.time) settPeker(Number(knapp.dataset.time), 0, false);
  if (knapp.dataset.minutt) settPeker(0, Number(knapp.dataset.minutt), false);
  if (knapp.dataset.dogn) settPeker(0, 0, true);
  if (knapp.dataset.tom) {
    document.querySelector<HTMLCanvasElement>("#lerret")?.getContext("2d")?.clearRect(0, 0, 240, 240);
    return;
  }
  if (knapp.dataset.plan === "lukk") {
    visPlan = false;
    tegn();
  }
  if (knapp.dataset.plan === "apne") {
    visPlan = true;
    tegn();
  }
  if (knapp.dataset.klokke) {
    visUr = !visUr;
    tegn();
  }
  if (knapp.dataset.intro === "se") {
    introSide = 0;
    skjerm = "intro";
    tegn();
    return;
  }
  if (knapp.dataset.intro === "neste" && introSide < 4) {
    introSide += 1;
    tegn();
    return;
  }
  if (knapp.dataset.intro) {
    lagret = { ...lagret, startet: true };
    lagre();
    introSide = 0;
    skjerm = "meny";
    tegn();
    return;
  }
  if (knapp.dataset.demo) {
    lagret = { ...lagret, demoSett: [...lagret.demoSett, knapp.dataset.demo] };
    lagre();
    tegn();
  }
  if (knapp.dataset.figur) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, figur: Number(knapp.dataset.figur) as 0 | 1 | 2 | 3 } };
    lagre();
    tegn();
  }
  if (knapp.dataset.dyr === "hund" || knapp.dataset.dyr === "katt" || knapp.dataset.dyr === "kanin") {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, kjaeledyr: knapp.dataset.dyr } };
    lagre();
    tegn();
  }
  if (knapp.dataset.start) {
    lagret = { ...lagret, startet: true };
    lagre();
    skjerm = "meny";
    tegn();
  }
  if (til) {
    bekreftAvslutt = false;
    skjerm = til === "verden" && !lagret.aktivDag ? "meny" : til;
    tegn();
  }
  if (knapp.dataset.ute) {
    if (lagret.aktivDag) {
      lagret = { ...lagret, aktivDag: { ...lagret.aktivDag, fase: "ute", ko: [], forklaring: null, feil: 0 } };
      lagre();
    }
    tegn();
    return;
  }
  if (knapp.dataset.tomtGa && lagret.aktivDag) {
    const valg = anbefalt(lagret);
    if (valg.slag === "bygg") {
      const tomt = ledigeTomter(lagret.by, valg.bygg)[0];
      if (tomt) startGange({ sted: "byggeplass", x: tomt.x, y: tomt.y, tomt: { x: tomt.x, y: tomt.y, bygg: valg.bygg } });
    }
    return;
  }
  if (ga === "hjemme" || ga === "butikk" || ga === "torg" || ga === "byggeplass" || ga === "aktivitet" || ga === "tannlege" || ga === "svommehall" || ga === "barnehage") {
    const maal = celleFor(lagret, ga);
    startGange({ sted: ga, x: maal.x, y: maal.y });
  }
  if (handling === "start") {
    if (
      lagret.dagbok.length === 0 &&
      lagret.dato.aar === 2026 &&
      lagret.dato.maned === 8 &&
      lagret.dato.dag === 17 &&
      lagret.fro <= 1
    ) {
      lagret = { ...lagret, dato: tilfeldigStart(), fro: 1 + Math.floor(Math.random() * 900) };
    }
    gjor({ slag: "start" });
  }
  if (handling === "start-ettermiddag") {
    skjerm = "verden";
    tegn();
  }
  if (handling === "spor-ny-by") {
    if (!voksenInne) {
      skjerm = "voksen";
      tegn();
      return;
    }
    bekreftNyBy = true;
    tegn();
    return;
  }
  if (handling === "ny-by") {
    if (!voksenInne) {
      skjerm = "voksen";
      tegn();
      return;
    }
    const tom = standardLagret();
    lagret = { ...tom, innstillinger: lagret.innstillinger, fro: 1 + Math.floor(Math.random() * 900), dato: tilfeldigStart() };
    bekreftNyBy = false;
    skjerm = "meny";
    lagre();
    tegn();
    return;
  }
  if (handling === "fortsett-dag") {
    skjerm = "verden";
    tegn();
  }
  if (handling === "spor-avslutt") {
    bekreftAvslutt = true;
    tegn();
    return;
  }
  if (handling === "vent") {
    bekreftAvslutt = false;
    gjor({ slag: "vent", tid: knapp.dataset.tid ? Number(knapp.dataset.tid) : undefined });
  }
  if (handling === "klokke") {
    urRunde = iMorgenTider();
    urStegNr = 0;
    pekerTid = snapTilSteg(lagret.aktivDag?.tid ?? 12 * 60);
    if (urRunde[0] !== undefined && sammeUrskive(pekerTid, urRunde[0])) pekerTid = snapTilSteg(pekerTid + minuttSteg());
    skjerm = "ur";
    gjor({ slag: "klokke" });
    return;
  }
  if (handling === "ur-ferdig") {
    const maal = urRunde[urStegNr];
    const dagTid = lagret.aktivDag?.tid;
    if (maal !== undefined && sammeUrskive(pekerTid, maal)) {
      lagret = { ...lagret, mynter: lagret.mynter + 1 };
      urStegNr += 1;
      melding = si(spraak(), "Riktig!", "Riktig!");
      if (urStegNr >= urRunde.length) skjerm = "verden";
    } else {
      melding = si(spraak(), "Prøv igjen.", "Prøv igjen.");
    }
    if (lagret.aktivDag && dagTid !== undefined) lagret = { ...lagret, aktivDag: { ...lagret.aktivDag, tid: dagTid } };
    lagre();
    tegn();
    return;
  }
  if (handling === "dor") {
    skjerm = "verden";
    gjor({ slag: "dor" });
  }
  if (handling === "ekstra-ja" || handling === "ekstra-nei") {
    gjor({ slag: "ekstra", ja: handling === "ekstra-ja" });
    return;
  }
  if (handling === "handle" || handling === "fortsett" || handling === "steg" || handling === "angre" || handling === "mot" || handling === "spis" || handling === "avslutt" || handling === "oppdrag") {
    bekreftAvslutt = false;
    gjor({ slag: handling });
  }
  if (svar !== undefined && handling !== "fortsett") gjor({ slag: "svar", svar });
  if (knapp.dataset.vare && aktivOppgave(lagret)?.type === "finn-formen") {
    if (valgte.has(knapp.dataset.vare)) valgte.delete(knapp.dataset.vare);
    else valgte.add(knapp.dataset.vare);
    tegn();
  }
  if (knapp.dataset.vare && aktivOppgave(lagret)?.type === "sorter") valgtVare = knapp.dataset.vare;
  if (knapp.dataset.kasse && valgtVare) {
    sorter[valgtVare] = knapp.dataset.kasse;
    valgtVare = "";
    tegn();
  }
  if (knapp.dataset.tegn) {
    const lerret = document.querySelector<HTMLCanvasElement>("#lerret");
    const ctx = lerret?.getContext("2d");
    if (lerret && ctx && erForm2d(knapp.dataset.tegn)) {
      const data = ctx.getImageData(0, 0, lerret.width, lerret.height);
      const strek = rasterFraAlpha(data.data, lerret.width, lerret.height);
      const omriss = omrissForForm(knapp.dataset.tegn, lerret.width, lerret.height);
      gjor({ slag: "svar", svar: vurderTegning(strek, omriss) ? "ok" : "nei" });
    }
  }
  if (knapp.dataset.bygg) {
    valgtBygg = knapp.dataset.bygg as ByggId;
    tegn();
  }
  if (knapp.dataset.tomt && valgtBygg) {
    const [x, y] = knapp.dataset.tomt.split(",").map(Number);
    const antall = lagret.by.bygg.length;
    gjor({ slag: "velg-bygg", bygg: valgtBygg, x: x ?? 0, y: y ?? 0 });
    if (lagret.by.bygg.length > antall) {
      skjerm = "bygg";
      tegn();
    }
  }
  if (knapp.dataset.apne && lagret.aktivDag) {
    lagret = { ...lagret, aktivDag: { ...lagret.aktivDag, valgtInstans: knapp.dataset.apne, sted: "byggeplass" } };
    skjerm = "bygg";
    lagre();
    tegn();
  }
  if (knapp.dataset.pynt && skjerm === "pynt") {
    valgtPynt = knapp.dataset.pynt as VareId;
    tegn();
    return;
  }
  if (knapp.dataset.pynt) gjor({ slag: "pynt", vare: knapp.dataset.pynt as VareId, instans: knapp.dataset.instans });
  if (knapp.dataset.rute && valgtPynt) {
    const [x, y] = knapp.dataset.rute.split(",").map(Number);
    gjor({ slag: "pynt", vare: valgtPynt, x, y });
    valgtPynt = "";
  }
  if (knapp.dataset.kart === "roter") {
    const rotasjon = ((lagret.by.rotasjon + 1) % 4) as 0 | 1 | 2 | 3;
    lagret = { ...lagret, by: { ...lagret.by, rotasjon } };
    lagre();
    tegn();
  }
  if (knapp.dataset.kart === "inn" || knapp.dataset.kart === "ut") {
    const skala = Math.min(2.4, Math.max(0.6, lagret.by.skala + (knapp.dataset.kart === "inn" ? 0.2 : -0.2)));
    lagret = { ...lagret, by: { ...lagret.by, skala } };
    lagre();
    tegn();
  }
  if (knapp.dataset.kart === "venstre" || knapp.dataset.kart === "hoyre" || knapp.dataset.kart === "opp" || knapp.dataset.kart === "ned") {
    const dx = knapp.dataset.kart === "venstre" ? 40 : knapp.dataset.kart === "hoyre" ? -40 : 0;
    const dy = knapp.dataset.kart === "opp" ? 40 : knapp.dataset.kart === "ned" ? -40 : 0;
    lagret = { ...lagret, by: { ...lagret.by, panX: lagret.by.panX + dx, panY: lagret.by.panY + dy } };
    lagre();
    tegn();
  }
  if (knapp.dataset.fane === "figur" || knapp.dataset.fane === "nivaa" || knapp.dataset.fane === "sprak" || knapp.dataset.fane === "voksen") {
    innFane = knapp.dataset.fane;
    tegn();
    return;
  }
  if (knapp.dataset.nivaa && erNivaa(knapp.dataset.nivaa)) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, nivaa: knapp.dataset.nivaa } };
    lagre();
    tegn();
  }
  if (knapp.dataset.spraak && erSpraak(knapp.dataset.spraak)) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, spraak: knapp.dataset.spraak } };
    document.documentElement.lang = knapp.dataset.spraak;
    lagre();
    tegn();
  }
  if (knapp.dataset.lyd) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, lydPa: !lagret.innstillinger.lydPa } };
    lagre();
    tegn();
  }
  if (knapp.dataset.digital) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, skjulDigital: !lagret.innstillinger.skjulDigital } };
    lagre();
    tegn();
  }
  if (knapp.dataset.tidsrom) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, tidsromPa: !lagret.innstillinger.tidsromPa } };
    lagre();
    tegn();
  }
  if (knapp.dataset.rekord) {
    lagret = { ...lagret, innstillinger: { ...lagret.innstillinger, rekordlistePa: !lagret.innstillinger.rekordlistePa } };
    lagre();
    tegn();
  }
  if (knapp.dataset.fast) {
    const aktivitet = document.querySelector<HTMLSelectElement>("#fast-aktivitet")?.value ?? "hund";
    const valgtDag = document.querySelector<HTMLSelectElement>("#fast-dag")?.value ?? "tirsdag";
    const ukedag = erUkedag(valgtDag) ? valgtDag : "tirsdag";
    lagret = {
      ...lagret,
      innstillinger: { ...lagret.innstillinger, fasteAvtaler: [...lagret.innstillinger.fasteAvtaler, { aktivitet, ukedag, start: Number(document.querySelector<HTMLSelectElement>("#fast-tid")?.value ?? 18 * 60) }] },
    };
    lagre();
    tegn();
  }
  if (knapp.dataset.fjern) {
    const indeks = Number(knapp.dataset.fjern);
    lagret = {
      ...lagret,
      innstillinger: { ...lagret.innstillinger, fasteAvtaler: lagret.innstillinger.fasteAvtaler.filter((_, i) => i !== indeks) },
    };
    lagre();
    tegn();
  }
  if (knapp.dataset.eksport) {
    const blob = new Blob([JSON.stringify(lagret)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formbyen-by.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (knapp.dataset.fane === "mestring" || knapp.dataset.fane === "avtaler" || knapp.dataset.fane === "data" || knapp.dataset.fane === "om") {
    voksenFane = knapp.dataset.fane;
    voksenStolpe = "";
    tegn();
  }
  if (knapp.dataset.stolpe) {
    voksenStolpe = voksenStolpe === knapp.dataset.stolpe ? "" : knapp.dataset.stolpe;
    tegn();
  }
  if (knapp.dataset.null === "spor") {
    nullSteg = 1;
    tegn();
  }
  if (knapp.dataset.null === "sikker") {
    nullSteg = 2;
    tegn();
  }
  if (knapp.dataset.null === "ja") {
    lagret = standardLagret();
    nullSteg = 0;
    voksenInne = false;
    skjerm = "velg";
    lagre();
    tegn();
  }
  if (knapp.dataset.voksen === "sjekk") {
    const felt = document.querySelector<HTMLInputElement>("#voksen-svar");
    if (Number(felt?.value) === voksen.svar) voksenInne = true;
    else voksen = lagVoksenStykke(lagret.fro + 1);
    tegn();
  }
  if (knapp.dataset.oppdater) {
    void sjekkForOppdatering({
      online: navigator.onLine,
      hentNyVersjon: async () => {
        await oppdaterSW(false);
        return visOppdater;
      },
    }).then((utfall) => {
      statusOppdater = oppdateringTekst(utfall);
      tegn();
    });
  }
  if (knapp.dataset.last) void oppdaterSW(true);
  if (knapp.dataset.del) {
    const foto = lagret.album[Number(knapp.dataset.del)];
    if (foto) void delPng(foto.svg);
  }
});

document.addEventListener("change", (hendelse) => {
  const mal = hendelse.target;
  if (!(mal instanceof HTMLInputElement) || mal.id !== "import-fil" || !mal.files?.[0]) return;
  const fil = mal.files[0];
  void fil.text().then((tekst) => {
    const inn = importer(tekst);
    if (!inn) {
      melding = si(spraak(), "Filen passet ikke.", "Fila passa ikkje.");
      tegn();
      return;
    }
    lagret = inn;
    skjerm = "meny";
    lagre();
    tegn();
  });
});

async function delPng(svg: string): Promise<void> {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const bilde = new Image();
  bilde.src = url;
  await bilde.decode();
  const lerret = document.createElement("canvas");
  lerret.width = 800;
  lerret.height = 600;
  const ctx = lerret.getContext("2d");
  ctx?.drawImage(bilde, 0, 0, 800, 600);
  URL.revokeObjectURL(url);
  const png = lerret.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = png;
  a.download = "formbyen.png";
  a.click();
}

tegn();
