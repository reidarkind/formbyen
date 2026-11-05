import { registerSW } from "virtual:pwa-register";
import { byggSomKanStartes, ledigeTomter, ruteNavn } from "./bygg/kart";
import { byggDef } from "./bygg/katalog";
import { tegnBygg, tegnKart } from "./grafikk/bygg-svg";
import { byggmester, ikon, kjaeledyr } from "./grafikk/figurer";
import { formSvg } from "./grafikk/former-svg";
import { tallPosisjoner, urskive } from "./grafikk/klokke";
import { erForm2d } from "./former/definisjoner";
import { importer, lesLagring, skrivLagring, standardLagret } from "./lagring/lagring";
import { beVarigLagring } from "./pwa/lagring";
import { oppdateringTekst, sjekkForOppdatering } from "./pwa/oppdatering";
import { aktivOppgave, utfor, type Handling } from "./spill/okt";
import { omrissForForm } from "./tegning/omriss";
import { rasterFraAlpha, vurderTegning } from "./tegning/vurder";
import { visNavn } from "./dag/aktiviteter";
import { fraNb, mal, navnBygg } from "./tekst/ordbok";
import { si, SPRAAK_NAVN, ukedagTekst } from "./tekst/spraak";
import { himmel, tidTilDigital24, tidTilOrd, minutt, timer, klokke } from "./tid/tid";
import { erSpraak, SPRAAK, type ByggId, type Lagret, type Nivaa, type NokkelLager, type Oppgave, type Spraak, type Ukedag, type VareId } from "./typer";
import { lagVoksenStykke } from "./voksen";
import { klikk } from "./lyd/lyd";
import "./style.css";

const lager: NokkelLager = {
  getItem: (nokkel) => localStorage.getItem(nokkel),
  setItem: (nokkel, verdi) => localStorage.setItem(nokkel, verdi),
  removeItem: (nokkel) => localStorage.removeItem(nokkel),
};

type Skjerm = "velg" | "meny" | "verden" | "kart" | "bygg" | "kveld" | "innstillinger" | "voksen" | "om" | "installer" | "dagbok" | "album" | "ur";

let lagret: Lagret = lesLagring(lager);
let skjerm: Skjerm = lagret.startet ? (lagret.aktivDag ? "verden" : "meny") : "velg";
let melding: string | null = null;
let visPlan = false;
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

function urIndre(tid: number): string {
  const tall = tallPosisjoner()
    .map((pos) => `<span class="tall" data-tall="${pos.tall}" style="left:${(pos.x / 240) * 100}%;top:${(pos.y / 240) * 100}%">${pos.tall}</span>`)
    .join("");
  const digital = lagret.innstillinger.skjulDigital ? "" : `<p class="digital">${tidTilDigital24(tid)}</p>`;
  return `<div class="skive">${urskive(tid)}<div class="tall-lag">${tall}</div></div><p class="ord">${esc(tidTilOrd(tid, spraak()))}</p>${digital}`;
}

function urHtml(tid: number, lite = false, justerbar = false): string {
  return `<div class="ur ${lite ? "lite" : ""}" ${justerbar ? "data-ur" : ""}>${urIndre(tid)}</div>`;
}

function skrivPeker(): void {
  const boks = document.querySelector("[data-ur]");
  if (boks) boks.innerHTML = urIndre(pekerTid);
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
  if (handling.slag === "svar" && ut.melding && !lagret.aktivDag?.forklaring) klikk(lagret.innstillinger.lydPa, "riktig");
  if (handling.slag === "steg") klikk(lagret.innstillinger.lydPa, "hammer");
  if (haddeDag && !lagret.aktivDag) skjerm = "kveld";
  if (handling.slag === "start") {
    skjerm = "verden";
    visPlan = true;
  }
  lagre();
  tegn();
}

