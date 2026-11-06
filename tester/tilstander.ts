import { STARTDATO } from "../src/dag/plan";
import { froTilfeldig } from "../src/felles/tilfeldig";
import { standardLagret } from "../src/lagring/lagring";
import { forklaring } from "../src/oppgaver/forklaring";
import { lagFraMal } from "../src/oppgaver/lag";
import { MALER } from "../src/oppgaver/maler";
import { bakerOppgave, gavlOppgave, kasseOppgave, utfor } from "../src/spill/okt";
import { spillDag } from "../src/spill/testbot";
import type { AktivDag, ByTilstand, DagbokInnslag, Lagret, Nivaa, Oppgave, PlassertBygg } from "../src/typer";

export interface Tilstand {
  navn: string;
  lagret: Lagret;
  skjerm?: string;
  ekstra?: { voksenInne?: boolean; voksenFane?: string; visPlan?: boolean; kveldApne?: boolean; kveldPanel?: "kart" | "avtaler" | "rekkefolge"; nullSteg?: number; valgtPynt?: string; pyntOmrade?: string; valgtPyntId?: string };
}

function grunn(nivaa: Nivaa = "forste"): Lagret {
  const g = standardLagret();
  return { ...g, startet: true, fro: 3, dato: STARTDATO, mynter: 9, innstillinger: { ...g.innstillinger, nivaa } };
}

function medDag(lagret: Lagret, over: Partial<AktivDag> = {}): Lagret {
  const startet = utfor(lagret, { slag: "start" }).lagret;
  const dag = startet.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return { ...startet, aktivDag: { ...dag, ...over } };
}

/** En stor by på bynivå 5 med alle bydeler, så hele kartet er 12 × 12. */
function storBy(): ByTilstand {
  const by = standardLagret().by;
  const bygg: PlassertBygg[] = [
    { instans: "hjem", bygg: "villa", x: 2, y: 4, steg: 7, ferdig: true, uthus: false, frie: [], pynt: [] },
    { instans: "b", bygg: "bronn", x: 4, y: 4, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] },
    { instans: "g", bygg: "gjerde", x: 5, y: 5, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] },
    { instans: "s", bygg: "skole", x: 9, y: 5, steg: 2, ferdig: false, uthus: false, frie: [], pynt: [] },
    { instans: "k", bygg: "kirke", x: 2, y: 9, steg: 6, ferdig: true, uthus: false, frie: [], pynt: [] },
  ];
  return { ...by, nivaa: 5, omrader: ["dalen", "bekken", "asen", "havna"], bygg, pynt: [{ id: "pynt-1", vare: "pynt-blomst", plass: "hjem:0", x: 2.16, y: 4.86 }, { id: "pynt-2", vare: "pynt-lykt", plass: "sti:1", x: 1.5, y: 2.6 }] };
}

function langDagbok(antall: number): DagbokInnslag[] {
  return Array.from({ length: antall }, (_, i) => ({
    dato: { aar: 2026, maned: 8, dag: 1 + (i % 28) },
    stjerne: i % 2 === 0,
    stjerner: i % 4,
    oppdrag: i % 3 === 0,
    merknad: "★ Du rakk alt\n☆ 3 av 5 riktige på første forsøk\n☆ Oppdraget ble ikke gjort",
    bygget: i % 2 ? ["bronn"] : ["gjerde", "vedskjul"],
    former: ["sirkel", "trekant", "kule"],
    klokker: [],
    avtaler: [
      { aktivitet: "lekser", start: 15 * 60, gjort: true, ikke: false },
      { aktivitet: "middag", start: 16 * 60, gjort: true, ikke: false },
      { aktivitet: "svomming", start: 17 * 60, gjort: false, ikke: false },
      { aktivitet: "hund", start: 18 * 60, gjort: true, ikke: false },
      { aktivitet: "dans", start: 18 * 60 + 30, gjort: false, ikke: true },
      { aktivitet: "piano", start: 19 * 60, gjort: true, ikke: false },
    ],
  }));
}

