import { registerSW } from "virtual:pwa-register";
import { maalBygg, manglendeDeler } from "./bygg/handleliste";
import { byggSomKanStartes, ledigeTomter, lesRute, ruteNavn } from "./bygg/kart";
import { byggDef } from "./bygg/katalog";
import { celleFor } from "./bygg/landemerker";
import { tegnBygg, tegnFremdrift, tegnKart } from "./grafikk/bygg-svg";
import { delSvg } from "./grafikk/fasade";
import { byggmester, ikon, kjaeledyr } from "./grafikk/figurer";
import { formSvg } from "./grafikk/former-svg";
import { FARGER, type Farge } from "./grafikk/stil";
import { tallPosisjoner, urskive } from "./grafikk/klokke";
import { erForm2d } from "./former/definisjoner";
import { importer, lesLagring, skrivLagring, standardLagret } from "./lagring/lagring";
import { beVarigLagring } from "./pwa/lagring";
import { oppdateringTekst, sjekkForOppdatering } from "./pwa/oppdatering";
import { sporsmalViser, svarViser } from "./oppgaver/visning";
import { anbefalt, gangMinutter, nesteSteg } from "./spill/anbefaling";
import { aktivOppgave, apningTekst, utfor, type Handling } from "./spill/okt";
import { omrissForForm } from "./tegning/omriss";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { visNavn } from "./dag/aktiviteter";
import { fraNb, formNavn, mal, navnBygg, navnVare } from "./tekst/ordbok";
import { manedTekst, si, SPRAAK_NAVN, ukedagTekst } from "./tekst/spraak";
import { himmel, leggTil, tidTilDigital24, tidTilOrd, minutt, timer, klokke } from "./tid/tid";
import { erSpraak, SPRAAK, type ByggId, type Lagret, type Nivaa, type NokkelLager, type Oppgave, type Spraak, type StedId, type Ukedag, type VareId } from "./typer";
import { lagVoksenStykke } from "./voksen";
import { klikk } from "./lyd/lyd";
import "./style.css";

const lager: NokkelLager = {
  getItem: (nokkel) => localStorage.getItem(nokkel),
  setItem: (nokkel, verdi) => localStorage.setItem(nokkel, verdi),
  removeItem: (nokkel) => localStorage.removeItem(nokkel),
};

type Skjerm = "intro" | "velg" | "meny" | "pause" | "dagstart" | "verden" | "kart" | "bygg" | "kveld" | "innstillinger" | "voksen" | "om" | "installer" | "dagbok" | "album" | "ur" | "kurv";

let lagret: Lagret = lesLagring(lager);
let skjerm: Skjerm = lagret.startet ? (lagret.aktivDag ? "verden" : "meny") : "intro";
let melding: string | null = null;
let visPlan = false;
let visUr = false;
let reaksjon: { riktig: boolean; tekst: string } | null = null;
let gar: { sted: StedId; x: number; y: number } | null = null;
let introSide = 0;
let pekerTid = 12 * 60;
let valgte = new Set<string>();
let sorter: Record<string, string> = {};
let valgtVare = "";
let valgtBygg: ByggId | null = null;
let voksen = lagVoksenStykke(lagret.fro);
let voksenInne = false;
let voksenFelt = "";
let visOppdater = false;
let statusOppdater = "";
let bekreftNull = false;
let bekreftAvslutt = false;
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

function erNivaa(verdi: string): verdi is Nivaa {
  return NIVA.includes(verdi as Nivaa);
}

function erUkedag(verdi: string): verdi is Ukedag {
  return UKEDAGER.includes(verdi as Ukedag);
}

type UrVis = "full" | "analog" | "ord" | "digital" | "hud";

function urIndre(tid: number, lite = false, vis: UrVis = "full"): string {
  const tall = tallPosisjoner()
    .filter((pos) => !lite || pos.tall % 3 === 0)
    .map((pos) => `<span class="tall" data-tall="${pos.tall}" style="left:${(pos.x / 240) * 100}%;top:${(pos.y / 240) * 100}%">${pos.tall}</span>`)
    .join("");
  const analog = `<div class="skive">${urskive(tid)}<div class="tall-lag">${tall}</div></div>`;
  const ord = `<p class="ord">${esc(tidTilOrd(tid, spraak()))}</p>`;
  const digital = `<p class="digital">${tidTilDigital24(tid)}</p>`;
  if (vis === "analog") return analog;
  if (vis === "ord") return ord;
  if (vis === "digital") return digital;
  if (vis === "hud") return `${analog}${lagret.innstillinger.skjulDigital ? "" : digital}`;
  return `${analog}${ord}${lagret.innstillinger.skjulDigital ? "" : digital}`;
}