function oppgaveBilde(oppgave: Oppgave): string {
  if (oppgave.type === "still-klokka" && oppgave.maalKlokke !== undefined) {
    return `<p>${urHtml(oppgave.maalKlokke)}</p>${urHtml(pekerTid, false, true)}
      <div class="rad">
        <button type="button" data-time="-1" aria-label="-1">−</button>
        <button type="button" data-time="1" aria-label="+1">+</button>
        <button type="button" data-minutt="-5">−5</button>
        <button type="button" data-minutt="5">+5</button>
        <button type="button" data-dogn="1">${tidTilDigital24(pekerTid).startsWith("0") || Number(tidTilDigital24(pekerTid).slice(0, 2)) < 12 ? "☀" : "🌙"}</button>
      </div>
      <button type="button" class="hoved" data-svar="${pekerTid}">${si(spraak(), "Slik er klokka", "Slik er klokka")}</button>`;
  }
  if (oppgave.monster) {
    return `<div class="monster">${oppgave.monster.map((form) => formSvg(form, 56)).join("")}</div>`;
  }
  if (oppgave.varer) {
    return `<div class="valg">${oppgave.varer
      .map((vare) => {
        const merket = valgte.has(vare.id) || sorter[vare.id];
        return `<button type="button" data-vare="${esc(vare.id)}" class="${merket ? "riktig" : ""}" aria-pressed="${merket ? "true" : "false"}">${formSvg(vare.form, 72)}</button>`;
      })
      .join("")}</div>${
      oppgave.kasser
        ? `<div class="rad">${oppgave.kasser.map((kasse) => `<button type="button" data-kasse="${esc(kasse.id)}">${esc(kasse.tekst)}</button>`).join("")}</div>`
        : `<button type="button" class="hoved" data-svar="${[...valgte].sort().join(",")}">${si(spraak(), "Ferdig", "Ferdig")}</button>`
    }`;
  }
  if (oppgave.type === "tegn" && oppgave.form) {
    return `<div class="lerret-boks"><canvas id="spokelse" width="240" height="240"></canvas><canvas id="lerret" width="240" height="240"></canvas></div>
      <button type="button" class="hoved" data-tegn="${esc(oppgave.form)}">${si(spraak(), "Ferdig", "Ferdig")}</button>`;
  }
  if ((oppgave.type === "hvor-lenge" || oppgave.type === "rekker-jeg" || oppgave.type === "apningstider") && oppgave.maalKlokke !== undefined && oppgave.tall !== undefined) {
    const venstre = oppgave.type === "hvor-lenge" ? si(spraak(), "Fra", "Frå") : si(spraak(), "Nå", "No");
    const hoyre = oppgave.type === "apningstider" ? si(spraak(), "Åpner", "Opnar") : si(spraak(), "Til", "Til");
    return `<div class="rad"><div>${urHtml(oppgave.maalKlokke, true)}<p class="ord">${venstre}</p></div><div>${urHtml(oppgave.tall, true)}<p class="ord">${hoyre}</p></div></div>`;
  }
  if (oppgave.maalKlokke !== undefined && oppgave.type !== "still-klokka") return urHtml(oppgave.maalKlokke);
  if (oppgave.form) return formSvg(oppgave.form, 120);
  if (oppgave.form3d) return formSvg(oppgave.form3d, 120);
  return ikon(ikonFor(oppgave.type));
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
  const forste = lagret.innstillinger.nivaa === "forste";
  return `<div class="valg">${oppgave.valg
    .map((valg) => {
      const bilde =
        valg.klokke !== undefined
          ? urHtml(valg.klokke, true)
          : valg.form
            ? formSvg(valg.form, 72)
            : valg.tall !== undefined
              ? `<strong>${valg.tall}</strong>`
              : valg.ja === true
                ? ikon("ja")
                : valg.ja === false
                  ? ikon("feil")
                  : "";
      const tekst = forste && bilde ? "" : esc(valg.tekst ?? valg.id);
      return `<button type="button" data-svar="${esc(valg.id)}" aria-label="${esc(valg.tekst ?? valg.id)}">${bilde}${tekst}</button>`;
    })
    .join("")}</div>`;
}

function oppgaveHtml(oppgave: Oppgave): string {
  const demo = lagret.demoSett.includes(oppgave.type)
    ? ""
    : `<div class="banner"><p>${ikon(ikonFor(oppgave.type))} ${si(spraak(), "Slik gjør du det.", "Slik gjer du det.")}</p><button type="button" data-demo="${esc(oppgave.type)}">OK</button></div>`;
  const forklaring = lagret.aktivDag?.forklaring;
  if (forklaring) {
    return `${demo}<article class="kort"><div class="rad">${ikon(ikonFor(oppgave.type))}${kjaeledyr(lagret.innstillinger.kjaeledyr)}</div><p>${esc(forklaring)}</p>${oppgave.maalKlokke !== undefined ? urHtml(oppgave.maalKlokke) : ""}${oppgave.form ? formSvg(oppgave.form, 96) : ""}<button type="button" class="hoved" data-handling="fortsett">${si(spraak(), "Prøv igjen", "Prøv igjen")}</button></article>`;
  }
  return `${demo}<article class="kort" aria-label="${esc(oppgave.prompt)}">
    <div class="rad">${ikon(ikonFor(oppgave.type))}<p>${esc(oppgave.hvem)}</p></div>
    <h2>${esc(oppgave.prompt)}</h2>
    ${oppgaveBilde(oppgave)}
    ${valgHtml(oppgave)}
  </article>`;
}

function planHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const punkter: { tid: number; navn: string }[] = [];
  if (dag.plan.skoleslutt !== null) {
    punkter.push({
      tid: dag.plan.skoleslutt,
      navn: dag.plan.sisteTime
        ? mal(spraak(), "Skolen slutter etter {fag}", "Skulen sluttar etter {fag}", { fag: dag.plan.sisteTime })
        : si(spraak(), "Skolen slutter", "Skulen sluttar"),
    });
  }
  punkter.push({
    tid: dag.plan.butikk.apner,
    navn: dag.plan.butikk.stengtHele
      ? si(spraak(), "Butikken er stengt", "Butikken er stengt")
      : mal(spraak(), "Butikk {fra}–{til}", "Butikk {fra}–{til}", {
          fra: tidTilDigital24(dag.plan.butikk.apner),
          til: tidTilDigital24(dag.plan.butikk.stenger),
        }),
  });
  for (const avtale of dag.plan.avtaler) punkter.push({ tid: avtale.start, navn: avtale.navn });
  punkter.push({ tid: dag.plan.leggetid, navn: si(spraak(), "Leggetid", "Leggetid") });
  return `<div class="tidslinje">${punkter
    .map((punkt) => `<div class="tidspunkt">${urHtml(punkt.tid, true)}<p>${esc(punkt.navn)}</p></div>`)
    .join("")}</div><button type="button" class="hoved" data-plan="lukk">${si(spraak(), "Start ettermiddagen", "Start ettermiddagen")}</button>`;
}