function avtaler(): Lagret["innstillinger"]["fasteAvtaler"] {
  return [
    { aktivitet: "svomming", ukedag: "tirsdag", start: 17 * 60 },
    { aktivitet: "korps", ukedag: "onsdag", start: 18 * 60 },
    { aktivitet: "piano", ukedag: "torsdag", start: 16 * 60 + 30 },
    { aktivitet: "dans", ukedag: "mandag", start: 17 * 60 + 30 },
    { aktivitet: "fotball", ukedag: "fredag", start: 15 * 60 },
    { aktivitet: "kor", ukedag: "lordag", start: 12 * 60 },
  ];
}

export function skjermer(): Tilstand[] {
  const ut: Tilstand[] = [];
  const g = grunn();
  ut.push({ navn: "intro", lagret: { ...standardLagret() }, skjerm: "intro" });
  ut.push({ navn: "meny", lagret: g, skjerm: "meny" });
  ut.push({ navn: "meny-stor-by", lagret: { ...g, by: storBy() }, skjerm: "meny" });
  ut.push({ navn: "innstillinger", lagret: g, skjerm: "innstillinger" });
  ut.push({ navn: "voksen-las", lagret: g, skjerm: "voksen" });
  const voksen = { ...g, innstillinger: { ...g.innstillinger, fasteAvtaler: avtaler() }, dagbok: langDagbok(30) };
  let mestring = voksen.mestring;
  for (const fane of ["oversikt", "detalj", "nivaa", "avtaler", "data", "om"]) {
    ut.push({ navn: `voksen-${fane}`, lagret: { ...voksen, mestring }, skjerm: "voksen", ekstra: { voksenInne: true, voksenFane: fane } });
  }
  ut.push({ navn: "voksen-slett", lagret: voksen, skjerm: "voksen", ekstra: { voksenInne: true, voksenFane: "data", nullSteg: 1 } });
  void mestring;
  ut.push({ navn: "dagbok-lang", lagret: { ...voksen, innstillinger: { ...voksen.innstillinger, rekordlistePa: true } }, skjerm: "dagbok" });
  ut.push({ navn: "album", lagret: { ...voksen, album: [{ nivaa: 2, svg: "<svg viewBox='0 0 100 60' width='100' height='60'><rect width='100' height='60' fill='#8CC47A'/></svg>" }] }, skjerm: "album" });
  const dag = medDag({ ...g, kurv: { planke: 2, "kloss-kube": 1, "tak-rodt": 1, "vegg-tre": 3, "vindu-sirkel": 1 } });
  ut.push({ navn: "dagstart", lagret: dag, skjerm: "dagstart" });
  ut.push({ navn: "verden-kart", lagret: dag, skjerm: "verden" });
  ut.push({ navn: "plan", lagret: dag, skjerm: "verden", ekstra: { visPlan: true } });
  ut.push({ navn: "pause", lagret: dag, skjerm: "pause" });
  ut.push({ navn: "kurv", lagret: dag, skjerm: "kurv" });
  const stor = medDag({ ...g, by: storBy(), mynter: 3 });
  ut.push({ navn: "verden-stor-by", lagret: stor, skjerm: "verden" });
  ut.push({ navn: "pyntebu", lagret: stor, skjerm: "pynt" });
  ut.push({ navn: "pyntebu-rik", lagret: { ...stor, mynter: 40 }, skjerm: "pynt" });
  ut.push({ navn: "pynt-kart", lagret: { ...stor, mynter: 40 }, skjerm: "pynt-kart", ekstra: { valgtPynt: "pynt-tre" } });
  ut.push({ navn: "pynt-hage", lagret: { ...stor, mynter: 40 }, skjerm: "pynt-kart", ekstra: { valgtPynt: "pynt-tre", pyntOmrade: "hjem" } });
  ut.push({ navn: "pynt-sti", lagret: { ...stor, mynter: 40 }, skjerm: "pynt-kart", ekstra: { valgtPynt: "pynt-tre", pyntOmrade: "sti-v" } });
  ut.push({ navn: "pynt-flytt", lagret: { ...stor, mynter: 40 }, skjerm: "pynt-kart", ekstra: { pyntOmrade: "hjem", valgtPyntId: "pynt-1" } });
  ut.push({ navn: "tarnur-forste", lagret: dag, skjerm: "ur" });
  ut.push({ navn: "tarnur-utfordrende", lagret: medDag(grunn("utfordrende")), skjerm: "ur" });
  // Dørkortet, avtalekortene, oppdraget og gavlen (gj. 10, 8).
  for (const nivaa of ["forste", "andre", "utfordrende"] as const) {
    const d0 = medDag(grunn(nivaa));
    const a0 = d0.aktivDag;
    if (!a0) continue;
    const vedButikk = { ...d0, aktivDag: { ...a0, sted: "butikk" as const, tid: a0.plan.butikk.stengtHele ? a0.tid : a0.plan.butikk.apner - 30 } };
    ut.push({ navn: `dorkort-${nivaa}`, lagret: utfor(vedButikk, { slag: "dor" }).lagret, skjerm: "verden" });
    const apen = { ...d0, aktivDag: { ...a0, sted: "butikk" as const, tid: a0.plan.butikk.stengtHele ? a0.tid : a0.plan.butikk.apner + 30, plan: { ...a0.plan, butikk: { ...a0.plan.butikk, stengtHele: false } } } };
    ut.push({ navn: `dorkort-apen-${nivaa}`, lagret: utfor(apen, { slag: "dor" }).lagret, skjerm: "verden" });
    ut.push({ navn: `oppdrag-${nivaa}`, lagret: utfor(d0, { slag: "oppdrag" }).lagret, skjerm: "verden" });
    const avtale = a0.plan.avtaler.find((rad) => rad.varighet > 0 && rad.slag !== "middag");
    if (avtale) {
      // Alle fem avtalespørsmålene, ett om gangen.
      for (let runde = 0; runde < 5; runde++) {
        const her = { ...d0, dagbok: Array.from({ length: runde }, () => langDagbok(1)[0]!), aktivDag: { ...a0, tid: avtale.start, sted: (avtale.sted === "hjemme" || avtale.sted === "" ? "hjemme" : avtale.sted) as never, fase: "aktivitet" as const } };
        const mot = utfor(her, { slag: "mot" }).lagret;
        if (mot.aktivDag?.ko.length) ut.push({ navn: `avtale-${nivaa}-${runde}`, lagret: mot, skjerm: "verden" });
      }
    }
    const gavl = gavlOppgave(d0, "tak-rodt");
    ut.push({ navn: `gavl-${nivaa}`, lagret: { ...d0, aktivDag: { ...a0, sted: "butikk", fase: "handel", dorLest: true, ko: [gavl], aktiv: 0, forklaring: null, feil: 0 } }, skjerm: "verden" });
  }
  // Ekstra bygg-valget: brønnen er ferdig i dag, og butikken er åpen.
  const bronn = grunn("andre");
  const ekstraDag = medDag({ ...bronn, by: { ...bronn.by, bygg: [...bronn.by.bygg, { instans: "b", bygg: "bronn", x: 4, y: 4, steg: 3, ferdig: true, uthus: false, frie: [], pynt: [] }] } });
  const ed = ekstraDag.aktivDag;
  if (ed) {
    const apner = ed.plan.butikk.stengtHele ? 14 * 60 : ed.plan.butikk.apner;
    ut.push({
      navn: "ekstra-valg",
      lagret: {
        ...ekstraDag,
        aktivDag: { ...ed, dagensBygg: "bronn", tid: apner, sted: "byggeplass", fase: "aktivitet", valgtInstans: "b", plan: { ...ed.plan, avtaler: [], butikk: { apner, stenger: apner + 180, stengtHele: false } } },
      },
      skjerm: "verden",
    });
    // Butikken er stengt i morgen: kjøp en del til i morgen (gj. 10, 7.1.10).
    const apenPlan = { ...ed.plan, avtaler: [], butikk: { apner, stenger: apner + 180, stengtHele: false } };
    ut.push({
      navn: "forraad-valg",
      lagret: {
        ...ekstraDag,
        aktivDag: { ...ed, dagensBygg: "bronn", tid: apner, sted: "byggeplass", fase: "aktivitet", valgtInstans: "b", plan: apenPlan, morgen: [{ ...apenPlan, butikk: { apner, stenger: apner, stengtHele: true } }] },
      },
      skjerm: "verden",
    });
  }
  // Kvelden med mange avtaler.
  const kveld = spillDag(medDag(g)).lagret;
  ut.push({ navn: "kveld", lagret: { ...kveld, dagbok: [...kveld.dagbok.slice(0, -1), ...langDagbok(1)] }, skjerm: "kveld" });
  ut.push({ navn: "kveld-apen", lagret: { ...kveld, dagbok: [...kveld.dagbok.slice(0, -1), ...langDagbok(1)] }, skjerm: "kveld", ekstra: { kveldApne: true } });
  ut.push({ navn: "kveld-rekkefolge", lagret: { ...kveld, dagbok: [...kveld.dagbok.slice(0, -1), ...langDagbok(1)] }, skjerm: "kveld", ekstra: { kveldPanel: "rekkefolge" } });
  // Skiltet på døra.
  const skilt = medDag(g);
  const sd = skilt.aktivDag;
  if (sd) {
    const lest = utfor({ ...skilt, aktivDag: { ...sd, tid: (sd.plan.butikk.stengtHele ? 14 * 60 : sd.plan.butikk.apner) - 30, sted: "butikk", fase: "handel", dorLest: false } }, { slag: "handle" }).lagret;
    ut.push({ navn: "skilt", lagret: lest, skjerm: "verden" });
  }
  return ut;
}