function urHtml(tid: number, lite = false, justerbar = false, vis: UrVis = "full"): string {
  return `<div class="ur ${lite ? "lite" : ""}" ${justerbar ? "data-ur" : ""}>${urIndre(tid, lite, vis)}</div>`;
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
  const ny = aktivOppgave(lagret);
  if (ny && ny.id !== forrigeOppgave) {
    valgte = new Set();
    sorter = {};
    valgtVare = "";
    if (ny.maalKlokke !== undefined) pekerTid = 12 * 60;
  }
  if (handling.slag === "svar" && ut.melding && !lagret.aktivDag?.forklaring) {
    klikk(lagret.innstillinger.lydPa, "riktig");
    reaksjon = { riktig: true, tekst: ut.melding };
    window.setTimeout(() => {
      reaksjon = null;
      tegn();
    }, 1200);
  }
  if (handling.slag === "svar" && lagret.aktivDag?.forklaring) {
    reaksjon = { riktig: false, tekst: lagret.aktivDag.forklaring };
  }
  if (handling.slag === "fortsett" || handling.slag === "start") reaksjon = null;
  if (handling.slag === "steg") klikk(lagret.innstillinger.lydPa, "hammer");
  if (haddeDag && !lagret.aktivDag) skjerm = "kveld";
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
    lagret = { ...lagret, aktivDag: { ...dag, fase, ko: [], forklaring: null } };
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

function fargeFor(id: string): Farge {
  const sum = [...id].reduce((tall, tegn) => tall + tegn.charCodeAt(0), 0);
  return DELFARGE[sum % DELFARGE.length] ?? FARGER.tre;
}

function oppgaveBilde(oppgave: Oppgave): string {
  if (oppgave.type === "still-klokka" && oppgave.maalKlokke !== undefined) {
    const vis = sporsmalViser(oppgave);
    const maal = vis === "digital" ? tidTilDigital24(oppgave.maalKlokke) : tidTilOrd(oppgave.maalKlokke, spraak());
    return `<p class="klokkemal">${esc(maal)}</p>${urHtml(pekerTid, false, true, "analog")}
      <div class="rad">
        <button type="button" data-time="-1" aria-label="${si(spraak(), "time minus", "time minus")}">time −</button>
        <button type="button" data-time="1" aria-label="${si(spraak(), "time pluss", "time pluss")}">time +</button>
        <button type="button" data-minutt="-${minuttSteg()}">${minuttSteg()} −</button>
        <button type="button" data-minutt="${minuttSteg()}">${minuttSteg()} +</button>
      </div>
      <button type="button" class="hoved" data-svar="${pekerTid}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
  }
  if (oppgave.type === "hvem-passer-ikke") return "";
  if (oppgave.type === "lengde" && oppgave.tall !== undefined) return plankeBilde(oppgave.tall);
  if (oppgave.type === "masse" || oppgave.type === "likevekt") return sekkBilde(oppgave.type === "likevekt");
  if (oppgave.type === "areal") return "";
  if (oppgave.koordinat) return koordinatBilde(oppgave.koordinat);
  if (oppgave.type === "ukeplan" || oppgave.type === "kalender") return ukeBilde();
  if (oppgave.monster) {
    return `<div class="monster">${oppgave.monster.map((form, indeks) => formSvg(form, 56, -Math.PI / 2, DELFARGE[indeks % DELFARGE.length])).join("")}<span class="plass">?</span></div>`;
  }
  if (oppgave.varer) {
    const malform = oppgave.type === "finn-formen" && oppgave.form ? `<div class="malform">${formSvg(oppgave.form, 88)}<p>${si(spraak(), "Fargen betyr ikke noe. Se på formen.", "Fargen betyr ikkje noko. Sjå på forma.")}</p></div>` : "";
    return `${malform}<div class="valg">${oppgave.varer
      .map((vare) => {
        const merket = valgte.has(vare.id) || sorter[vare.id];
        return `<button type="button" data-vare="${esc(vare.id)}" class="${merket ? "valgt" : ""}" aria-pressed="${merket ? "true" : "false"}">${formSvg(vare.form, 72, -Math.PI / 2, fargeFor(vare.id + vare.form))}</button>`;
      })
      .join("")}</div>${
      oppgave.kasser
        ? `<div class="rad">${oppgave.kasser.map((kasse) => `<button type="button" data-kasse="${esc(kasse.id)}">${esc(kasse.tekst)}</button>`).join("")}</div>`
        : `<button type="button" class="hoved" data-svar="${[...valgte].sort().join(",")}">${si(spraak(), "Ferdig", "Ferdig")}</button>`
    }`;
  }
  if (oppgave.type === "tegn" && oppgave.form) {
    return `${formSvg(oppgave.form, 72)}<div class="lerret-boks"><canvas id="spokelse" width="240" height="240"></canvas><canvas id="lerret" width="240" height="240"></canvas></div>
      <div class="rad"><button type="button" data-tom="1">${si(spraak(), "Tøm", "Tøm")}</button>
      <button type="button" class="hoved" data-tegn="${esc(oppgave.form)}">${si(spraak(), "Ferdig", "Ferdig")}</button></div>`;
  }
  if ((oppgave.type === "hvor-lenge" || oppgave.type === "rekker-jeg" || oppgave.type === "apningstider") && oppgave.maalKlokke !== undefined && oppgave.tall !== undefined) {
    const venstre = oppgave.type === "hvor-lenge" ? si(spraak(), "Fra", "Frå") : oppgave.type === "apningstider" ? si(spraak(), "Åpner", "Opnar") : si(spraak(), "Nå", "No");
    const hoyre = oppgave.type === "apningstider" ? si(spraak(), "Stenger", "Stengjer") : si(spraak(), "Til", "Til");
    return `<div class="rad"><div>${urHtml(oppgave.maalKlokke, true, false, "analog")}<p class="ord">${venstre}</p></div><div>${urHtml(oppgave.tall, true, false, "analog")}<p class="ord">${hoyre}</p></div></div>`;
  }
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "still-klokka") return urHtml(oppgave.maalKlokke, false, false, sporsmalViser(oppgave) === "full" ? "analog" : sporsmalViser(oppgave));
  if (oppgave.form3d) return formSvg(oppgave.form3d, 120);
  if (oppgave.form) return formSvg(oppgave.form, 120);
  return ikon(ikonFor(oppgave.type));
}

function plankeBilde(tall: number): string {
  const enheter = tall > 12 ? Math.max(2, Math.round(tall / 10)) : tall;
  const b = 16 + enheter * 28;
  const biter = Array.from({ length: enheter }, (_, i) => `<rect x="${8 + i * 28}" y="10" width="24" height="18" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`).join("");
  return `<svg viewBox="0 0 ${b} 40" width="${b}" height="40">${biter}</svg>`;
}

function sekkBilde(vekt: boolean): string {
  const liten = `<ellipse cx="18" cy="28" rx="10" ry="8" fill="${FARGER.mur}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  const stor = `<ellipse cx="58" cy="24" rx="16" ry="14" fill="${FARGER.tre}" stroke="${FARGER.kontur}" stroke-width="2"/>`;
  return `<svg viewBox="0 0 80 44" width="160" height="88">${vekt ? `${liten}${stor}` : stor}</svg>`;
}

function koordinatBilde(kode: string): string {
  const punkt = lesRute(kode);
  const cell = 26;
  const n = 6;
  let celler = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const merket = punkt?.x === x && punkt.y === y;
      celler += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${merket ? FARGER.aksentGul : FARGER.gress}" stroke="${FARGER.kontur}"/>`;
    }
  }
  return `<svg viewBox="0 0 ${n * cell} ${n * cell}" width="156" height="156">${celler}</svg>`;
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
            ? urHtml(valg.klokke, true, false, "analog")
            : vis === "digital" && valg.klokke !== undefined
              ? ""
              : valg.form
                ? formSvg(valg.form, 72, -Math.PI / 2, fargeFor(valg.id + (valg.form ?? "")))
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

function oppgaveHtml(oppgave: Oppgave): string {
  const forklaring = lagret.aktivDag?.forklaring;
  const videre = (lagret.aktivDag?.feil ?? 0) >= 2;
  if (forklaring) {
    const rett = oppgave.valg.find((valg) => valg.id === oppgave.fasit);
    const klokke = oppgave.maalKlokke !== undefined && oppgave.type !== "apningstider" ? urHtml(oppgave.maalKlokke, false, false, "full") : "";
    return `<article class="kort feil"><p>${esc(forklaring)}</p>${klokke}${rett ? `<p class="valgt-svar">${esc(rett.tekst ?? "")}</p>` : ""}${oppgave.form ? formSvg(oppgave.form, 96) : ""}<button type="button" class="hoved" data-handling="fortsett">${videre ? si(spraak(), "Fortsett", "Hald fram") : si(spraak(), "Prøv igjen", "Prøv igjen")}</button></article>`;
  }
  return `<article class="kort" aria-label="${esc(oppgave.prompt)}">
    <div class="rad">${ikon(ikonFor(oppgave.type))}<p>${esc(oppgave.hvem)}</p></div>
    <h2>${esc(oppgave.prompt)}</h2>
    ${oppgaveBilde(oppgave)}
    ${valgHtml(oppgave)}
  </article>`;
}

function delBilde(id: string): string {
  return delSvg(id, 48);
}

function ikonNavn(navn: string): string {
  const tekst = navn.toLowerCase();
  if (tekst.includes("skole") || tekst.includes("skule") || tekst.includes("sfo")) return "skole";
  if (tekst.includes("butikk")) return "butikk";
  if (tekst.includes("tann")) return "tann";
  if (tekst.includes("middag")) return "mat";
  if (tekst.includes("svøm") || tekst.includes("symj") || tekst.includes("svom")) return "svom";
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
  if (dag.plan.sfo) punkter.push({ tid: dag.plan.sfo, navn: si(spraak(), "SFO", "SFO") });
  if (!dag.plan.butikk.stengtHele) {
    punkter.push({
      tid: dag.plan.butikk.apner,
      navn: si(spraak(), "Butikken", "Butikken"),
    });
    if (dag.plan.butikk.stengtFra !== undefined && dag.plan.butikk.stengtTil !== undefined) {
      punkter.push({ tid: dag.plan.butikk.stengtFra, navn: si(spraak(), "Butikken stenger en stund", "Butikken stengjer ei stund") });
      punkter.push({ tid: dag.plan.butikk.stengtTil, navn: si(spraak(), "Butikken åpner igjen", "Butikken opnar att") });
    }
  } else {
    punkter.push({ tid: dag.plan.butikk.apner, navn: si(spraak(), "Butikken er stengt", "Butikken er stengt") });
  }
  for (const avtale of dag.plan.avtaler) punkter.push({ tid: avtale.start, navn: visNavn(avtale.aktivitet ?? avtale.navn, spraak()) });
  punkter.push({ tid: dag.plan.leggetid, navn: si(spraak(), "Leggetid", "Leggetid") });
  punkter.sort((a, b) => a.tid - b.tid);
  return punkter;
}

function stripeHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const punkter = planPunkter();
  const neste = punkter.find((punkt) => punkt.tid >= dag.tid - 15);
  return `<button type="button" class="stripe" data-plan="apne" aria-label="${si(spraak(), "Dagens plan", "Dagens plan")}">${punkter
    .map((punkt) => {
      const klasse = punkt.tid < dag.tid - 15 ? "punkt" : punkt === neste ? "punkt naa" : "punkt kommende";
      return `<span class="${klasse}">${ikon(ikonNavn(punkt.navn))}<span class="tid">${tidTilDigital24(punkt.tid)}</span></span>`;
    })
    .join("")}</button>`;
}

function planHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  return `<div class="tidslinje">${planPunkter()
    .map((punkt) => `<div class="tidspunkt">${urHtml(punkt.tid, true)}<p>${esc(punkt.navn)} ${tidTilDigital24(punkt.tid)}</p></div>`)
    .join("")}</div><button type="button" class="hoved" data-plan="lukk">${si(spraak(), "Lukk", "Lukk")}</button>`;
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
  })}</div>`;
}

function sceneHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const tilbake = `<button type="button" data-ute="1">${si(spraak(), "← Byen", "← Byen")}</button>`;
  if (dag.sted === "butikk") {
    const rader = handlelisteRader();
    return `${tilbake}<section class="scene"><h1>${si(spraak(), "Butikken", "Butikken")}</h1><p>${esc(apningTekst(lagret))}</p><div class="hyller">${rader
      .map((rad) => `<div class="kurv-rad${rad.har ? " har" : ""}">${delBilde(rad.vare)}<p>${rad.har ? "✓ " : ""}${esc(navnVare(rad.vare, spraak()))}</p></div>`)
      .join("")}</div><div class="ekspeditor">${byggmester(1)}</div></section>`;
  }
  if (dag.sted === "hjemme") {
    const middag = dag.plan.avtaler.find((avtale) => avtale.slag === "middag");
    const spiser = middag !== undefined && !dag.besokt.includes(middag.id) && !dag.forSent.includes(middag.id) && dag.tid >= middag.start - 30 && dag.tid <= middag.start;
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
  if (!dag || aktivOppgave(lagret) || visPlan) return "";
  const steg = nesteSteg(lagret);
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
  if (valg.slag === "legg") return `<button type="button" class="hoved" data-handling="avslutt">${tekst}</button>`;
  return "";
}

function verdenHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const oppgave = aktivOppgave(lagret);
  const klokkeOppgave = oppgave !== null && ["les-klokka", "still-klokka", "hvor-lenge", "rekker-jeg", "koble", "apningstider"].includes(oppgave.type);
  const antall = Object.values(lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0);
  const viserScene = !gar && dag.fase !== "ute" && !oppgave;
  return `<div class="verden"><header class="hud"><button type="button" data-skjerm="pause" aria-label="${si(spraak(), "Pause", "Pause")}">≡</button><button type="button" data-skjerm="kurv" aria-label="${si(spraak(), "Kurven", "Korga")}">${ikon("kurv")}<span>${antall}</span></button><span class="mynt" aria-label="${si(spraak(), "Mynter", "Myntar")}">${lagret.mynter}</span>${klokkeOppgave ? "" : `<button type="button" class="klokke" data-klokke="1" aria-label="${esc(tidTilOrd(dag.tid, spraak()))}">${urHtml(dag.tid, true, false, "hud")}</button>`}</header>
    ${stripeHtml()}
    ${reaksjon ? `<article class="reaksjon ${reaksjon.riktig ? "riktig" : "feil"}"><p>${esc(reaksjon.tekst)}</p></article>` : ""}
    ${visPlan ? planHtml() : oppgave || reaksjon ? "" : viserScene ? sceneHtml() : bybilde()}
    ${visUr && !oppgave ? urHtml(dag.tid) : ""}
    ${oppgave ? oppgaveHtml(oppgave) : ""}
    <div class="verden-bunn"><div class="boble">${kjaeledyr(lagret.innstillinger.kjaeledyr)}<p>${esc(raad())}</p></div>
    ${enHandling()}</div></div>`;
}

function kartHtml(): string {
  const kan = byggSomKanStartes(lagret.by);
  const tomter = valgtBygg ? ledigeTomter(lagret.by, valgtBygg).slice(0, 8) : [];
  const vinkel = lagret.by.rotasjon * 90;
  return `<button type="button" data-skjerm="verden">${si(spraak(), "Tilbake", "Tilbake")}</button>
    <h1>${si(spraak(), "Byen", "Byen")}</h1>
    <div class="kart-bilde"><div style="transform:translate(${lagret.by.panX}px, ${lagret.by.panY}px) rotate(${vinkel}deg) scale(${lagret.by.skala})">${tegnKart(lagret.by, lagret.aktivDag?.tid ?? 15 * 60, lagret.aktivDag?.plan.leggetid ?? 20 * 60)}</div></div>
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

