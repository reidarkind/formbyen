import { registerSW } from "virtual:pwa-register";
import { maalBygg, manglendeDeler } from "./bygg/handleliste";
import { byggSomKanStartes, byenErFerdig, ledigePyntPlasser, ledigeTomter, lesRute, nesteByggId, pyntOmrade, pyntOmradeRamme, pyntPlasser, ruteNavn } from "./bygg/kart";
import { PYNT_FORMER, pyntSvg } from "./grafikk/pynt-svg";
import { byggDef } from "./bygg/katalog";
import { boligen, celleFor } from "./bygg/landemerker";
import { tegnBygg, tegnFremdrift, tegnKart } from "./grafikk/bygg-svg";
import { delSvg } from "./grafikk/fasade";
import { byggmester, ikon, kjaeledyr } from "./grafikk/figurer";
import { formSvg } from "./grafikk/former-svg";
import { FARGER, type Farge } from "./grafikk/stil";
import { tallPosisjoner, urskive } from "./grafikk/klokke";
import { ALLE_2D, ALLE_3D, erForm2d, erForm3d, form2d, form3d } from "./former/definisjoner";
import { importer, lesLagring, skrivLagring, standardLagret } from "./lagring/lagring";
import { beVarigLagring } from "./pwa/lagring";
import { oppdateringTekst, sjekkRegistrering, skalSjekkeIgjen } from "./pwa/oppdatering";
import { sporsmalViser, svarViser } from "./oppgaver/visning";
import { anbefalt, gangMinutter, nesteSteg } from "./spill/anbefaling";
import { aktivOppgave, apningTekst, PYNT, PYNT_PRIS, utfor, type Handling } from "./spill/okt";
import { urRunde, type UrSteg } from "./spill/taarnur";
import { FERDIGHET_NAVN, ferdighetStatus, OMRADER, oversiktLinjer, type Status } from "./tilpasning/oversikt";
import { omrissForForm } from "./tegning/omriss";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { visNavn } from "./dag/aktiviteter";
import { ukedagFor } from "./dag/plan";
import { byggBestemt as byggBestemtOrd, formMedArtikkel, fraNb, formNavn, mal, navnBygg, navnVare, smaForbokstav, storForbokstav, vareAntall, vareBestemt } from "./tekst/ordbok";
import { manedTekst, si, SPRAAK_NAVN, ukedagTekst } from "./tekst/spraak";
import { himmel, leggTil, tidTilDigital24, tidTilOrd, minutt, timer, klokke } from "./tid/tid";
import { erSpraak, SPRAAK, type ByggId, type Ferdighet, type Lagret, type Nivaa, type NokkelLager, type Oppgave, type SkiltTid, type Spraak, type StedId, type Ukedag, type VareId } from "./typer";
import { lagVoksenStykke } from "./voksen";
import { klikk } from "./lyd/lyd";
import { bindDra } from "./felles/dra";
import { draMinutt, gripViser, settMedVinkel, vinkelFra, vinkelSteg, type Viser } from "./felles/urInput";
import "./style.css";

const lager: NokkelLager = {
  getItem: (nokkel) => localStorage.getItem(nokkel),
  setItem: (nokkel, verdi) => localStorage.setItem(nokkel, verdi),
  removeItem: (nokkel) => localStorage.removeItem(nokkel),
};

type Skjerm = "intro" | "velg" | "meny" | "pause" | "dagstart" | "verden" | "kart" | "bygg" | "pynt" | "pynt-kart" | "kveld" | "innstillinger" | "voksen" | "dagbok" | "album" | "ur" | "kurv";
type VoksenFane = "oversikt" | "detalj" | "nivaa" | "avtaler" | "data" | "om";

const VERSJON = "1.2.0";
/** Commit og dato for bygget, så det går an å se hvilken versjon som kjører (gj. 10, C3). */
const BYGG = [String(import.meta.env.VITE_BYGG ?? "").slice(0, 7), typeof __BYGG__ === "string" ? __BYGG__ : ""].filter(Boolean).join(" ") || "utvikling";
/** Låsen til voksensiden lukkes etter fem minutter uten aktivitet (gj. 9, B4). */
const VOKSEN_TIDSAVBRUDD = 5 * 60 * 1000;

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
/** Viseren barnet styrer på klokker som kan stilles (gj. 10, C1). */
let urViser: Viser = "time";
let urSteg: UrSteg[] = [];
let urStegNr = 0;
let urMelding: { riktig: boolean; tekst: string } | null = null;
let urTimer = 0;
let valgte = new Set<string>();
let sorter: Record<string, string> = {};
let ristVarer = new Set<string>();
let sorterHake = false;
let valgtVare = "";
let valgtBygg: ByggId | null = null;
let voksen = lagVoksenStykke(lagret.fro);
let voksenInne = false;
let voksenFelt = "";
let voksenFeil = false;
let voksenSist = 0;
let voksenFra: Skjerm = "innstillinger";
let visOppdater = false;
let statusOppdater = "";
let nullSteg = 0;
let voksenFane: VoksenFane | "" = "oversikt";
let importForslag: Lagret | null = null;
let importMelding = "";
let bekreftAvslutt = false;
let kveldOrden: number[] = [];
let kveldPanel: "kart" | "avtaler" | "rekkefolge" = "kart";
const rotEl = document.querySelector("#app");
if (!(rotEl instanceof HTMLElement)) throw new Error("mangler app");
const rot: HTMLElement = rotEl;

/** Registreringen tas vare på, så knappen og den automatiske sjekken kan spørre serveren (gj. 10, C3). */
let swReg: ServiceWorkerRegistration | undefined;
let sistSjekket = Date.now();
const oppdaterSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    visOppdater = true;
    tegn();
  },
  onRegisteredSW(_url: string, reg: ServiceWorkerRegistration | undefined) {
    swReg = reg;
  },
});

function sjekkIStillhet(): void {
  if (!swReg || !navigator.onLine) return;
  sistSjekket = Date.now();
  void swReg.update().catch(() => undefined);
}
// Nettleseren sjekker selv bare ved kald start. Vi sjekker når appen blir synlig igjen (høyst hvert kvarter) og hver time.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && skalSjekkeIgjen(sistSjekket, Date.now())) sjekkIStillhet();
});
window.setInterval(sjekkIStillhet, 60 * 60_000);

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


function erNivaa(verdi: string): verdi is Nivaa {
  return NIVA.includes(verdi as Nivaa);
}

function erUkedag(verdi: string): verdi is Ukedag {
  return UKEDAGER.includes(verdi as Ukedag);
}

type UrVis = "full" | "analog" | "ord" | "digital" | "hud";

function urIndre(tid: number, lite = false, vis: UrVis = "full", storrelse = lite ? 36 : 160, aktiv?: Viser): string {
  const tall =
    storrelse >= 96
      ? tallPosisjoner(120, 120, 108)
          .map((pos) => `<span class="tall" data-tall="${pos.tall}" style="left:${(pos.x / 240) * 100}%;top:${(pos.y / 240) * 100}%">${pos.tall}</span>`)
          .join("")
      : "";
  const analog = `<div class="skive">${urskive(tid, aktiv)}<div class="tall-lag">${tall}</div></div>`;
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
  return `<div class="ur ur-${str} ${lite ? "lite" : ""}" ${justerbar ? `data-ur data-tid="${tid}"` : ""}>${urIndre(tid, lite, vis, str, justerbar ? urViser : undefined)}</div>`;
}

function skrivPeker(): void {
  const boks = document.querySelector("[data-ur]");
  if (boks instanceof HTMLElement) boks.dataset.tid = String(pekerTid);
  if (boks) boks.innerHTML = urIndre(pekerTid, boks.classList.contains("lite"), "analog", boks.classList.contains("ur-200") ? 200 : 160, urViser);
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
  if (ny && ny.id !== forrigeOppgave && ny.maalKlokke !== undefined) {
    pekerTid = 12 * 60;
    urViser = "time";
  }
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
    kveldPanel = "kart";
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
  // Skiltet til venstre med åpningstidene som tekst, den store «Nå»-klokka til høyre (gj. 9, 6.13).
  return `<div class="dorskilt"><div class="skilt-tider"><p class="skilt-tittel">${si(spraak(), "Åpningstider", "Opningstider")}</p>${tider || "–"}</div><div class="skilt-naa"><p class="ord">${si(spraak(), "Nå", "No")}</p>${urHtml(skilt.naa, false, false, "analog", 120)}</div></div>`;
}

function oppgaveBilde(oppgave: Oppgave): string {
  if (oppgave.id.startsWith("dor-")) return "";
  if (oppgave.type === "still-klokka" && oppgave.maalKlokke !== undefined) {
    const vis = sporsmalViser(oppgave);
    const maal = vis === "digital" ? tidTilDigital24(oppgave.maalKlokke) : tidTilOrd(oppgave.maalKlokke, spraak());
    return `<p class="klokkemal">${esc(maal)}</p>${urHtml(pekerTid, false, true, "analog", 160)}
      ${viserKnapper()}`;
  }
  if (oppgave.type === "hvem-passer-ikke") return "";
  if (oppgave.planke) return plankeBilde(oppgave.planke);
  if (oppgave.vekt) return vektBilde(oppgave.vekt);
  if (oppgave.type === "areal") return "";
  if (oppgave.koordinat) return koordinatBilde(oppgave.koordinat);
  if (oppgave.type === "ukeplan" || oppgave.type === "kalender") return oppgave.ukeMerke ? ukeBilde(oppgave.ukeMerke, oppgave.type === "kalender") : "";
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
    return `<div class="valg figurgrid${oppgave.kasser ? " sorter" : ""}">${oppgave.varer
      .filter((vare) => !sorter[vare.id])
      .map((vare) => {
        const merket = valgte.has(vare.id);
        const loftet = valgtVare === vare.id ? " loftet" : "";
        const rist = ristVarer.has(vare.id) ? " rist" : "";
        const storrelse = Math.round(((vare.stor ?? 72) / 72) * 56);
        return `<button type="button" data-vare="${esc(vare.id)}" class="${merket ? "valgt" : ""}${loftet}${rist}" aria-pressed="${merket || valgtVare === vare.id ? "true" : "false"}">${formSvg(vare.form, storrelse, -Math.PI / 2, fargeFor(vare.id + vare.form))}</button>`;
      })
      .join("")}${oppgave.kasser && oppgave.varer.every((vare) => sorter[vare.id]) ? `<p class="tomt">${si(spraak(), "Alle formene ligger i kassene.", "Alle formene ligg i kassane.")}</p>` : ""}</div>`;
  }
  if (oppgave.type === "tegn" && oppgave.form) {
    return `<div class="tegn-flate"><div class="lerret-boks"><canvas id="spokelse" width="240" height="240"></canvas><canvas id="lerret" width="240" height="240"></canvas><span class="tegnemodell" aria-hidden="true">${formSvg(oppgave.form, 40)}</span></div></div>`;
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
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "still-klokka") {
    const vis = sporsmalViser(oppgave);
    if (vis === "digital") return `<p class="digital stor-digital">${tidTilDigital24(oppgave.maalKlokke)}</p>`;
    return urHtml(oppgave.maalKlokke, false, false, vis === "full" ? "analog" : vis);
  }
  // Gåten ved kassa viser formens skygge, ikke formen (gj. 10, C2).
  if (oppgave.skygge) return `<div class="skygge-form" aria-hidden="true">${formSvg(oppgave.skygge, 120)}</div>`;
  if (oppgave.form3d) {
    const ligg = lagret.innstillinger.nivaa === "utfordrende" && (oppgave.form3d === "sylinder" || oppgave.form3d === "kjegle") ? 0 : -Math.PI / 2;
    return formSvg(oppgave.form3d, 120, ligg);
  }
  if (oppgave.form) return formSvg(oppgave.form, 120);
  return ikon(ikonFor(oppgave.type));
}