function verdenHtml(): string {
  const dag = lagret.aktivDag;
  if (!dag) return "";
  const oppgave = aktivOppgave(lagret);
  const boble = melding ?? dag.melding;
  return `<header class="hud"><button type="button" data-skjerm="meny">${si(spraak(), "Meny", "Meny")}</button><span>${lagret.mynter} ●</span><span>${Object.values(lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0)}</span></header>
    ${urHtml(dag.tid)}
    ${boble ? `<div class="boble">${kjaeledyr(lagret.innstillinger.kjaeledyr)}<p>${esc(boble)}</p></div>` : `<div class="boble">${kjaeledyr(lagret.innstillinger.kjaeledyr)}</div>`}
    ${visPlan ? planHtml() : ""}
    ${oppgave ? oppgaveHtml(oppgave) : ""}
    ${
      visPlan || oppgave
        ? ""
        : `<div class="handlinger">
        <button type="button" data-ga="hjemme">${si(spraak(), "Hjemme", "Heime")}</button>
        <button type="button" data-ga="butikk">${si(spraak(), "Butikken", "Butikken")}</button>
        <button type="button" data-ga="torg">${si(spraak(), "Torget", "Torget")}</button>
        <button type="button" data-skjerm="kart">${si(spraak(), "Byen", "Byen")}</button>
        <button type="button" data-handling="vent">${si(spraak(), "Vent", "Vent")}</button>
        ${dag.sted === "butikk" ? `<button type="button" class="hoved" data-handling="handle">${dag.dorLest ? si(spraak(), "Handle", "Handle") : si(spraak(), "Se døra", "Sjå døra")}</button>` : ""}
        ${dag.sted === "torg" ? `<button type="button" data-skjerm="ur">${si(spraak(), "Still uret", "Still uret")}</button>` : ""}
        <button type="button" data-handling="mot">${si(spraak(), "Møt opp", "Møt opp")}</button>
        <button type="button" data-handling="avslutt">${si(spraak(), "Legg deg", "Legg deg")}</button>
      </div>`
    }`;
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
    ${tegnBygg(plassert.bygg, (lagret.aktivDag?.tid ?? 0) >= 18 * 60)}
    <ol>${def.oppskrift
      .map((rad, indeks) => `<li>${indeks < plassert.steg ? "✓ " : indeks === plassert.steg ? "→ " : ""}${esc(fraNb(spraak(), rad.nb, rad.nn))}</li>`)
      .join("")}</ol>
    <p>${esc(tekst)}</p>
    ${steg ? `<button type="button" class="hoved" data-handling="steg">${si(spraak(), "Bygg steget", "Bygg steget")}</button>` : ""}
    <button type="button" data-handling="angre">${si(spraak(), "Angre", "Angre")}</button>
    <div class="rad">${(["pynt-blomst", "pynt-flagg", "pynt-benk", "pynt-lykt"] as VareId[])
      .map((vare) => `<button type="button" data-pynt="${vare}">${vare.replace("pynt-", "")}</button>`)
      .join("")}</div>`;
}

function menyHtml(): string {
  const nivaa = lagret.by.nivaa;
  return `<p>${si(spraak(), "Formbyen", "Formbyen")}</p><h1>${si(spraak(), "Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka.")}</h1>
    ${byggmester(lagret.innstillinger.figur)}
    <p>${mal(spraak(), "Nivå {n}", "Nivå {n}", { n: String(nivaa) })}</p>
    <div class="liste">
      <button type="button" class="hoved" data-handling="${lagret.aktivDag ? "fortsett-dag" : "start"}">${lagret.aktivDag ? si(spraak(), "Fortsett dagen", "Hald fram") : si(spraak(), "Ny ettermiddag", "Ny ettermiddag")}</button>
      <button type="button" data-skjerm="dagbok">${si(spraak(), "Dagboka", "Dagboka")}</button>
      <button type="button" data-skjerm="innstillinger">${si(spraak(), "Innstillinger", "Innstillingar")}</button>
      <button type="button" data-skjerm="installer">${si(spraak(), "Installer", "Installer")}</button>
      <button type="button" data-skjerm="om">${si(spraak(), "Om appen", "Om appen")}</button>
      <button type="button" data-skjerm="voksen">${si(spraak(), "Voksen", "Vaksen")}</button>
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
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Innstillinger", "Innstillingar")}</h1>
    <div class="rad">${niva.map((id) => `<button type="button" data-nivaa="${id}" class="${inn.nivaa === id ? "riktig" : ""}">${si(spraak(), navn[id][0], navn[id][1])}</button>`).join("")}</div>
    <div class="rad">${SPRAAK.map((kode) => `<button type="button" data-spraak="${kode}" class="${inn.spraak === kode ? "riktig" : ""}">${SPRAAK_NAVN[kode]}</button>`).join("")}</div>
    <button type="button" data-lyd="1">${inn.lydPa ? si(spraak(), "Lyd er på", "Lyden er på") : si(spraak(), "Lyd er av", "Lyden er av")}</button>
    <button type="button" data-digital="1">${inn.skjulDigital ? si(spraak(), "Digital klokke er skjult", "Digital klokke er skjult") : si(spraak(), "Digital klokke vises", "Digital klokke blir vist")}</button>
    <p>${si(spraak(), "Etter første besøk kan du spille uten nett.", "Etter første besøk kan du spele utan nett.")}</p>
    <button type="button" data-oppdater="1">${si(spraak(), "Sjekk for oppdateringer", "Sjekk for oppdateringar")}</button>
    <p>${esc(statusOppdater ? fraNb(spraak(), statusOppdater) : "")}</p>`;
}

function voksenHtml(): string {
  if (!voksenInne) {
    return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "For voksne", "For vaksne")}</h1><p>${esc(voksen.tekst)}</p><input id="voksen-svar" inputmode="numeric" value="${esc(voksenFelt)}"/><button type="button" data-voksen="sjekk">${si(spraak(), "Åpne", "Opne")}</button>`;
  }
  const maal = [
    ["Klokke og kalender", ["hele-timer", "halv", "kvart", "fem-minutter", "digital-24", "tidsrom", "periode", "ukedager", "maneder"]],
    ["Former", ["former-grunn", "former-flere", "sortere", "telle-2d", "tegne", "monster"]],
    ["3D og måling", ["former-3d", "telle-3d", "stempel", "lengde", "masse", "areal", "koordinater", "likevekt"]],
  ] as const;
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Mestring", "Mestring")}</h1>
    ${maal
      .map(
        ([tittel, ferdigheter]) =>
          `<section class="kort"><h2>${si(spraak(), tittel, tittel)}</h2>${ferdigheter
            .map((id) => {
              const rad = lagret.mestring[id];
              const riktige = rad?.riktige ?? 0;
              const forsok = rad?.forsok ?? 0;
              return `<p>${id}: ${riktige}/${forsok}</p>`;
            })
            .join("")}</section>`,
      )
      .join("")}
    <button type="button" data-tidsrom="1">${lagret.innstillinger.tidsromPa ? si(spraak(), "Tidsrom er på", "Tidsrom er på") : si(spraak(), "Tidsrom er av", "Tidsrom er av")}</button>
    <button type="button" data-rekord="1">${lagret.innstillinger.rekordlistePa ? si(spraak(), "Dagbokliste er på", "Dagbokliste er på") : si(spraak(), "Dagbokliste er av", "Dagbokliste er av")}</button>
    <h2>${si(spraak(), "Faste avtaler", "Faste avtalar")}</h2>
    <div class="rad">
      <select id="fast-aktivitet">${(["korps", "fotball", "piano", "hund"] as const).map((id) => `<option value="${id}">${esc(visNavn(id, spraak()))}</option>`).join("")}</select>
      <select id="fast-dag">${(["mandag", "tirsdag", "onsdag", "torsdag", "fredag"] as const).map((dag) => `<option value="${dag}">${ukedagTekst(spraak(), dag)}</option>`).join("")}</select>
      <button type="button" data-fast="1">${si(spraak(), "Fest avtale", "Fest avtale")}</button>
    </div>
    ${lagret.innstillinger.fasteAvtaler.map((avtale, indeks) => `<p>${esc(avtale.aktivitet)} ${ukedagTekst(spraak(), avtale.ukedag)} ${tidTilDigital24(avtale.start)} <button type="button" data-fjern="${indeks}">×</button></p>`).join("")}
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