function fremdriftTekst(): string {
  const maal = maalBygg(lagret);
  const nivaa = String(lagret.by.nivaa);
  if (!maal) return mal(spraak(), "Bynivå {nivaa}.", "Bynivå {nivaa}.", { nivaa });
  return mal(spraak(), "Bynivå {nivaa}. Du bygger {bygg}.", "Bynivå {nivaa}. Du byggjer {bygg}.", { nivaa, bygg: byggNavn(maal.id).toLowerCase() });
}

function dagstartHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return menyHtml();
  const uke = ukedagTekst(spraak(), dag.plan.ukedag);
  const ukedag = uke.charAt(0).toUpperCase() + uke.slice(1);
  const maned = manedTekst(spraak(), MANED_ID[dag.plan.dato.maned - 1] ?? "januar");
  const ord = lagret.innstillinger.nivaa === "forste";
  const maal = maalBygg(lagret);
  const grupper = grupperteDeler();
  return `<div class="dagstart">
    <p class="dato">${esc(ukedag)} ${dag.plan.dato.dag}. ${esc(maned)}</p>
    <h1>${si(spraak(), "Dagens plan", "Dagens plan")}</h1>
    <div class="dagliste">${planPunkter()
      .map((punkt) => `<div class="dagrad">${ikon(ikonNavn(punkt.navn))}<div class="dagtid">${urHtml(punkt.tid, true, false, "analog")}<span>${tidTilDigital24(punkt.tid)}</span>${ord ? `<span class="ord">${esc(tidTilOrd(punkt.tid, spraak()))}</span>` : ""}</div><p>${esc(punkt.navn)}</p></div>`)
      .join("")}</div>
    ${maal ? `<h2>${esc(byggNavn(maal.id))}</h2>${tegnBygg(maal.id, false)}${grupper.map((rad) => `<p>${esc(mal(spraak(), "{bygg} trenger {mengde}.", "{bygg} treng {mengde}.", { bygg: byggNavn(maal.id), mengde: vareMengde(rad.vare, rad.antall) }))}</p><div class="delrad"><span class="${rad.har === rad.antall ? "har" : ""}">${delBilde(rad.vare)} ${rad.antall}${rad.har ? ` <span>${si(spraak(), "har", "har")}</span>` : ""}</span></div>`).join("")}` : ""}
    <button type="button" class="hoved" data-handling="start-ettermiddag">${si(spraak(), "Start ettermiddagen", "Start ettermiddagen")}</button>
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

function vareMengde(id: VareId, antall: number): string {
  const en = navnVare(id, spraak()).toLowerCase();
  if (antall === 1) return en;
  const flertall: Record<string, string> = {
    planke: spraak() === "nn" ? "plankar" : "planker",
    "kloss-sylinder": spraak() === "nn" ? "sylindrar" : "sylindere",
    sylinder: spraak() === "nn" ? "sylindrar" : "sylindere",
  };
  return `${antall} ${flertall[id] ?? `${en}`}`;
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
    tegnKart(lagret.by, 16 * 60),
    urHtml(14 * 60 + 30),
  ];
  const figur = introSide === 0
    ? `<h2>${si(spraak(), "Velg figur", "Vel figur")}</h2><div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${lagret.innstillinger.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div><h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2><div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "valgt" : ""}">${kjaeledyr(dyr)}</button>`).join("")}</div>`
    : "";
  return `<div class="forside"><h1>Formbyen</h1>${bilder[introSide] ?? ""}<p>${esc(sider[introSide] ?? "")}</p>${figur}
    <button type="button" class="hoved" data-intro="neste">${introSide >= 3 ? si(spraak(), "Spill", "Spel") : si(spraak(), "Neste", "Neste")}</button>
    <button type="button" data-intro="hopp">${si(spraak(), "Hopp over", "Hopp over")}</button></div>`;
}