/** Planken i klosser. Når svaret er i centimeter, ligger en linjal under med tall for hver tiende centimeter. */
function plankeBilde(planke: { klosser: number; cm: boolean }): string {
  const enhet = 40;
  const bredde = (planke.klosser + (planke.cm ? 1 : 0)) * enhet + 16;
  const deler = planke.cm
    ? `<rect x="8" y="6" width="${planke.klosser * enhet}" height="22" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`
    : Array.from({ length: planke.klosser }, (_, i) => `<rect x="${8 + i * enhet}" y="6" width="${enhet}" height="22" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`).join("");
  const linjal = planke.cm
    ? `<rect x="8" y="34" width="${(planke.klosser + 1) * enhet}" height="16" fill="${FARGER.aksentGul}" stroke="${FARGER.kontur}" stroke-width="2"/>${Array.from({ length: planke.klosser + 2 }, (_, i) => `<line x1="${8 + i * enhet}" y1="34" x2="${8 + i * enhet}" y2="46" stroke="${FARGER.kontur}" stroke-width="2"/>`).join("")}`
    : "";
  const hoyde = planke.cm ? 54 : 34;
  const tall = planke.cm
    ? `<div class="linjal-tall" style="width:${bredde}px">${Array.from({ length: planke.klosser + 2 }, (_, i) => `<span style="left:${8 + i * enhet}px">${i * 10}</span>`).join("")}</div>`
    : "";
  return `<div class="maling-bilde"><svg viewBox="0 0 ${bredde} ${hoyde}" width="${bredde}" height="${hoyde}">${deler}${linjal}</svg>${tall}</div>`;
}