function nivaaFor(niva: 0 | 1 | 2): Nivaa {
  return niva === 0 ? "forste" : niva === 1 ? "andre" : "utfordrende";
}

/** Hver oppgavemal i butikken, først som oppgave og så som forklaringskort etter ett og to feil. */
export function oppgaver(): Tilstand[] {
  const ut: Tilstand[] = [];
  for (const mal of MALER) {
    const nivaa = nivaaFor(mal.niva);
    const dag = medDag(grunn(nivaa));
    const d = dag.aktivDag;
    if (!d) continue;
    let oppgave: Oppgave;
    try {
      oppgave = lagFraMal(mal, {
        tilfeldig: froTilfeldig(mal.id.length * 7 + 3),
        spraak: "nb",
        nivaa,
        mestring: {},
        plan: d.plan,
        naa: d.tid,
        unngaMal: [],
        unngaNokkel: "",
      });
    } catch {
      continue;
    }
    oppgave = { ...oppgave, kontekst: mal.id.endsWith("-1") ? "Løs oppgaven for å få sylinderen." : undefined, vare: "kloss-sylinder" };
    const ko = [oppgave, { ...oppgave, id: `${oppgave.id}-b` }, { ...oppgave, id: `${oppgave.id}-c` }];
    const iButikken: AktivDag = { ...d, sted: "butikk", fase: "handel", dorLest: true, ko, aktiv: 0, forklaring: null, feil: 0 };
    ut.push({ navn: `oppgave-${mal.id}`, lagret: { ...dag, aktivDag: iButikken }, skjerm: "verden" });
    for (const feil of [1, 2]) {
      const gitt = oppgave.valg.find((valg) => valg.id !== oppgave.fasit)?.id ?? "feil";
      const tekst = forklaring(oppgave, gitt, "nb", feil);
      ut.push({
        navn: `forklaring${feil}-${mal.id}`,
        lagret: { ...dag, aktivDag: { ...iButikken, fase: "forklaring", forklaring: tekst, feil } },
        skjerm: "verden",
      });
    }
  }
  // Bonusoppgavene lages i okt.ts og står ikke i MALER.
  for (const nivaa of ["forste", "andre", "utfordrende"] as const) {
    const dag = medDag(grunn(nivaa), { tid: 14 * 60 + 30 });
    const d = dag.aktivDag;
    if (!d) continue;
    for (const [navn, oppgave] of [
      ["kake", bakerOppgave(dag)],
      ["kasse", kasseOppgave(dag)],
    ] as const) {
      const ko = [oppgave, { ...oppgave, id: `${oppgave.id}-b` }];
      ut.push({ navn: `oppgave-${navn}-${nivaa}`, lagret: { ...dag, aktivDag: { ...d, sted: "butikk", fase: "handel", dorLest: true, ko, aktiv: 0, forklaring: null, feil: 0 } }, skjerm: "verden" });
    }
  }
  return ut;
}