function pauseHtml(): string {
  return `<h1>${si(spraak(), "Pause", "Pause")}</h1>
    <div class="liste">
      <button type="button" class="hoved" data-skjerm="verden">${si(spraak(), "Fortsett", "Hald fram")}</button>
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
      ${
        bekreftAvslutt
          ? `<p>${si(spraak(), "Avslutte dagen nå?", "Avslutte dagen no?")}</p><button type="button" class="hoved" data-handling="avslutt">${si(spraak(), "Ja, avslutt", "Ja, avslutt")}</button>`
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
      .map((dyr) => `<button type="button" data-dyr="${dyr}" class="${lagret.innstillinger.kjaeledyr === dyr ? "riktig" : ""}" aria-label="${dyr}">${kjaeledyr(dyr)}</button>`)
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
  return `<button type="button" data-skjerm="${tilbake}">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Innstillinger", "Innstillingar")}</h1>
    <h2>${si(spraak(), "Velg figur", "Vel figur")}</h2>
    <div class="figurer">${[0, 1, 2, 3].map((variant) => `<button type="button" data-figur="${variant}" class="${inn.figur === variant ? "valgt" : ""}" aria-label="${si(spraak(), "Byggmester", "Byggmeister")} ${variant + 1}">${byggmester(variant)}</button>`).join("")}</div>
    <h2>${si(spraak(), "Velg kjæledyr", "Vel kjæledyr")}</h2>
    <div class="figurer">${(["hund", "katt", "kanin"] as const).map((dyr) => `<button type="button" data-dyr="${dyr}" class="${inn.kjaeledyr === dyr ? "valgt" : ""}" aria-label="${dyr}">${kjaeledyr(dyr)}</button>`).join("")}</div>
    <button type="button" data-intro="se">${si(spraak(), "Se introduksjonen", "Sjå introduksjonen")}</button>
    <h2>${si(spraak(), "Nivå", "Nivå")}</h2>
    <div class="liste">${niva.map((id) => `<button type="button" data-nivaa="${id}" class="nivaa-kort ${inn.nivaa === id ? "valgt" : ""}"><strong>${si(spraak(), navn[id][0], navn[id][1])}</strong><span>${si(spraak(), linje[id][0], linje[id][1])}</span></button>`).join("")}</div>
    <h2>${si(spraak(), "Lyd og visning", "Lyd og vising")}</h2>
    <div class="rad">
      <button type="button" class="bryter" data-lyd="1" aria-pressed="${inn.lydPa ? "true" : "false"}"><span>${si(spraak(), "Lyd", "Lyd")}</span><span>${inn.lydPa ? si(spraak(), "Lyd på", "Lyd på") : si(spraak(), "Lyd av", "Lyd av")}</span></button>
      <button type="button" class="bryter" data-digital="1" aria-pressed="${inn.skjulDigital ? "false" : "true"}"><span>${si(spraak(), "Digital klokke", "Digital klokke")}</span><span>${inn.skjulDigital ? si(spraak(), "Klokke av", "Klokke av") : si(spraak(), "Klokke på", "Klokke på")}</span></button>
    </div>
    <h2>${si(spraak(), "Språk", "Språk")}</h2>
    <select id="spraak" class="spraak">${SPRAAK.map((kode) => `<option value="${kode}" ${inn.spraak === kode ? "selected" : ""}>${SPRAAK_NAVN[kode]}</option>`).join("")}</select>
    <h2>${si(spraak(), "For voksne", "For vaksne")}</h2>
    <button type="button" data-skjerm="voksen">${si(spraak(), "Kompetansemål", "Kompetansemål")}</button>
    <h2>${si(spraak(), "Om appen", "Om appen")}</h2>
    <p>${si(spraak(), "Etter første besøk kan du spille uten nett.", "Etter første besøk kan du spele utan nett.")}</p>
    <button type="button" data-oppdater="1">${si(spraak(), "Sjekk for oppdateringer", "Sjekk for oppdateringar")}</button>
    <p>${esc(statusOppdater ? fraNb(spraak(), statusOppdater) : "")}</p>
    <button type="button" data-skjerm="installer">${si(spraak(), "Installer", "Installer")}</button>
    <button type="button" data-skjerm="om">${si(spraak(), "Les mer", "Les meir")}</button>`;
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
  return `<button type="button" data-skjerm="innstillinger">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Mestring", "Mestring")}</h1>
    ${maal
      .map(
        ([tittel, ferdigheter]) =>
          `<section class="kort"><h2>${si(spraak(), tittel, tittel)}</h2>${ferdigheter
            .map((id) => {
              const rad = lagret.mestring[id];
              const riktige = rad?.riktige ?? 0;
              const bredde = Math.min(100, Math.round((riktige / 3) * 100));
              const par = ferdigNavn[id] ?? [id, id];
              return `<p>${si(spraak(), par[0], par[1])}</p><div class="maal"><span style="width:${bredde}%"></span></div>`;
            })
            .join("")}</section>`,
      )
      .join("")}
    <button type="button" data-tidsrom="1" class="${lagret.innstillinger.tidsromPa ? "valgt" : ""}">${si(spraak(), "Tidsrom", "Tidsrom")}</button>
    <p>${si(spraak(), "Tidsrom er oppgaver om hvor lenge noe varer.", "Tidsrom er oppgåver om kor lenge noko varer.")}</p>
    <button type="button" data-rekord="1" class="${lagret.innstillinger.rekordlistePa ? "valgt" : ""}">${si(spraak(), "Dagbokliste", "Dagbokliste")}</button>
    <p>${si(spraak(), "Dagboklisten viser alle dager.", "Dagboklista viser alle dagar.")}</p>
    <h2>${si(spraak(), "Faste avtaler", "Faste avtalar")}</h2>
    <div class="rad">
      <select id="fast-aktivitet">${(["lekser", "hund", "tannlege", "svomming", "dans", "fotball", "korps", "piano", "kor", "bibliotek"] as const).map((id) => `<option value="${id}">${esc(visNavn(id, spraak()))}</option>`).join("")}</select>
      <select id="fast-dag">${(["mandag", "tirsdag", "onsdag", "torsdag", "fredag"] as const).map((dag) => `<option value="${dag}">${ukedagTekst(spraak(), dag)}</option>`).join("")}</select>
      <select id="fast-tid">${[15, 16, 16.5, 17, 17.5, 18, 18.5, 19].map((time) => {
        const minutter = Math.round(time * 60);
        return `<option value="${minutter}">${tidTilDigital24(minutter)}</option>`;
      }).join("")}</select>
      <button type="button" data-fast="1">${si(spraak(), "Fest avtale", "Fest avtale")}</button>
    </div>
    ${lagret.innstillinger.fasteAvtaler.map((avtale, indeks) => `<p>${esc(avtale.aktivitet)} ${ukedagTekst(spraak(), avtale.ukedag)} ${tidTilDigital24(avtale.start)} <button type="button" data-fjern="${indeks}">×</button></p>`).join("")}
    <h2>${si(spraak(), "Data", "Data")}</h2>
    <button type="button" data-eksport="1">${si(spraak(), "Eksporter byen", "Eksporter byen")}</button>
    <input id="import-fil" type="file" accept="application/json"/>
    ${bekreftNull ? `<p>${si(spraak(), "Slette byen på denne telefonen?", "Slette byen på denne telefonen?")}</p><button type="button" data-null="ja">${si(spraak(), "Ja, slett", "Ja, slett")}</button>` : `<button type="button" data-null="spor">${si(spraak(), "Nullstill byen", "Nullstill byen")}</button>`}`;
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
      const ekstra = avtale.gjort ? "" : si(spraak(), " – vi kom for sent", " – vi kom for seint");
      return `<p>${merke} ${esc(navn)} ${tidTilDigital24(avtale.start)}${esc(ekstra)}</p>`;
    })
    .join("");
  const stjerne = sist?.stjerne
    ? si(spraak(), "Stjerne: du rakk alt!", "Stjerne: du rakk alt!")
    : si(spraak(), "Ingen stjerne i dag.", "Inga stjerne i dag.");
  const formLinje = former.length
    ? `<p>${esc(si(spraak(), "Ny form i dag:", "Ny form i dag:"))} ${esc(former.map((id) => formNavn(id, spraak())).join(", "))}</p>`
    : "";
  return `<h1>${si(spraak(), "Kvelden kommer", "Kvelden kjem")}</h1>
    <div class="bykart">${tegnKart(lagret.by, 20 * 60)}</div>
    <p>${esc(stjerne)}</p>
    ${linjer}
    <p>${esc(bygget)}</p>
    ${formLinje}
    <button type="button" class="hoved" data-skjerm="meny">${si(spraak(), "God natt", "God natt")}</button>`;
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
    ${liste.map((inn) => `<p>${inn.dato.dag}.${inn.dato.maned} ${inn.stjerne ? "★" : "·"} ${esc(inn.bygget.map((id) => byggNavn(id as ByggId)).join(", "))} ${esc(inn.former.map((id) => formNavn(id, spraak())).join(", "))}</p>`).join("") || `<p>${si(spraak(), "Ingen dager ennå.", "Ingen dagar enno.")}</p>`}
    <button type="button" data-skjerm="album">${si(spraak(), "Fotoalbum", "Fotoalbum")}</button>`;
}