function dagbokHtml(): string {
  const liste = lagret.innstillinger.rekordlistePa ? lagret.dagbok : lagret.dagbok.slice(-7);
  return `<button type="button" data-skjerm="meny">${si(spraak(), "Tilbake", "Tilbake")}</button><h1>${si(spraak(), "Dagboka", "Dagboka")}</h1>
    ${liste.map((inn) => `<p>${inn.dato.dag}.${inn.dato.maned} ${inn.stjerne ? "★" : "·"} ${esc(inn.bygget.join(", "))}</p>`).join("") || `<p>${si(spraak(), "Ingen dager ennå.", "Ingen dagar enno.")}</p>`}
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
    skjerm === "velg"
      ? velgHtml()
      : skjerm === "meny"
        ? menyHtml()
        : skjerm === "verden"
          ? verdenHtml()
          : skjerm === "kart"
            ? kartHtml()
            : skjerm === "bygg"
              ? byggHtml()
              : skjerm === "kveld"
                ? `<h1>${si(spraak(), "Kvelden kommer", "Kvelden kjem")}</h1><p>${esc(melding ?? "")}</p>${tegnKart(lagret.by, 20 * 60)}<button type="button" class="hoved" data-skjerm="meny">${si(spraak(), "Til menyen", "Til menyen")}</button>`
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
  rot.innerHTML = `${visOppdater ? `<div class="banner"><p>${si(spraak(), "Ny versjon.", "Ny versjon.")}</p><button type="button" data-last="1">${si(spraak(), "Åpne på nytt", "Opne på nytt")}</button></div>` : ""}<main class="kort">${innhold}</main>`;
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
  pekerTid = klokke(time, Math.round(minutter / 5) * 5);
  tegn();
}

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
  const knapp = mal.closest("button");
  if (!knapp) return;
  const svar = knapp.dataset.svar;
  const ga = knapp.dataset.ga;
  const handling = knapp.dataset.handling;
  const til = knapp.dataset.skjerm as Skjerm | undefined;
  if (knapp.dataset.time) settPeker(Number(knapp.dataset.time), 0, false);
  if (knapp.dataset.minutt) settPeker(0, Number(knapp.dataset.minutt), false);
  if (knapp.dataset.dogn) settPeker(0, 0, true);
  if (knapp.dataset.plan === "lukk") {
    visPlan = false;
    tegn();
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
    skjerm = til === "verden" && !lagret.aktivDag ? "meny" : til;
    tegn();
  }
  if (ga === "hjemme" || ga === "butikk" || ga === "torg" || ga === "byggeplass" || ga === "aktivitet") gjor({ slag: "ga", sted: ga });
  if (handling === "start") gjor({ slag: "start" });
  if (handling === "fortsett-dag") {
    skjerm = "verden";
    tegn();
  }
  if (handling === "vent" || handling === "handle" || handling === "fortsett" || handling === "steg" || handling === "angre" || handling === "mot" || handling === "avslutt") {
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
      innstillinger: { ...lagret.innstillinger, fasteAvtaler: [...lagret.innstillinger.fasteAvtaler, { aktivitet, ukedag, start: 18 * 60 }] },
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