/** Skålvekt i likevekt: sekken til venstre, lodd til høyre. Tallene står som HTML under (gj. 9, oppfølging). */
function vektBilde(vekt: { sekkKg?: number; lodd: number; loddKg: number }): string {
  const b = 220;
  const loddStor = 18;
  const perRad = 4;
  const lodd = Array.from({ length: vekt.lodd }, (_, i) => {
    const x = 140 + (i % perRad) * (loddStor + 2);
    const y = 58 - Math.floor(i / perRad) * (loddStor + 2) - loddStor;
    return `<rect x="${x}" y="${y}" width="${loddStor}" height="${loddStor}" rx="3" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  }).join("");
  const svg = `<svg viewBox="0 0 ${b} 100" width="${b}" height="100">
    <rect x="106" y="20" width="8" height="70" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="80" y="88" width="60" height="8" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="20" y="16" width="180" height="6" fill="${FARGER.kontur}"/>
    <line x1="40" y1="22" x2="40" y2="58" stroke="${FARGER.kontur}" stroke-width="2"/>
    <line x1="180" y1="22" x2="180" y2="58" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="10" y="58" width="62" height="6" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <rect x="134" y="58" width="${perRad * (loddStor + 2) + 8}" height="6" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>
    <ellipse cx="41" cy="44" rx="22" ry="14" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>
    ${lodd}
  </svg>`;
  const sekk = vekt.sekkKg !== undefined ? `${vekt.sekkKg} kg` : "? kg";
  const hoyre = mal(spraak(), "Hvert lodd: {kg} kg", "Kvart lodd: {kg} kg", { kg: String(vekt.loddKg) });
  return `<div class="maling-bilde vekt"><div>${svg}</div><div class="vekt-merker"><span>${esc(sekk)}</span><span>${esc(hoyre)}</span></div></div>`;
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

/** Ukeplanen med dagen merket. I kalenderoppgaven er merket «i dag». */
function ukeBilde(merke: string, heleUka: boolean): string {
  const dager: Ukedag[] = heleUka ? UKEDAGER : ["mandag", "tirsdag", "onsdag", "torsdag", "fredag"];
  return `<div class="ukeplan">${dager
    .map((dag) => {
      const merket = dag === merke;
      const navn = ukedagTekst(spraak(), dag).slice(0, 2);
      const tegn = merket ? (heleUka ? `<small>${si(spraak(), "i dag", "i dag")}</small>` : `<small aria-hidden="true">★</small>`) : "";
      return `<span class="${merket ? "merket" : ""}">${esc(navn)}${tegn}</span>`;
    })
    .join("")}</div>`;
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

/** Kassene står i bunnsonen ved siden av «Ferdig», så de aldri havner utenfor skjermen (gj. 9, B1). */
function kasserHtml(oppgave: Oppgave): string {
  return `<div class="kasser">${(oppgave.kasser ?? [])
    .map((kasse) => {
      const inni = (oppgave.varer ?? []).filter((vare) => sorter[vare.id] === kasse.id);
      const figurer = inni.map((vare) => formSvg(vare.form, 24, -Math.PI / 2, fargeFor(vare.id + vare.form))).join("");
      const symbol = kasse.symbol ? formSvg(kasse.symbol, 24) : "";
      const hake = sorterHake && inni.length > 0 ? `<span class="hake">✓</span>` : "";
      const lys = valgtVare ? " lyser" : "";
      return `<button type="button" class="kasse${lys}" data-kasse="${esc(kasse.id)}"><span class="lokk">${symbol}<span>${esc(kasse.tekst)}</span></span><span class="inni">${figurer}${hake}</span></button>`;
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
    const kandidat = videre ? (oppgave.type === "monster" ? oppgave.fasit : oppgave.form ?? rett?.form) : undefined;
    // Bare ekte former tegnes. Vekt og planke bruker feltet til tall.
    const fasitForm = kandidat && (erForm2d(kandidat) || erForm3d(kandidat)) ? kandidat : undefined;
    const svarTekst = videre && rett?.tekst && oppgave.type !== "tell" ? `<p class="valgt-svar">${esc(rett.tekst)}</p>` : "";
    return `<article class="kort oppgave feil">${prikker}<p class="forklaring">${esc(forklaring)}</p><div class="fasit">${klokke}${kasser}${svarTekst}${fasitForm ? formSvg(fasitForm, 80) : ""}</div></article>`;
  }
  const skilt = oppgave.skilt && oppgave.id.startsWith("dor-") ? skiltHtml(oppgave.skilt) : "";
  const ut = dag && dag.ko.length > 1 && dag.fase === "handel" && !oppgave.id.startsWith("dor-") ? `<button type="button" class="liten" data-ute="1">${si(spraak(), "Gå ut", "Gå ut")}</button>` : "";
  const topp = oppgave.kontekst
    ? `<p class="kontekst">${delSvg(oppgave.vare, 24)}<span>${esc(oppgave.kontekst)}</span></p>`
    : `<p class="hvem">${ikon(ikonFor(oppgave.type), "ikon-s")}<span>${esc(oppgave.hvem)}</span></p>`;
  const malform = oppgave.type === "finn-formen" && oppgave.form ? `<span class="malform">${formSvg(oppgave.form, 44)}</span>` : "";
  const fargeHjelp = oppgave.type === "finn-formen" ? si(spraak(), "Fargen betyr ikke noe. Se på formen.", "Fargen betyr ikkje noko. Sjå på forma.") : "";
  const hjelp = [oppgave.hjelp, fargeHjelp].filter(Boolean).map((linje) => `<p class="hjelp">${esc(linje ?? "")}</p>`).join("");
  return `<article class="kort oppgave oppgave-${oppgave.type}" aria-label="${esc(oppgave.prompt)}">
    <div class="oppgave-topp">${topp}${prikker}${ut}</div>
    ${skilt}
    <div class="prompt-rad">${malform}<h2>${esc(oppgave.prompt)}</h2></div>
    ${oppgave.hint && (oppgave.hintVist ?? 1) < oppgave.hint.length ? `<button type="button" class="liten" data-hint="1">${si(spraak(), "Neste hint", "Neste hint")}</button>` : ""}
    ${oppgaveBilde(oppgave)}
    ${hjelp}
    ${valgHtml(oppgave)}
  </article>`;
}

function oppdragMerke(): string {
  const dag = lagret.aktivDag;
  if (!dag || dag.oppdragFerdig || dag.ko.length > 0 || dag.forklaring) return "";
  const frist = dag.plan.avtaler.find((avtale) => avtale.start > dag.tid && avtale.varighet > 0)?.start ?? dag.plan.leggetid;
  // Første gang forklarer hjelperen hva stjerna betyr (gj. 9, 6.11).
  const forklart = lagret.dagbok.some((inn) => inn.oppdrag);
  const tekst = mal(spraak(), "Naboen trenger hjelp før kl. {tid}. Du får 2 mynter.", "Naboen treng hjelp før kl. {tid}. Du får 2 myntar.", { tid: tidTilDigital24(frist) });
  return `<button type="button" class="oppdrag-merke" data-handling="oppdrag" aria-label="${esc(tekst)}"><span class="oppdrag-ikon" aria-hidden="true">★</span><span>${forklart ? `${tidTilDigital24(frist)} · +2` : esc(tekst)}</span></button>`;
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
  const laast = aktivOppgave(lagret) !== null;
  return `<button type="button" class="stripe" data-plan="${visPlan ? "lukk" : "apne"}" ${laast ? "disabled" : ""} aria-label="${si(spraak(), "Dagens plan", "Dagens plan")}">${punkter
    .map((punkt) => {
      const klasse = punkt === naa ? "punkt naa" : punkt.tid < dag.tid ? "punkt" : "punkt kommende";
      return `<span class="${klasse}">${ikon(ikonNavn(punkt.navn), "ikon-s")}<span class="tid">${tidTilDigital24(punkt.tid)}</span></span>`;
    })
    .join("")}</button>`;
}

function planHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  return `<div class="planliste"><h2>${si(spraak(), "Dagens plan", "Dagens plan")}</h2>${planPunkter()
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
  return `<div class="bykart kartboks">${tegnKart(lagret.by, tid, dag?.plan.leggetid ?? 20 * 60, {
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
  const tilbake = "";
  if (dag.sted === "butikk") {
    const rader = handlelisteRader();
    const apning = dag.dorLest ? `<p>${esc(apningTekst(lagret))}</p>` : "";
    return `${tilbake}<section class="scene"><h1>${si(spraak(), "Butikken", "Butikken")}</h1>${apning}<div class="hyller">${rader
      .map((rad) => `<div class="kurv-rad${rad.har ? " har" : ""}">${delBilde(rad.vare)}<p>${rad.har ? "✓ " : ""}${esc(navnVare(rad.vare, spraak()))}</p></div>`)
      .join("")}</div><div class="ekspeditor">${byggmester(1)}</div></section>`;
  }
  if (dag.sted === "hjemme") {
    const spiser = nesteSteg(lagret).handling.slag === "spis";
    const hjem = boligen(lagret.by);
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
  if (oppgave && dag?.forklaring) {
    // Forklaringskortets knapp står alltid fast i bunnsonen (gj. 9, B1).
    const videre = (dag.feil ?? 0) >= 2;
    return `<button type="button" class="hoved" data-handling="fortsett">${videre ? si(spraak(), "Fortsett", "Hald fram") : si(spraak(), "Prøv igjen", "Prøv igjen")}</button>`;
  }
  if (oppgave) {
    if (oppgave.type === "still-klokka") return `<button type="button" class="hoved" data-svar="${pekerTid}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    if (oppgave.type === "sorter") {
      const antall = oppgave.varer?.length ?? 0;
      const ferdig = Object.keys(sorter).length >= antall && antall > 0;
      const tekst = Object.entries(sorter)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([vare, kasse]) => `${vare}:${kasse}`)
        .join(",");
      return `<div class="sorter-bunn">${kasserHtml(oppgave)}<button type="button" class="hoved" ${ferdig ? `data-svar="${tekst}"` : "disabled"}>${si(spraak(), "Ferdig", "Ferdig")}</button></div>`;
    }
    if (oppgave.type === "finn-formen") {
      return `<button type="button" class="hoved" data-svar="${[...valgte].sort().join(",")}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    }
    if (oppgave.type === "tegn" && oppgave.form) {
      return `<button type="button" data-tom="1">${si(spraak(), "Tøm", "Tøm")}</button><button type="button" class="hoved" data-tegn="${esc(oppgave.form)}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
    }
    return "";
  }
  if (visPlan) return `<button type="button" class="hoved" data-plan="lukk">${si(spraak(), "Lukk", "Lukk")}</button>`;
  if (!dag) return "";
  const steg = nesteSteg(lagret);
  const viserScene = !gar && dag.fase !== "ute";
  const tilBy = viserScene ? `<button type="button" data-ute="1">${si(spraak(), "← Byen", "← Byen")}</button>` : "";
  if (steg.nei) {
    return `${tilBy}<button type="button" data-handling="ekstra-nei">${esc(steg.nei)}</button><button type="button" class="hoved" data-handling="ekstra-ja">${esc(steg.knapp)}</button>`;
  }
  return `${tilBy}${hovedKnapp(dag, steg)}`;
}

function hovedKnapp(dag: NonNullable<Lagret["aktivDag"]>, steg: ReturnType<typeof nesteSteg>): string {
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
  if (valg.slag === "ov") return `<button type="button" class="hoved" data-handling="ov">${tekst}</button>`;
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
  const planApen = visPlan && !oppgave;
  const midt = planApen
    ? planHtml()
    : viserOppgave && oppgave
      ? oppgaveHtml(oppgave)
      : riktigKort && reaksjon
        ? `<article class="reaksjon riktig"><p>${esc(reaksjon.tekst)}</p></article>`
        : `${ekstraBilde() || (viserScene ? sceneHtml() : bybilde())}${visUr ? `<div class="stor-klokke">${urHtml(dag.tid, false, false, "full", 120)}</div>` : ""}`;
  const handling = enHandling();
  const bunn = viserOppgave || riktigKort || planApen
    ? `<div class="knapper">${handling}</div>`
    : `${oppdragMerke()}<div class="boble">${kjaeledyr(lagret.innstillinger.kjaeledyr)}<p>${esc(raad())}</p></div><div class="knapper">${handling}</div>`;
  return `<div class="verden${viserOppgave ? " med-oppgave" : ""}"><header class="hud"><button type="button" data-skjerm="pause" aria-label="${si(spraak(), "Pause", "Pause")}">≡</button><button type="button" data-skjerm="kurv" aria-label="${si(spraak(), "Kurven", "Korga")}">${ikon("kurv")}<span>${antall}</span></button><span class="mynt" aria-label="${si(spraak(), "Mynter", "Myntar")}">${lagret.mynter}</span>${klokkeOppgave ? "" : `<button type="button" class="klokke" data-klokke="1" aria-label="${esc(tidTilOrd(dag.tid, spraak()))}">${urHtml(dag.tid, true, false, "hud")}</button>`}</header>
    ${stripeHtml()}
    ${melding && !viserOppgave ? `<p class="banner${melding.includes("flytter") ? " innflytting" : ""}">${melding.includes("flytter") ? byggmester() : ""}${esc(melding)}</p>` : ""}
    <div class="verden-midten">${midt}</div>
    <div class="verden-bunn">${bunn}</div></div>`;
}

function ekstraBilde(): string {
  const valg = anbefalt(lagret);
  if (valg.slag !== "ekstra") return "";
  const id = nesteByggId(lagret.by);
  if (!id) return "";
  return `<div class="silhuett">${tegnBygg(id)}<p>${esc(byggNavn(id))}</p></div>`;
}

/**
 * Én skjerm med fast topp, en midtsone som kan scrolle og en fast bunnsone med veien ut.
 * Det er bedre å scrolle enn å skjule (gj. 9, B2).
 */
function side(tittel: string, midt: string, bunn: string, klasse = ""): string {
  return `<div class="side ${klasse}"><div class="side-topp"><h1>${tittel}</h1></div><div class="side-midt">${midt}</div><div class="side-bunn">${bunn}</div></div>`;
}

function tilbakeKnapp(til: Skjerm | "verden", tekst = si(spraak(), "Tilbake", "Tilbake")): string {
  return `<button type="button" data-skjerm="${til}">${tekst}</button>`;
}

function kartHtml(): string {
  const kan = byggSomKanStartes(lagret.by);
  const tomter = valgtBygg ? ledigeTomter(lagret.by, valgtBygg).slice(0, 8) : [];
  const midt = `<div class="kartboks kart-liten">${tegnKart(lagret.by, lagret.aktivDag?.tid ?? 15 * 60, lagret.aktivDag?.plan.leggetid ?? 20 * 60, { navn: kartNavn() })}</div>
    <div class="liste">${kan.map((id) => `<button type="button" data-bygg="${id}">${esc(byggNavn(id))}</button>`).join("")}</div>
    <div class="liste">${tomter.map((tomt) => `<button type="button" data-tomt="${tomt.x},${tomt.y}">${esc(ruteNavn(tomt.x, tomt.y))}</button>`).join("")}</div>
    <div class="liste">${lagret.by.bygg.map((bygg) => `<button type="button" data-apne="${esc(bygg.instans)}">${esc(byggNavn(bygg.bygg))} ${bygg.ferdig ? "★" : `${bygg.steg}`}</button>`).join("")}</div>`;
  return side(si(spraak(), "Byen", "Byen"), midt, tilbakeKnapp("verden"));
}

/** `mal` fra ordboka, for steder der `mal` er et lokalt navn. */
const malTekst = mal;
let valgtPynt: VareId | "" = "";
/** Stedet som vises forstørret når barnet setter eller flytter pynt (gj. 10, C4). */
let pyntOmradeValgt: string | null = null;
/** Pynt barnet har trykket på for å flytte eller ta bort. */
let valgtPyntId: string | null = null;

/** Pyntebua er en butikk: bilde, navn og pris. Det barnet ikke har råd til, er grått (gj. 10, C4). */
function pyntHtml(): string {
  const ferdig = lagret.by.bygg.some((bygg) => bygg.bygg === "bronn" && bygg.ferdig);
  const varer = PYNT.map((vare) => {
    const pris = PYNT_PRIS[vare] ?? 2;
    const mangler = pris - lagret.mynter;
    const navn = storForbokstav(navnVare(vare, spraak()));
    const pengar = mangler > 0 ? `<span class="mangler-tekst">${esc(mal(spraak(), "Mangler {n} mynter", "Manglar {n} myntar", { n: String(mangler) }))}</span>` : `<span class="pris"><span class="mynt liten-mynt">${pris}</span></span>`;
    return `<button type="button" data-pynt="${vare}" class="pynt-vare${mangler > 0 ? " mangler" : ""}" aria-label="${esc(`${navn}, ${pris}`)}">${pyntSvg(vare, 44)}<span class="pynt-navn">${esc(navn)}</span>${pengar}</button>`;
  }).join("");
  const midt = ferdig
    ? `<p class="mynter"><span class="mynt">${lagret.mynter}</span> ${si(spraak(), "mynter", "myntar")}</p>${melding ? `<p class="banner">${esc(melding)}</p>` : ""}<div class="pynt-butikk">${varer}</div>`
    : `<p>${si(spraak(), "Brønnen må være ferdig først.", "Brunnen må vere ferdig først.")}</p>`;
  const flytt = ferdig && (lagret.by.pynt ?? []).length ? `<button type="button" data-pynt-se="1">${si(spraak(), "Flytt pynt", "Flytt pynt")}</button>` : "";
  return side(si(spraak(), "Pyntebu", "Pyntebu"), midt, `${tilbakeKnapp(lagret.aktivDag ? "verden" : "meny", si(spraak(), "← Byen", "← Byen"))}${flytt}`);
}

/** «Blomsten er laget av en sirkel, en oval og en trekant.» */
function pyntFormTekst(vare: VareId): string {
  const former = (PYNT_FORMER[vare] ?? []).map((form) => formMedArtikkel(form, spraak()));
  const liste = former.length > 1 ? `${former.slice(0, -1).join(", ")} ${si(spraak(), "og", "og")} ${former.at(-1)}` : (former[0] ?? "");
  return mal(spraak(), "{pynt} er laget av {former}.", "{pynt} er laga av {former}.", { pynt: vareBestemt(vare, spraak()), former: liste });
}

/** Kartet med steder som har ledige plasser, eller ett sted forstørret med plassene som knapper. */
function pyntKartHtml(): string {
  const tid = lagret.aktivDag?.tid ?? 15 * 60;
  const leggetid = lagret.aktivDag?.plan.leggetid ?? 20 * 60;
  const valgt = valgtPyntId ? (lagret.by.pynt ?? []).find((rad) => rad.id === valgtPyntId) : undefined;
  const flytter = Boolean(valgt);
  const ramme = pyntOmradeValgt ? pyntOmradeRamme(lagret.by, pyntOmradeValgt) : null;
  const tittel = valgt
    ? si(spraak(), "Hvor skal pynten stå?", "Kvar skal pynten stå?")
    : valgtPynt
      ? mal(spraak(), "Hvor skal {pynt} stå?", "Kvar skal {pynt} stå?", { pynt: smaForbokstav(vareBestemt(valgtPynt, spraak())) })
      : si(spraak(), "Trykk på pynten du vil flytte.", "Trykk på pynten du vil flytte.");
  const info = valgt ? `<p class="banner">${esc(pyntFormTekst(valgt.vare))}</p>` : melding ? `<p class="banner">${esc(melding)}</p>` : "";
  if (pyntOmradeValgt && ramme) {
    const w = ramme.x1 - ramme.x0;
    const h = ramme.y1 - ramme.y0;
    const pos = (x: number, y: number) => `left:${(((x - ramme.x0) / w) * 100).toFixed(1)}%;top:${(((y - ramme.y0) / h) * 100).toFixed(1)}%`;
    const plasser = pyntPlasser(lagret.by).filter((plass) => pyntOmrade(plass.plass) === pyntOmradeValgt);
    const knapper = plasser
      .map((plass) => {
        const her = (lagret.by.pynt ?? []).find((rad) => rad.plass === plass.plass);
        if (her) return `<button type="button" class="pynt-plass har${her.id === valgtPyntId ? " valgt" : ""}" data-pynt-id="${esc(her.id)}" style="${pos(plass.x, plass.y)}" aria-label="${esc(storForbokstav(navnVare(her.vare, spraak())))}">${pyntSvg(her.vare, 32)}</button>`;
        if (!valgtPynt && !flytter) return "";
        return `<button type="button" class="pynt-plass ledig" data-pynt-plass="${esc(plass.plass)}" style="${pos(plass.x, plass.y)}" aria-label="${esc(si(spraak(), "Sett pynten her", "Set pynten her"))}">+</button>`;
      })
      .join("");
    const bilde = tegnKart({ ...lagret.by, pynt: [] }, tid, leggetid, { ramme });
    const midt = `${info}<div class="hage" style="--w:${w};--h:${h}">${bilde}${knapper}</div>`;
    const fjern = valgt ? `<button type="button" data-pynt-fjern="${esc(valgt.id)}">${si(spraak(), "Ta bort", "Ta bort")}</button>` : "";
    return side(esc(tittel), midt, `<button type="button" data-pynt-omrade-lukk="1">${si(spraak(), "← Kartet", "← Kartet")}</button>${fjern}`);
  }
  const ledige = new Set(ledigePyntPlasser(lagret.by).map((plass) => pyntOmrade(plass.plass)));
  const medPynt = new Set((lagret.by.pynt ?? []).map((rad) => pyntOmrade(rad.plass)));
  const omrader = [...new Set(pyntPlasser(lagret.by).map((plass) => pyntOmrade(plass.plass)))]
    .filter((id) => (valgtPynt ? ledige.has(id) : medPynt.has(id)))
    .map((id) => ({ id, ramme: pyntOmradeRamme(lagret.by, id) }))
    .filter((rad): rad is { id: string; ramme: { x0: number; y0: number; x1: number; y1: number } } => rad.ramme !== null);
  const midt = `${info}<div class="kartboks kart-pynt">${tegnKart(lagret.by, tid, leggetid, { navn: kartNavn(), pyntOmrader: omrader })}</div>`;
  return side(esc(tittel), midt, tilbakeKnapp("pynt", si(spraak(), "← Pyntebu", "← Pyntebu")));
}

function byggHtml(): string {
  const instans = lagret.aktivDag?.valgtInstans;
  const plassert = lagret.by.bygg.find((bygg) => bygg.instans === instans);
  if (!plassert) return side(si(spraak(), "Byen", "Byen"), "", tilbakeKnapp("kart"));
  const def = byggDef(plassert.bygg);
  const steg = def.oppskrift[plassert.steg];
  const tekst = steg ? fraNb(spraak(), steg.nb, steg.nn) : si(spraak(), "Ferdig.", "Ferdig.");
  const midt = `${melding ? `<p class="boble">${esc(melding)}</p>` : ""}
    ${plassert.ferdig ? tegnBygg(plassert.bygg, (lagret.aktivDag?.tid ?? 0) >= 18 * 60) : steg ? `<div class="kurv-rad">${delBilde(steg.vare)}<p>${esc(tekst)}</p></div>` : ""}
    <ol>${def.oppskrift.map((rad, indeks) => `<li>${indeks < plassert.steg ? "✓ " : indeks === plassert.steg ? "→ " : ""}${esc(fraNb(spraak(), rad.nb, rad.nn))}</li>`).join("")}</ol>`;
  const bunn = `${tilbakeKnapp("kart")}${steg ? `<button type="button" class="hoved" data-handling="steg">${si(spraak(), "Bygg steget", "Bygg steget")}</button>` : ""}`;
  return side(esc(byggNavn(plassert.bygg)), midt, bunn);
}

function menyHtml(): string {
  if (byenErFerdig(lagret.by)) {
    const bunn = `<button type="button" class="hoved stor" data-handling="${lagret.aktivDag ? "fortsett-dag" : "start"}">${lagret.aktivDag ? si(spraak(), "Fortsett dagen", "Hald fram") : si(spraak(), "Spill", "Spel")}</button>
      <div class="ikonrad">
        <button type="button" data-skjerm="pynt">${si(spraak(), "Pynt byen", "Pynt byen")}</button>
        <button type="button" data-handling="klokke-meny">${si(spraak(), "Klokkeleken", "Klokkeleiken")}</button>
        <button type="button" data-skjerm="dagbok">${si(spraak(), "Dagboka", "Dagboka")}</button>
        <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
        <button type="button" data-handling="spor-ny-by">${si(spraak(), "Start en ny by", "Start ein ny by")}</button>
      </div>`;
    return `<div class="forside"><h1>${si(spraak(), "Byen er ferdig!", "Byen er ferdig!")}</h1><p>${si(spraak(), "Slottsball! Byen feirer.", "Slottsball! Byen feirar.")}</p>${bybilde(15 * 60)}<div class="forside-bunn">${bunn}</div></div>`;
  }
  return `<div class="forside">
    <h1>Formbyen</h1>
    ${bybilde(15 * 60)}
    <div class="forside-bunn">
    <p class="fremdrift">${esc(fremdriftTekst())}</p>
    <button type="button" class="hoved stor" data-handling="${lagret.aktivDag ? "fortsett-dag" : "start"}">${lagret.aktivDag ? si(spraak(), "Fortsett dagen", "Hald fram") : si(spraak(), "Spill", "Spel")}</button>
    <div class="ikonrad">
      <button type="button" data-skjerm="dagbok">${si(spraak(), "Dagboka", "Dagboka")}</button>
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
    </div></div>
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
  return mal(spraak(), "Bynivå {nivaa}. Du bygger {bygg}.", "Bynivå {nivaa}. Du byggjer {bygg}.", {
    nivaa,
    bygg: byggBestemtOrd(maal.id, spraak()),
  });
}

function datoTekst(dato: Lagret["dato"]): string {
  const uke = ukedagTekst(spraak(), ukedagFor(dato));
  return `${uke.charAt(0).toUpperCase()}${uke.slice(1)} ${dato.dag}. ${manedTekst(spraak(), MANED_ID[dato.maned - 1] ?? "januar")}`;
}

function dagstartHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return menyHtml();
  const maal = maalBygg(lagret);
  const deler = grupperteDeler()
    .map((rad) => `<span class="del ${rad.har === rad.antall ? "har" : ""}">${delSvg(rad.vare, 28)}${esc(vareAntall(rad.vare, rad.antall, spraak()))}</span>`)
    .join("");
  const liste = `<div class="dagliste">${planPunkter()
    .map((punkt) => `<div class="dagrad">${ikon(ikonNavn(punkt.navn), "ikon-s")}<span class="dagtid">${tidTilDigital24(punkt.tid)}</span><p>${esc(punkt.navn)}</p></div>`)
    .join("")}</div>`;
  const bygg = maal
    ? `<div class="bygg-start"><div class="bygg-lite">${tegnBygg(maal.id, false)}</div><div><h2>${esc(si(spraak(), "I dag bygger vi", "I dag byggjer vi"))} ${esc(byggBestemtOrd(maal.id, spraak()))}</h2><div class="delrad">${deler}</div></div></div>`
    : "";
  const bunn = `${skiltKort()}<button type="button" class="hoved" data-handling="start-ettermiddag">${dag.plan.ukedag === "lordag" || dag.plan.ukedag === "sondag" ? si(spraak(), "Start dagen", "Start dagen") : si(spraak(), "Start ettermiddagen", "Start ettermiddagen")}</button>`;
  return side(`<span class="dato">${esc(datoTekst(dag.plan.dato))}</span> ${si(spraak(), "Dagens plan", "Dagens plan")}`, `${liste}${bygg}`, bunn, "dagstart");
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
  const bilder = [bybilde(10 * 60), `<div class="intro-bilde">${tegnBygg("ronne")}</div>`, `<div class="kartboks">${tegnKart(lagret.by, 16 * 60, 20 * 60, { navn: kartNavn() })}</div>`, `<div class="intro-bilde">${urHtml(14 * 60 + 30)}</div>`];
  const figur =
    introSide === 4
      ? `<div class="intro-valg"><h2>${si(spraak(), "Velg figur", "Vel figur")}</h2><div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${lagret.innstillinger.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div><h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2><div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "valgt" : ""}" aria-label="${dyrNavn(dyr)}">${kjaeledyr(dyr)}</button>`).join("")}</div></div>`
      : "";
  const bilde = introSide < 4 ? (bilder[introSide] ?? "") : "";
  const setning = introSide < 4 ? (sider[introSide] ?? "") : si(spraak(), "Velg hvem som bygger.", "Vel kven som byggjer.");
  return `<div class="forside intro"><h1>Formbyen</h1>${bilde}${figur}<div class="forside-bunn"><p>${esc(setning)}</p>
    <button type="button" class="hoved" data-intro="neste">${introSide >= 4 ? si(spraak(), "Spill", "Spel") : si(spraak(), "Neste", "Neste")}</button>
    <button type="button" data-intro="hopp">${si(spraak(), "Hopp over", "Hopp over")}</button></div></div>`;
}

function pauseHtml(): string {
  const midt = `<div class="liste">
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
      ${
        bekreftAvslutt
          ? `<p>${si(spraak(), "Avslutte dagen nå?", "Avslutte dagen no?")}</p><button type="button" data-handling="avslutt">${si(spraak(), "Ja, avslutt", "Ja, avslutt")}</button>`
          : `<button type="button" data-handling="spor-avslutt">${si(spraak(), "Avslutt dagen", "Avslutt dagen")}</button>`
      }
    </div>`;
  return side(si(spraak(), "Pause", "Pause"), midt, `<button type="button" class="hoved" data-skjerm="verden">${si(spraak(), "Fortsett", "Hald fram")}</button>`);
}

function velgHtml(): string {
  const midt = `<div class="figurer">${[0, 1, 2, 3]
    .map((variant) => `<button type="button" data-figur="${variant}" class="${lagret.innstillinger.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`)
    .join("")}</div>
    <div class="figurer">${(["hund", "katt", "kanin"] as const)
      .map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "valgt" : ""}" aria-label="${dyrNavn(dyr)}">${kjaeledyr(dyr)}</button>`)
      .join("")}</div>`;
  return side(si(spraak(), "Hvem bygger?", "Kven byggjer?"), midt, `<button type="button" class="hoved" data-start="1">${si(spraak(), "Klar", "Klar")}</button>`);
}

function innstillingerHtml(): string {
  const inn = lagret.innstillinger;
  const tilbake = lagret.aktivDag ? "pause" : "meny";
  // Nivå, språk og lyd ligger bak låsen på voksensiden (gj. 9, B4).
  const midt = `<div class="inn-gruppe"><h2>${si(spraak(), "Velg figur", "Vel figur")}</h2>
    <div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${inn.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div>
    <h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2>
    <div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${inn.kjaeledyr === dyr ? "valgt" : ""}" aria-label="${dyrNavn(dyr)}">${kjaeledyr(dyr)}</button>`).join("")}</div></div>
    <div class="inn-gruppe"><button type="button" data-intro="se">${si(spraak(), "Se introduksjonen", "Sjå introduksjonen")}</button>
    <h2>${si(spraak(), "For voksne", "For vaksne")}</h2>
    <button type="button" data-voksen="apne">${si(spraak(), "Åpne voksensiden", "Opne vaksensida")}</button></div>`;
  return side(si(spraak(), "Innstillinger", "Innstillingar"), midt, tilbakeKnapp(tilbake));
}

const NIVAA_NAVN: Record<Nivaa, [string, string]> = {
  forste: ["1. klasse", "1. klasse"],
  andre: ["2. klasse", "2. klasse"],
  utfordrende: ["Utfordrende", "Utfordrande"],
  blandet: ["Blandet", "Blanda"],
};
const NIVAA_LINJE: Record<Nivaa, [string, string]> = {
  forste: ["Hele og halve timer. Sirkel, trekant, kvadrat og rektangel. Gange tar 30 minutter.", "Heile og halve timar. Sirkel, trekant, kvadrat og rektangel. Gange tek 30 minutt."],
  andre: ["Kvart over og kvart på. Flere former og romformer.", "Kvart over og kvart på. Fleire former og romformer."],
  utfordrende: ["Fem minutter, 24-timers klokke og vanskeligere former.", "Fem minutt, 24-timars klokke og vanskelegare former."],
  blandet: ["Oppgaver fra alle tre nivåene om hverandre.", "Oppgåver frå alle tre nivåa om kvarandre."],
};

const KOMPETANSEMAL: { nb: string; nn: string; ferdigheter: Ferdighet[] }[] = [
  { nb: "Beskrive tid ved hjelp av kalender og analog og digital klokke.", nn: "Beskrive tid ved hjelp av kalender og analog og digital klokke.", ferdigheter: ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24", "tidsrom", "periode"] },
  { nb: "Utforske, tegne og beskrive geometriske figurer og sortere dem etter egenskaper.", nn: "Utforske, teikne og beskrive geometriske figurar og sortere dei etter eigenskapar.", ferdigheter: ["former-grunn", "former-flere", "sortere", "telle-2d", "tegne", "former-3d", "telle-3d", "stempel"] },
  { nb: "Kjenne igjen gjentakende enheter i mønstre.", nn: "Kjenne att gjentakande einingar i mønster.", ferdigheter: ["monster"] },
  { nb: "Måle lengde og masse med ikke-standardiserte og standardiserte enheter.", nn: "Måle lengd og masse med ikkje-standardiserte og standardiserte einingar.", ferdigheter: ["lengde", "masse"] },
  { nb: "Beskrive tid med kalender: ukedager og måneder.", nn: "Beskrive tid med kalender: vekedagar og månader.", ferdigheter: ["ukedager", "maneder"] },
  { nb: "Fra 3. trinn (utfordrende): måle areal, plassere punkter i et rutenett og utforske likevekt.", nn: "Frå 3. trinn (utfordrande): måle areal, plassere punkt i eit rutenett og utforske likevekt.", ferdigheter: ["areal", "koordinater", "likevekt"] },
];

const FASTE_AKTIVITETER = ["lekser", "hund", "tannlege", "svomming", "dans", "fotball", "korps", "piano", "kor", "bibliotek"] as const;

function seksjon(id: VoksenFane, tittel: string, innhold: string): string {
  const apen = voksenFane === id;
  return `<section class="seksjon${apen ? " apen" : ""}"><button type="button" class="seksjon-knapp" data-seksjon="${id}" aria-expanded="${apen ? "true" : "false"}"><span>${tittel}</span><span aria-hidden="true">${apen ? "▾" : "▸"}</span></button>${apen ? `<div class="seksjon-innhold">${innhold}</div>` : ""}</section>`;
}

function bryter(data: string, tittel: string, forklaring: string, pa: boolean): string {
  return `<button type="button" class="bryter" data-${data}="1" aria-pressed="${pa ? "true" : "false"}"><span class="bryter-tekst"><strong>${tittel}</strong><span>${forklaring}</span></span><span class="bryter-verdi">${pa ? si(spraak(), "På", "På") : si(spraak(), "Av", "Av")}</span></button>`;
}

function avtaleNavn(avtale: { aktivitet: string; ukedag: Ukedag; start: number }): string {
  return `${visNavn(avtale.aktivitet, spraak())}, ${ukedagTekst(spraak(), avtale.ukedag)} ${si(spraak(), "kl.", "kl.")} ${tidTilDigital24(avtale.start)}`;
}

function voksenHtml(): string {
  const tilbakeTil = voksenFra === "verden" && !lagret.aktivDag ? "meny" : voksenFra;
  if (!voksenInne) {
    const midt = `<p>${si(spraak(), "For voksne. Løs regnestykket for å åpne.", "For vaksne. Løys reknestykket for å opne.")}</p>
      ${voksenFeil ? `<p class="feilmelding">${si(spraak(), "Feil svar. Prøv dette:", "Feil svar. Prøv dette:")}</p>` : ""}
      <p class="regnestykke">${esc(voksen.tekst)} =</p>
      <label class="felt"><span class="skjult">${si(spraak(), "Svar", "Svar")}</span><input id="voksen-svar" inputmode="numeric" pattern="[0-9]*" autocomplete="off" value="${esc(voksenFelt)}"/></label>`;
    return side(si(spraak(), "For voksne", "For vaksne"), midt, `${tilbakeKnapp(tilbakeTil)}<button type="button" class="hoved" data-voksen="sjekk">${si(spraak(), "Åpne", "Opne")}</button>`, "voksen-las");
  }
  const inn = lagret.innstillinger;
  const linjer = oversiktLinjer(lagret.mestring, spraak());
  const sist = lagret.dagbok.at(-1);
  const ukeDager = sist ? lagret.dagbok.filter((rad) => sammeUke(rad.dato, sist.dato)).length : 0;
  const oversikt = `${[linjer.klokke, linjer.former, linjer.tid, linjer.maling].filter(Boolean).map((linje) => `<p>${esc(linje)}</p>`).join("")}
    <p>${mal(spraak(), "Dager spilt denne uka: {n}.", "Dagar spela denne veka: {n}.", { n: String(ukeDager) })} ${sist ? mal(spraak(), "Siste spilledag: {dato}.", "Siste speledag: {dato}.", { dato: datoTekst(sist.dato).toLowerCase() }) : si(spraak(), "Ingen dager spilt ennå.", "Ingen dagar spela enno.")}</p>`;
  const statusNavn: Record<Status, string> = {
    ikke: si(spraak(), "Ikke øvd", "Ikkje øvd"),
    over: si(spraak(), "Øver", "Øver"),
    sikker: si(spraak(), "Sikker", "Sikker"),
  };
  const detalj = `${OMRADER.map(
    (omrade) => `<h3>${si(spraak(), omrade.navn[0], omrade.navn[1])}</h3><table class="mestring"><tbody>${omrade.ferdigheter
      .map((id) => {
        const rad = ferdighetStatus(lagret.mestring[id]);
        const navn = FERDIGHET_NAVN[id];
        const tall = rad.forsok ? mal(spraak(), "{a} av {b}", "{a} av {b}", { a: String(rad.riktige), b: String(rad.forsok) }) : "–";
        return `<tr class="status-${rad.status}"><th scope="row">${esc(storForbokstav(si(spraak(), navn[0], navn[1])))}</th><td>${statusNavn[rad.status]}</td><td>${tall}</td></tr>`;
      })
      .join("")}</tbody></table>`,
  ).join("")}
    <p class="hjelp">${si(spraak(), "Sikker betyr minst 8 av de 10 siste svarene riktige, over minst to dager.", "Sikker tyder minst 8 av dei 10 siste svara rette, over minst to dagar.")}</p>
    <details><summary>${si(spraak(), "Kompetansemål etter 2. trinn", "Kompetansemål etter 2. trinn")}</summary>${KOMPETANSEMAL.map(
      (rad) => `<p><strong>${esc(si(spraak(), rad.nb, rad.nn))}</strong><br>${esc(rad.ferdigheter.filter((id) => OMRADER.some((omrade) => omrade.ferdigheter.includes(id))).map((id) => si(spraak(), FERDIGHET_NAVN[id][0], FERDIGHET_NAVN[id][1])).join(", "))}</p>`,
    ).join("")}</details>`;
  const nivaa = `<div class="liste">${NIVA.map((id) => `<button type="button" data-nivaa="${id}" class="nivaa-kort ${inn.nivaa === id ? "valgt" : ""}" aria-pressed="${inn.nivaa === id ? "true" : "false"}"><strong>${si(spraak(), NIVAA_NAVN[id][0], NIVAA_NAVN[id][1])}</strong><span>${si(spraak(), NIVAA_LINJE[id][0], NIVAA_LINJE[id][1])}</span></button>`).join("")}</div>
    <label class="felt"><span>${si(spraak(), "Språk", "Språk")}</span><select id="spraak" class="spraak">${SPRAAK.map((kode) => `<option value="${kode}" ${inn.spraak === kode ? "selected" : ""}>${SPRAAK_NAVN[kode]}</option>`).join("")}</select></label>
    ${bryter("lyd", si(spraak(), "Lyd", "Lyd"), si(spraak(), "Små lyder når barnet svarer.", "Små lydar når barnet svarar."), inn.lydPa)}
    ${bryter("digital", si(spraak(), "Digital klokke", "Digital klokke"), si(spraak(), "Vis 24-timers tid under klokka.", "Vis 24-timars tid under klokka."), !inn.skjulDigital)}
    ${bryter("tidsrom", si(spraak(), "Tidsrom", "Tidsrom"), si(spraak(), "Oppgaver om hvor lang tid noe tar.", "Oppgåver om kor lang tid noko tek."), inn.tidsromPa)}
    ${bryter("rekord", si(spraak(), "Hele dagboka", "Heile dagboka"), si(spraak(), "Vis alle dager i dagboka, ikke bare den siste uka.", "Vis alle dagar i dagboka, ikkje berre den siste veka."), inn.rekordlistePa)}`;
  const avtaler = `${inn.fasteAvtaler.length ? `<ul class="avtaleliste">${inn.fasteAvtaler.map((avtale, indeks) => `<li><span>${esc(avtaleNavn(avtale))}</span><button type="button" data-fjern="${indeks}" aria-label="${si(spraak(), "Fjern", "Fjern")} ${esc(avtaleNavn(avtale))}">×</button></li>`).join("")}</ul>` : `<p>${si(spraak(), "Ingen faste avtaler ennå.", "Ingen faste avtalar enno.")}</p>`}
    <h3>${si(spraak(), "Legg til fast avtale", "Legg til fast avtale")}</h3>
    <div class="skjema">
      <label class="felt"><span>${si(spraak(), "Aktivitet", "Aktivitet")}</span><select id="fast-aktivitet">${FASTE_AKTIVITETER.map((id) => `<option value="${id}">${esc(visNavn(id, spraak()))}</option>`).join("")}</select></label>
      <label class="felt"><span>${si(spraak(), "Ukedag", "Vekedag")}</span><select id="fast-dag">${UKEDAGER.map((dag) => `<option value="${dag}">${ukedagTekst(spraak(), dag)}</option>`).join("")}</select></label>
      <label class="felt"><span>${si(spraak(), "Tid", "Tid")}</span><select id="fast-tid">${Array.from({ length: 17 }, (_, i) => 12 * 60 + i * 30).map((tid) => `<option value="${tid}" ${tid === 17 * 60 ? "selected" : ""}>${tidTilDigital24(tid)}</option>`).join("")}</select></label>
      <button type="button" data-fast="1">${si(spraak(), "Legg til", "Legg til")}</button>
    </div>`;
  const forslag = importForslag
    ? `<div class="bekreft"><p>${mal(spraak(), "Fila inneholder en by på nivå {nivaa} med {bygg} bygg. Erstatte byen på denne telefonen?", "Fila inneheld ein by på nivå {nivaa} med {bygg} bygg. Erstatte byen på denne telefonen?", { nivaa: String(importForslag.by.nivaa), bygg: String(importForslag.by.bygg.length) })}</p><div class="rad"><button type="button" data-import="avbryt">${si(spraak(), "Avbryt", "Avbryt")}</button><button type="button" class="hoved" data-import="erstatt">${si(spraak(), "Erstatt", "Erstatt")}</button></div></div>`
    : "";
  const slett =
    nullSteg >= 1
      ? `<div class="bekreft"><p>${si(spraak(), "Dette sletter hele byen på denne telefonen.", "Dette slettar heile byen på denne telefonen.")}</p><div class="rad"><button type="button" data-null="avbryt">${si(spraak(), "Avbryt", "Avbryt")}</button><button type="button" class="fare" data-null="ja">${si(spraak(), "Slett byen", "Slett byen")}</button></div></div>`
      : `<button type="button" data-null="spor">${si(spraak(), "Start på nytt", "Start på nytt")}</button>`;
  const data = `<p>${si(spraak(), "Byen ligger bare på denne telefonen. Lagre den som fil for å ta vare på den eller flytte den.", "Byen ligg berre på denne telefonen. Lagre han som fil for å ta vare på han eller flytte han.")}</p>
    <button type="button" data-eksport="1">${si(spraak(), "Lagre byen som fil", "Lagre byen som fil")}</button>
    <button type="button" data-import="velg">${si(spraak(), "Hent by fra fil", "Hent by frå fil")}</button>
    <input id="import-fil" class="skjult" type="file" accept="application/json,.json" tabindex="-1" aria-hidden="true"/>
    ${importMelding ? `<p class="feilmelding">${esc(importMelding)}</p>` : ""}
    ${forslag}
    ${slett}`;
  const om = `<p>${si(spraak(), "Et byggespill om former og klokka for 1. og 2. klasse. Riktige svar gir materialer. Ingenting som er bygget, forsvinner.", "Eit byggespel om former og klokka for 1. og 2. klasse. Rette svar gir materiale. Ingenting som er bygd, forsvinn.")}</p>
    <h3>${si(spraak(), "Personvern", "Personvern")}</h3>
    <p>${si(spraak(), "Ingen konto. Ingen sky. Ingen analyse. Byen ligger bare på telefonen.", "Ingen konto. Ingen sky. Ingen analyse. Byen ligg berre på telefonen.")}</p>
    <details><summary>${si(spraak(), "Slik legger du appen på hjemskjermen", "Slik legg du appen på heimeskjermen")}</summary>
      <p><strong>iPhone:</strong> ${si(spraak(), "Åpne Formbyen i Safari. Trykk Del. Trykk Legg til på Hjem-skjerm.", "Opne Formbyen i Safari. Trykk Del. Trykk Legg til på Heim-skjerm.")}</p>
      <p><strong>Android:</strong> ${si(spraak(), "Åpne Formbyen i Chrome. Trykk menyen og Installer app.", "Opne Formbyen i Chrome. Trykk menyen og Installer app.")}</p>
      <p>${si(spraak(), "Når du har åpnet appen én gang, kan du spille uten nett.", "Når du har opna appen éin gong, kan du spele utan nett.")}</p>
    </details>
    <p>${si(spraak(), "Versjon", "Versjon")} ${esc(VERSJON)} · ${esc(BYGG)}</p>
    <button type="button" data-oppdater="1">${si(spraak(), "Sjekk for oppdateringer", "Sjekk for oppdateringar")}</button>
    ${statusOppdater ? `<p>${esc(fraNb(spraak(), statusOppdater))}</p>` : ""}
    <p>${si(spraak(), "Ideen er Reidar Kind sin. Utviklet ved hjelp av AI.", "Ideen er Reidar Kind sin. Utvikla ved hjelp av AI.")}</p>
    <a class="knapp" href="https://reidarkind.github.io/myapps/" target="_blank" rel="noopener noreferrer">${si(spraak(), "Andre apper", "Andre appar")}</a>`;
  const midt = `${seksjon("oversikt", si(spraak(), "Oversikt", "Oversikt"), oversikt)}
    ${seksjon("detalj", si(spraak(), "Mestring i detalj", "Meistring i detalj"), detalj)}
    ${seksjon("nivaa", si(spraak(), "Nivå og språk", "Nivå og språk"), nivaa)}
    ${seksjon("avtaler", si(spraak(), "Faste avtaler", "Faste avtalar"), avtaler)}
    ${seksjon("data", si(spraak(), "Ta vare på byen", "Ta vare på byen"), data)}
    ${seksjon("om", si(spraak(), "Om appen", "Om appen"), om)}`;
  return `<div class="side voksen"><div class="side-topp voksen-topp"><button type="button" data-voksen="ut">${si(spraak(), "← Tilbake til spillet", "← Tilbake til spelet")}</button><h1>${si(spraak(), "For voksne", "For vaksne")}</h1></div><div class="side-midt">${midt}</div></div>`;
}

function sammeUke(a: Lagret["dato"], b: Lagret["dato"]): boolean {
  const dato = (d: Lagret["dato"]) => new Date(Date.UTC(d.aar, d.maned - 1, d.dag));
  const mandag = (d: Date) => {
    const kopi = new Date(d);
    kopi.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return kopi.getTime();
  };
  return mandag(dato(a)) === mandag(dato(b));
}

function kveldHtml(): string {
  const sist = lagret.dagbok.at(-1);
  const bygget = sist?.bygget.length ? `${si(spraak(), "Bygget i dag:", "Bygd i dag:")} ${sist.bygget.map((id) => byggNavn(id as ByggId)).join(", ")}` : si(spraak(), "Ingen nye bygg i dag.", "Ingen nye bygg i dag.");
  const former = (sist?.former ?? []).filter((id) => formNavn(id, spraak()) !== id || ["kule", "kube", "sylinder", "kjegle", "sirkel", "trekant", "kvadrat", "rektangel"].includes(id));
  const linjer = (sist?.avtaler ?? [])
    .map((avtale) => {
      const navn = visNavn(avtale.aktivitet, spraak());
      const merke = avtale.gjort ? "✓" : "✗";
      const ekstra = avtale.gjort ? "" : avtale.ikke ? si(spraak(), " – ikke i dag", " – ikkje i dag") : si(spraak(), " – vi kom for sent", " – vi kom for seint");
      return `<li>${merke} ${esc(navn)} ${tidTilDigital24(avtale.start)}${esc(ekstra)}</li>`;
    })
    .join("");
  const tidligere = new Set(lagret.dagbok.slice(0, -1).flatMap((inn) => inn.former));
  const nye = former.filter((id) => !tidligere.has(id));
  const stjerneLinjer = (sist?.merknad ?? "").split("\n").filter(Boolean);
  const formLinje = nye.length ? `<p>${esc(si(spraak(), "Ny form i dag:", "Ny form i dag:"))} ${esc(nye.map((id) => formNavn(id, spraak())).join(", "))}</p>` : "";
  const antall = sist?.stjerner ?? (sist?.stjerne ? 1 : 0);
  const fest = sist && ukedagFor(sist.dato) === "fredag" && fredagsfest(sist.dato) ? `<p>${esc(si(spraak(), "Fredagsfest på torget.", "Fredagsfest på torget."))}</p>` : "";
  const avtaleAntall = sist?.avtaler?.length ?? 0;
  const gjort = (sist?.avtaler ?? []).filter((avtale) => avtale.gjort).length;
  const hendelser = (sist?.avtaler ?? []).slice(0, 6);
  const valgt = kveldOrden.filter((indeks) => indeks >= 0 && indeks < hendelser.length);
  const igjen = hendelser.map((avtale, indeks) => ({ avtale, indeks })).filter((rad) => !valgt.includes(rad.indeks));
  // Kartet, avtalelista og «Min dag i rekkefølge» deler samme flate, så kvelden får plass uten scrolling.
  const panel = kveldPanel === "avtaler" && avtaleAntall ? "avtaler" : kveldPanel === "rekkefolge" && hendelser.length > 1 ? "rekkefolge" : "kart";
  const flate =
    panel === "avtaler"
      ? `<ul class="kveld-liste">${linjer}</ul>`
      : panel === "rekkefolge"
        ? `<div class="rekkefolge"><h2>${si(spraak(), "Min dag i rekkefølge", "Min dag i rekkjefølgje")}</h2><p class="hjelp">${si(spraak(), "Trykk på det som kom først.", "Trykk på det som kom først.")}</p><div class="rad">${igjen
            .map((rad) => `<button type="button" class="liten" data-kveld="${rad.indeks}">${esc(visNavn(rad.avtale.aktivitet, spraak()))}</button>`)
            .join("")}</div>${valgt.length ? `<ol>${valgt.map((indeks) => `<li>${tidTilDigital24(hendelser[indeks]?.start ?? 0)} ${esc(visNavn(hendelser[indeks]?.aktivitet ?? "", spraak()))}</li>`).join("")}</ol>` : ""}</div>`
        : `<div class="kartboks">${tegnKart(lagret.by, 20 * 60, 20 * 60, { hele: true, navn: kartNavn() })}</div>`;
  const kartKnapp = `<button type="button" class="liten" data-kveld="kart">${si(spraak(), "Kartet", "Kartet")} ▸</button>`;
  const knapper = `<div class="rad kveld-knapper">${
    avtaleAntall ? (panel === "avtaler" ? kartKnapp : `<button type="button" class="liten" data-kveld="avtaler">✓ ${gjort} ${si(spraak(), "av", "av")} ${avtaleAntall} ${si(spraak(), "avtaler", "avtalar")} ▸</button>`) : ""
  }${hendelser.length > 1 ? (panel === "rekkefolge" ? kartKnapp : `<button type="button" class="liten" data-kveld="rekkefolge">${si(spraak(), "Min dag i rekkefølge", "Min dag i rekkjefølgje")} ▸</button>`) : ""}</div>`;
  return `<div class="kveld"><div class="kveld-topp"><h1>${si(spraak(), "Kvelden kommer", "Kvelden kjem")}</h1><p class="stjerner" aria-label="${antall} ${si(spraak(), "stjerner", "stjerner")}">${"★".repeat(antall)}${"☆".repeat(Math.max(0, 3 - antall))}</p></div>
    <div class="kveld-flate">${flate}</div>
    <div class="kveld-midt">
    <ul class="stjernelinjer">${stjerneLinjer.map((linje) => `<li>${esc(linje)}</li>`).join("")}</ul>
    ${fest}
    <p>${esc(bygget)}</p>
    ${formLinje}
    ${knapper}</div>
    <div class="side-bunn"><button type="button" class="hoved" data-skjerm="meny">${si(spraak(), "God natt", "God natt")}</button></div></div>`;
}

function kurvHtml(): string {
  const rader = Object.entries(lagret.kurv).filter((rad) => (rad[1] ?? 0) > 0);
  const mangler = manglendeDeler(lagret);
  const midt = `${rader.length ? `<div class="kurv-liste">${rader.map(([id, antall]) => `<div class="kurv-rad">${delBilde(id)}<p>${esc(navnVare(id, spraak()))} × ${antall}</p></div>`).join("")}</div>` : `<p>${si(spraak(), "Kurven er tom.", "Korga er tom.")}</p>`}
    <h2>${si(spraak(), "Neste del", "Neste del")}</h2>
    ${mangler.length ? `<div class="kurv-rad">${delBilde(mangler[0] ?? "")}<p>${esc(navnVare(mangler[0] ?? "", spraak()))}</p></div>` : `<p>${si(spraak(), "Handlelisten er tom.", "Handlelista er tom.")}</p>`}`;
  return side(si(spraak(), "Kurven", "Korga"), midt, tilbakeKnapp("verden"));
}

function dagbokHtml(): string {
  const liste = lagret.innstillinger.rekordlistePa ? lagret.dagbok : lagret.dagbok.slice(-7);
  const midt = liste.length
    ? `<ul class="dagbok">${liste
        .map((inn) => `<li><span class="dato">${inn.dato.dag}.${inn.dato.maned}</span> <span class="stjerner">${"★".repeat(inn.stjerner ?? (inn.stjerne ? 1 : 0)) || "·"}</span> ${esc(inn.bygget.map((id) => byggNavn(id as ByggId)).join(", "))} ${esc(inn.former.map((id) => formNavn(id, spraak())).join(", "))}</li>`)
        .join("")}</ul>`
    : `<p>${si(spraak(), "Ingen dager ennå.", "Ingen dagar enno.")}</p>`;
  return side(si(spraak(), "Dagboka", "Dagboka"), midt, `${tilbakeKnapp("meny")}<button type="button" data-skjerm="album">${si(spraak(), "Fotoalbum", "Fotoalbum")}</button>`);
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
  const treff = lagret.dagbok.filter((inn) => sammeUke(inn.dato, dato) && (inn.stjerner ?? (inn.stjerne ? 1 : 0)) >= 1);
  return treff.length >= 5;
}

function albumHtml(): string {
  const kort = [...ALLE_2D, ...ALLE_3D]
    .map((id) => {
      const kjent = kjentForm(id);
      return `<article class="formkort${kjent ? "" : " ukjent"}">${formSvg(id, 48)}<p>${esc(formNavn(id, spraak()))}</p>${kjent ? `<p>${esc(formEgenskap(id))}</p>` : ""}</article>`;
    })
    .join("");
  const midt = `<h2>${si(spraak(), "Former", "Former")}</h2>
    <div class="formalbum">${kort}</div>
    <h2>${si(spraak(), "Bilder av byen", "Bilete av byen")}</h2>
    ${lagret.album.map((foto, indeks) => `<article class="foto">${foto.svg}<button type="button" data-del="${indeks}">${si(spraak(), "Del bilde", "Del bilete")}</button></article>`).join("") || `<p>${si(spraak(), "Bildene kommer når byen vokser.", "Bileta kjem når byen veks.")}</p>`}
    <h2>${si(spraak(), "Pynt", "Pynt")}</h2>
    ${(lagret.by.pynt ?? []).map((pynt) => `<p class="pynt-rad">${pyntSvg(pynt.vare, 32)} ${esc(storForbokstav(navnVare(pynt.vare, spraak())))}</p>`).join("") || `<p>${si(spraak(), "Ingen pynt ennå.", "Ingen pynt enno.")}</p>`}`;
  return side(si(spraak(), "Fotoalbum", "Fotoalbum"), midt, tilbakeKnapp("dagbok"));
}

/** Samme knapper på alle klokker som kan stilles: velg viser, og flytt den ett trinn (gj. 10, C1). */
function viserKnapper(): string {
  const steg = minuttSteg();
  const valgt = (hvem: Viser) => (urViser === hvem ? ` class="valgt" aria-pressed="true"` : ` aria-pressed="false"`);
  const trinn = urViser === "time" ? si(spraak(), "en time", "ein time") : mal(spraak(), "{n} minutter", "{n} minutt", { n: String(steg) });
  return `<div class="rad viser-knapper">
    <button type="button" data-viser-steg="-1" aria-label="${esc(mal(spraak(), "Minus {trinn}", "Minus {trinn}", { trinn }))}">−</button>
    <button type="button" data-viser-valg="time"${valgt("time")}>${si(spraak(), "Lille viser", "Vesle visaren")}</button>
    <button type="button" data-viser-valg="minutt"${valgt("minutt")}>${si(spraak(), "Store viser", "Store visaren")}</button>
    <button type="button" data-viser-steg="1" aria-label="${esc(mal(spraak(), "Pluss {trinn}", "Pluss {trinn}", { trinn }))}">+</button>
  </div>`;
}

function urFriHtml(): string {
  const naa = urSteg[urStegNr];
  const prompt = naa?.tekst ?? si(spraak(), "Tårnuret går riktig.", "Tårnuret går rett.");
  const arm = lagret.aktivDag ? `<div class="armband" aria-label="${si(spraak(), "Armbåndsuret", "Armbandsuret")}">${urHtml(lagret.aktivDag.tid, true, false, "hud")}</div>` : "";
  return `<div class="ur-skjerm side">
    <div class="side-topp ur-topp"><h1>${si(spraak(), "Tårnuret", "Tårnuret")}</h1><span class="ur-teller">${Math.min(urStegNr + 1, Math.max(urSteg.length, 1))}/${Math.max(urSteg.length, 1)}</span>${arm}</div>
    <p class="ur-prompt">${esc(prompt)}</p>
    <div class="ur-midten">${urHtml(pekerTid, false, true, "analog", 200)}${urMelding ? `<p class="ur-melding ${urMelding.riktig ? "riktig" : "feil"}" role="status">${esc(urMelding.tekst)}</p>` : ""}</div>
    <div class="side-bunn ur-bunn">${viserKnapper()}
    <div class="rad">${tilbakeKnapp(lagret.aktivDag ? "verden" : "meny")}<button type="button" class="hoved" data-handling="ur-ferdig">${si(spraak(), "Ferdig", "Ferdig")}</button></div></div></div>`;
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
                : skjerm === "pynt-kart"
                ? pyntKartHtml()
              : skjerm === "kveld"
                ? kveldHtml()
                : skjerm === "innstillinger"
                  ? innstillingerHtml()
                  : skjerm === "voksen"
                    ? voksenHtml()
                        : skjerm === "dagbok"
                          ? dagbokHtml()
                          : skjerm === "album"
                            ? albumHtml()
                            : urFriHtml();
  const aapen = skjerm === "verden" || skjerm === "meny" || skjerm === "kveld" || skjerm === "intro";
  // Scrollposisjonen beholdes når samme skjerm tegnes på nytt.
  const rulle = skjerm === forrigeSkjerm ? [...rot.querySelectorAll<HTMLElement>(".side-midt, .verden-midten, .kveld-midt")].map((el) => el.scrollTop) : [];
  forrigeSkjerm = skjerm;
  rot.innerHTML = `${visOppdater ? `<div class="banner ny-versjon" role="status"><p>${si(spraak(), "Ny versjon av Formbyen. Byen din er lagret. Trykk for å åpne den nye versjonen.", "Ny versjon av Formbyen. Byen din er lagra. Trykk for å opne den nye versjonen.")}</p><button type="button" data-last="1">${si(spraak(), "Åpne på nytt", "Opne på nytt")}</button></div>` : ""}<main class="${aapen ? "by" : "kort"} skjerm-${skjerm}">${innhold}</main>`;
  rot.querySelectorAll<HTMLElement>(".side-midt, .verden-midten, .kveld-midt").forEach((el, indeks) => {
    const verdi = rulle[indeks];
    if (verdi) el.scrollTop = verdi;
  });
  klargjorLerret();
  kobleDra();
  ryddSkilt();
  return "";
}

/**
 * Navneskilt på kartet skal ikke dekke hverandre (gj. 10, C6). Er det ikke plass, skjules det siste skiltet.
 * Stedet har fortsatt bildet sitt og trykkflaten, og navnet står i hjelperens tekst når barnet går dit.
 */
function ryddSkilt(): void {
  for (const flate of rot.querySelectorAll<HTMLElement>(".kartflate")) {
    const skilt = [...flate.querySelectorAll<HTMLElement>(".skilt")];
    const vist: DOMRect[] = [];
    for (const el of skilt) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const kolliderer = vist.some((a) => r.left < a.right - 1 && r.right > a.left + 1 && r.top < a.bottom - 1 && r.bottom > a.top + 1);
      el.classList.toggle("trangt", kolliderer);
      if (!kolliderer) vist.push(r);
    }
  }
}

let forrigeSkjerm: Skjerm | "" = "";

/** Tårnurets runde: fem tider fra morgendagens plan. Startposisjonen er aldri svaret. */
function startUr(): void {
  // En ny runde samme dag gir nye mål (gj. 10, C2).
  urSteg = urRunde(lagret, undefined, lagret.aktivDag?.urRunder ?? 0);
  urStegNr = 0;
  urMelding = null;
  pekerTid = snapTilSteg((lagret.aktivDag?.tid ?? 12 * 60) + minuttSteg());
  const forste = urSteg[0];
  if (forste && sammeUrskive(pekerTid, forste.tid)) pekerTid = snapTilSteg(pekerTid + minuttSteg());
}

function visUrMelding(riktig: boolean, tekst: string): void {
  urMelding = { riktig, tekst };
  window.clearTimeout(urTimer);
  urTimer = window.setTimeout(() => {
    urMelding = null;
    if (skjerm === "ur") tegn();
  }, 1500);
}

function kobleDra(): void {
  const flate = document.querySelector(".figurgrid");
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

/** Trykk og dra på urskiva tolkes som en vinkel (gj. 10, C1). */
function urPunkt(ur: Element, hendelse: PointerEvent): { grader: number; avstand: number } | null {
  const svg = ur.querySelector("svg");
  if (!svg) return null;
  const rect = svg.getBoundingClientRect();
  const dx = hendelse.clientX - (rect.left + rect.width / 2);
  const dy = hendelse.clientY - (rect.top + rect.height / 2);
  // Urskiva har radius 100 i en tegning på 240.
  return { grader: vinkelFra(dx, dy), avstand: Math.hypot(dx, dy) / ((rect.width * 100) / 240) };
}

/** Viseren under fingeren når barnet trykker. Den blir valgt bare hvis barnet drar. */
let urGrep: Viser | null = null;
/** Et trykk som venter på pointerup fordi barnet kanskje tar tak i den andre viseren. */
let urUtsatt: number | null = null;
let urStart = { x: 0, y: 0 };
/** Dra med minuttviseren: tiden og fingerens vinkel da draget startet, og hvor langt fingeren har gått. */
let urDra = { tid: 0, grader: 0, forrige: 0, sum: 0 };

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
  if (ur instanceof HTMLElement && !mal.closest("button")) {
    const punkt = urPunkt(ur, hendelse);
    if (!punkt) return;
    drarUr = true;
    droUr = false;
    urStart = { x: hendelse.clientX, y: hendelse.clientY };
    ur.setPointerCapture(hendelse.pointerId);
    urGrep = gripViser(pekerTid, punkt.grader, punkt.avstand);
    urUtsatt = null;
    if (urGrep && urGrep !== urViser) {
      urUtsatt = punkt.grader;
      return;
    }
    pekerTid = settMedVinkel(pekerTid, punkt.grader, urViser, minuttSteg());
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
  if (!droUr && Math.hypot(hendelse.clientX - urStart.x, hendelse.clientY - urStart.y) < 6) return;
  const punkt = urPunkt(ur, hendelse);
  if (!punkt) return;
  if (!droUr) {
    if (urGrep) urViser = urGrep;
    urDra = { tid: pekerTid, grader: punkt.grader, forrige: punkt.grader, sum: 0 };
  }
  droUr = true;
  urUtsatt = null;
  if (urViser === "minutt") {
    urDra.sum += vinkelSteg(urDra.forrige, punkt.grader);
    urDra.forrige = punkt.grader;
    pekerTid = draMinutt(urDra.tid, urDra.grader, urDra.sum, minuttSteg());
  } else {
    pekerTid = settMedVinkel(pekerTid, punkt.grader, "time", minuttSteg());
  }
  skrivPeker();
});
// Et avbrutt trykk skal ikke la tegning eller dra av viseren henge igjen (gj. 9, 6.12).
rot.addEventListener("pointercancel", () => {
  tegner = false;
  drarUr = false;
  droUr = false;
  urUtsatt = null;
});
rot.addEventListener("pointerup", () => {
  tegner = false;
  if (!drarUr) return;
  drarUr = false;
  if (urUtsatt !== null) pekerTid = settMedVinkel(pekerTid, urUtsatt, urViser, minuttSteg());
  urUtsatt = null;
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
  if (skjerm === "voksen") voksenSist = Date.now();
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
      startUr();
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
  if (knapp.dataset.kveld === "avtaler" || knapp.dataset.kveld === "rekkefolge" || knapp.dataset.kveld === "kart") {
    kveldPanel = knapp.dataset.kveld;
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
  if (knapp.dataset.viserValg === "time" || knapp.dataset.viserValg === "minutt") {
    urViser = knapp.dataset.viserValg;
    tegn();
  }
  if (knapp.dataset.viserSteg) {
    const retning = Number(knapp.dataset.viserSteg);
    if (urViser === "time") settPeker(retning, 0, false);
    else settPeker(0, retning * minuttSteg(), false);
  }
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
    if (skjerm === "voksen") lukkVoksen();
    if (skjerm === "ur") {
      urMelding = null;
      melding = null;
    }
    if (skjerm === "pynt" || skjerm === "pynt-kart") {
      if (til !== "pynt-kart") valgtPynt = "";
      pyntOmradeValgt = null;
      valgtPyntId = null;
      melding = null;
    }
    skjerm = til === "verden" && !lagret.aktivDag ? "meny" : til;
    tegn();
  }
  if (knapp.dataset.ute) {
    if (lagret.aktivDag) {
      // Runden tas vare på og fortsetter der den slapp når barnet handler igjen (gj. 10, 7.1.2).
      const dag = lagret.aktivDag;
      const pauset = dag.fase === "handel" || dag.fase === "forklaring" ? { ko: dag.ko, aktiv: dag.aktiv, feil: dag.feil } : dag.pauset;
      lagret = { ...lagret, aktivDag: { ...dag, fase: "ute", ko: [], forklaring: null, feil: 0, pauset } };
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
    // Dagens frø blandes med tiden, så samme lagring gir ulike dager (gj. 10, C2).
    gjor({ slag: "start", blanding: Date.now() });
  }
  if (handling === "start-ettermiddag") {
    skjerm = "verden";
    tegn();
  }
  if (handling === "spor-ny-by") {
    // Etter opplåsing kommer den voksne rett til bekreftelsen (gj. 9, B4).
    apneVoksen("meny", "data");
    nullSteg = 1;
    tegn();
    return;
  }
  if (handling === "klokke-meny") {
    startUr();
    skjerm = "ur";
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
  if (handling === "ov") {
    gjor({ slag: "ov" });
    return;
  }
  if (handling === "klokke") {
    startUr();
    skjerm = "ur";
    gjor({ slag: "klokke" });
    return;
  }
  if (handling === "ur-ferdig") {
    const maal = urSteg[urStegNr];
    if (maal && sammeUrskive(pekerTid, maal.tid)) {
      urStegNr += 1;
      if (urStegNr >= urSteg.length) {
        // Bare én runde om dagen gir mynter (gj. 9, 6.10). Uten aktiv dag går vi tilbake til menyen (6.1).
        const ut = utfor(lagret, { slag: "ur-runde", riktige: urSteg.length });
        lagret = ut.lagret;
        urMelding = null;
        melding = ut.melding ?? si(spraak(), "Tårnuret går riktig.", "Tårnuret går rett.");
        skjerm = lagret.aktivDag ? "verden" : "meny";
        lagre();
        gjorBanner();
        tegn();
        return;
      }
      visUrMelding(true, si(spraak(), "Riktig!", "Riktig!"));
      const neste = urSteg[urStegNr];
      if (neste && sammeUrskive(pekerTid, neste.tid)) pekerTid = snapTilSteg(pekerTid + minuttSteg() * 2);
    } else {
      visUrMelding(false, si(spraak(), "Prøv igjen.", "Prøv igjen."));
    }
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
    const vare = knapp.dataset.pynt as VareId;
    const pris = PYNT_PRIS[vare] ?? 2;
    if (lagret.mynter < pris) {
      melding = malTekst(spraak(), "Du mangler {n} mynter.", "Du manglar {n} myntar.", { n: String(pris - lagret.mynter) });
      tegn();
      return;
    }
    // Barnet velger plassen på kartet (gj. 10, C4).
    valgtPynt = vare;
    valgtPyntId = null;
    pyntOmradeValgt = null;
    melding = null;
    skjerm = "pynt-kart";
    tegn();
    return;
  }
  if (knapp.dataset.pyntSe) {
    valgtPynt = "";
    valgtPyntId = null;
    pyntOmradeValgt = null;
    melding = null;
    skjerm = "pynt-kart";
    tegn();
    return;
  }
  if (knapp.dataset.pyntOmradeLukk) {
    pyntOmradeValgt = null;
    valgtPyntId = null;
    melding = null;
    tegn();
    return;
  }
  if (knapp.dataset.pyntId) {
    valgtPyntId = valgtPyntId === knapp.dataset.pyntId ? null : knapp.dataset.pyntId;
    melding = null;
    tegn();
    return;
  }
  if (knapp.dataset.pyntPlass) {
    const plass = knapp.dataset.pyntPlass;
    const ut = valgtPyntId ? utfor(lagret, { slag: "pynt-flytt", id: valgtPyntId, plass }) : valgtPynt ? utfor(lagret, { slag: "pynt", vare: valgtPynt, plass }) : null;
    if (ut) {
      lagret = ut.lagret;
      melding = ut.melding;
      lagre();
      klikk(lagret.innstillinger.lydPa, "hammer");
    }
    valgtPynt = "";
    valgtPyntId = null;
    pyntOmradeValgt = null;
    tegn();
    return;
  }
  if (knapp.dataset.pyntFjern) {
    const ut = utfor(lagret, { slag: "pynt-fjern", id: knapp.dataset.pyntFjern });
    lagret = ut.lagret;
    melding = ut.melding;
    valgtPyntId = null;
    lagre();
    tegn();
    return;
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
  if (knapp.dataset.seksjon) {
    const id = knapp.dataset.seksjon as VoksenFane;
    voksenFane = voksenFane === id ? "" : id;
    tegn();
    return;
  }
  if (knapp.dataset.voksen === "apne") {
    apneVoksen(skjerm, "oversikt");
    tegn();
    return;
  }
  if (knapp.dataset.voksen === "ut") {
    const til = voksenFra === "verden" && !lagret.aktivDag ? "meny" : voksenFra;
    lukkVoksen();
    skjerm = til;
    tegn();
    return;
  }
  if (knapp.dataset.import === "velg") {
    importMelding = "";
    document.querySelector<HTMLInputElement>("#import-fil")?.click();
    return;
  }
  if (knapp.dataset.import === "avbryt") {
    importForslag = null;
    tegn();
    return;
  }
  if (knapp.dataset.import === "erstatt" && importForslag) {
    lagret = importForslag;
    importForslag = null;
    importMelding = "";
    lukkVoksen();
    skjerm = lagret.aktivDag ? "verden" : "meny";
    lagre();
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
  if (knapp.dataset.null === "spor") {
    nullSteg = 1;
    tegn();
  }
  if (knapp.dataset.null === "avbryt") {
    nullSteg = 0;
    tegn();
  }
  if (knapp.dataset.null === "ja") {
    const tom = standardLagret();
    lagret = { ...tom, innstillinger: lagret.innstillinger, startet: true, fro: 1 + Math.floor(Math.random() * 900), dato: tilfeldigStart() };
    nullSteg = 0;
    lukkVoksen();
    skjerm = "meny";
    lagre();
    tegn();
  }
  if (knapp.dataset.voksen === "sjekk") {
    const felt = document.querySelector<HTMLInputElement>("#voksen-svar");
    if (Number(felt?.value) === voksen.svar) {
      voksenInne = true;
      voksenFeil = false;
      voksenSist = Date.now();
    } else {
      voksenFeil = true;
      voksen = lagVoksenStykke(voksen.svar + lagret.fro + Date.now() % 97);
    }
    voksenFelt = "";
    tegn();
  }
  if (knapp.dataset.oppdater) {
    statusOppdater = oppdateringTekst("sjekker");
    tegn();
    sistSjekket = Date.now();
    void sjekkRegistrering(swReg, { online: navigator.onLine }).then((utfall) => {
      statusOppdater = oppdateringTekst(utfall);
      if (utfall === "ny") visOppdater = true;
      tegn();
    });
  }
  if (knapp.dataset.last) {
    // Bare denne knappen aktiverer den nye versjonen. Tar den ikke over siden innen to sekunder, laster vi selv.
    void oppdaterSW(true);
    window.setTimeout(() => window.location.reload(), 2000);
  }
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
    // Byen erstattes først når den voksne har sagt ja (gj. 9, B4).
    const inn = importer(tekst);
    importForslag = inn;
    importMelding = inn ? "" : si(spraak(), "Fila kunne ikke leses. Byen er ikke endret.", "Fila kunne ikkje lesast. Byen er ikkje endra.");
    tegn();
  });
});

/** Åpner voksensiden og husker hvor den voksne kom fra. */
function apneVoksen(fra: Skjerm, fane: VoksenFane): void {
  if (skjerm !== "voksen") voksenFra = fra === "voksen" ? "innstillinger" : fra;
  if (voksenInne && Date.now() - voksenSist > VOKSEN_TIDSAVBRUDD) voksenInne = false;
  voksenFane = fane;
  voksenFeil = false;
  voksenFelt = "";
  skjerm = "voksen";
}

/** Låsen lukkes igjen når den voksne går ut av voksensiden. */
function lukkVoksen(): void {
  voksenInne = false;
  voksenFeil = false;
  nullSteg = 0;
  importForslag = null;
  importMelding = "";
}

function gjorBanner(): void {
  window.clearTimeout(bannerTimer);
  if (!melding) return;
  const tekst = melding;
  bannerTimer = window.setTimeout(() => {
    if (melding === tekst) {
      melding = null;
      tegn();
    }
  }, 1500);
}

/** Bare i utviklingsmodus: skjermtesten setter en tilstand og en skjerm uten å laste siden på nytt. */
if (import.meta.env.DEV) {
  (window as unknown as { formbyenTest: unknown }).formbyenTest = {
    sett(ny: Lagret, til?: string, ekstra?: { voksenInne?: boolean; voksenFane?: string; visPlan?: boolean; kveldApne?: boolean; kveldPanel?: "kart" | "avtaler" | "rekkefolge"; nullSteg?: number; valgtPynt?: string; pyntOmrade?: string; valgtPyntId?: string }) {
      lagret = ny;
      valgtPynt = (ekstra?.valgtPynt as VareId | undefined) ?? "";
      pyntOmradeValgt = ekstra?.pyntOmrade ?? null;
      valgtPyntId = ekstra?.valgtPyntId ?? null;
      skjerm = (til as Skjerm | undefined) ?? (lagret.aktivDag ? "verden" : "meny");
      melding = null;
      reaksjon = null;
      visPlan = ekstra?.visPlan ?? false;
      visUr = false;
      valgte = new Set();
      sorter = {};
      valgtVare = "";
      sorterHake = false;
      ristVarer = new Set();
      voksenInne = ekstra?.voksenInne ?? false;
      voksenSist = Date.now();
      voksenFane = (ekstra?.voksenFane as VoksenFane | undefined) ?? "oversikt";
      nullSteg = ekstra?.nullSteg ?? 0;
      kveldPanel = ekstra?.kveldPanel ?? (ekstra?.kveldApne ? "avtaler" : "kart");
      urMelding = null;
      if (skjerm === "ur") startUr();
      svarLase = 0;
      tegn();
    },
    lagret: () => lagret,
    skjerm: () => skjerm,
    urMaal: () => urSteg[urStegNr]?.tid ?? -1,
    settViser(tid: number) {
      pekerTid = tid;
      tegn();
    },
  };
}

window.setInterval(() => {
  if (skjerm === "voksen" && voksenInne && Date.now() - voksenSist > VOKSEN_TIDSAVBRUDD) {
    voksenInne = false;
    tegn();
  }
}, 30_000);

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