function albumHtml(): string {
  return `<button type="button" data-skjerm="dagbok">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Fotoalbum", "Fotoalbum")}</h1>
    ${lagret.album.map((foto, indeks) => `<article class="kort">${foto.svg}<button type="button" data-del="${indeks}">${si(spraak(), "Del bilde", "Del bilete")}</button></article>`).join("") || `<p>${si(spraak(), "Bildene kommer når byen vokser.", "Bileta kjem når byen veks.")}</p>`}`;
}

function urFriHtml(): string {
  return `<button type="button" data-skjerm="verden">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Tårnuret", "Tårnuret")}</h1>
    ${urHtml(pekerTid, false, true)}
    <div class="rad"><button type="button" data-minutt="-5">−5</button><button type="button" data-minutt="5">+5</button><button type="button" data-time="-1">−</button><button type="button" data-time="1">+</button></div>`;
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
  return "";
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
  const minutter = (Math.round(grader / 30) * 5) % 60;
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
  hoppKlikk = droUr;
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
  let time = timer(pekerTid);
  let minutter = minutt(pekerTid) + minuttDelta;
  time += timeDelta;
  while (minutter < 0) {
    minutter += 60;
    time -= 1;
  }
  while (minutter >= 60) {
    minutter -= 60;
    time += 1;
  }
  if (byttDogn) time += time < 12 ? 12 : -12;
  const steg = minuttSteg();
  pekerTid = klokke(time, Math.round(minutter / steg) * steg);
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
      startGange({ sted: bygg.ferdig ? "aktivitet" : "byggeplass", x: bygg.x, y: bygg.y, instans });
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
  if (knapp.dataset.intro === "neste" && introSide < 3) {
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
      lagret = { ...lagret, aktivDag: { ...lagret.aktivDag, fase: "ute", ko: [], forklaring: null } };
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
  if (handling === "start") gjor({ slag: "start" });
  if (handling === "start-ettermiddag") {
    skjerm = "verden";
    tegn();
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
  if (handling === "handle" || handling === "fortsett" || handling === "steg" || handling === "angre" || handling === "mot" || handling === "spis" || handling === "avslutt") {
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
    const oppgave = aktivOppgave(lagret);
    if (oppgave && oppgave.varer && Object.keys(sorter).length >= oppgave.varer.length) {
      const tekst = Object.entries(sorter)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([vare, kasse]) => `${vare}:${kasse}`)
        .join(",");
      gjor({ slag: "svar", svar: tekst });
    } else tegn();
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
  if (knapp.dataset.pynt) gjor({ slag: "pynt", vare: knapp.dataset.pynt as VareId });
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
    bekreftNull = true;
    tegn();
  }
  if (knapp.dataset.null === "ja") {
    lagret = standardLagret();
    bekreftNull = false;
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
