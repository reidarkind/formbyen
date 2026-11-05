import { describe, expect, it } from "vitest";
import { byggSomKanStartes, kartUtsnitt, ledigeTomter } from "../bygg/kart";
import { byggDef } from "../bygg/katalog";
import { tegnKart } from "../grafikk/bygg-svg";
import { STARTDATO } from "../dag/plan";
import { standardLagret } from "../lagring/lagring";
import { trekkOppgave } from "../oppgaver/lag";
import { froTilfeldig } from "../felles/tilfeldig";
import { erApen } from "../tid/tid";
import type { ByggId, ByTilstand, Lagret, Nivaa, PlassertBygg } from "../typer";
import { anbefalt } from "./anbefaling";
import { utfor } from "./okt";

function medDag(lagret: Lagret, over: Partial<NonNullable<Lagret["aktivDag"]>>): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return { ...lagret, aktivDag: { ...dag, ...over, plan: { ...dag.plan, ...(over.plan ?? {}) } } };
}

function svarEn(lagret: Lagret): Lagret {
  const dag = lagret.aktivDag;
  const oppgave = dag?.ko[dag.aktiv];
  if (!dag || !oppgave) return lagret;
  const etter = utfor(lagret, { slag: "svar", svar: oppgave.fasit });
  if (etter.lagret.aktivDag?.forklaring) return utfor(etter.lagret, { slag: "fortsett" }).lagret;
  return etter.lagret;
}

describe("runde 4", () => {
  it("trekker flere oppgavetyper i butikken, også mønster", () => {
    let lagret = { ...standardLagret(), dato: STARTDATO, kurv: {} };
    lagret.by.bygg.push({ instans: "gjerde-1", bygg: "gjerde", x: 4, y: 4, steg: 0, ferdig: false, uthus: false, frie: [], pynt: [] });
    const typer = new Set<string>();
    lagret = utfor(lagret, { slag: "start" }).lagret;
    const aktiv = lagret.aktivDag;
    if (!aktiv) throw new Error("mangler dag");
    lagret = medDag(lagret, { tid: aktiv.plan.butikk.apner, sted: "butikk", dorLest: true, fase: "handel", valgtInstans: "gjerde-1" });
    for (let kjop = 0; kjop < 16 && lagret.aktivDag; kjop++) {
      lagret = { ...lagret, kurv: {} };
      const startet = utfor(lagret, { slag: "handle" }).lagret;
      const oppgave = startet.aktivDag?.ko[0];
      if (!oppgave) break;
      typer.add(oppgave.type);
      lagret = svarEn(startet);
      if (lagret.aktivDag) lagret = medDag(lagret, { tid: aktiv.plan.butikk.apner });
    }
    expect(typer.size).toBeGreaterThanOrEqual(4);
    expect(typer.has("monster")).toBe(true);
  });

  it("gir tre oppgaver i 1. klasse, og bare den første gir en del", () => {
    let lagret = utfor({ ...standardLagret(), dato: STARTDATO }, { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, { tid: dag.plan.butikk.apner, sted: "butikk", dorLest: true, fase: "handel" });
    const startet = utfor(lagret, { slag: "handle" }).lagret;
    const ko = startet.aktivDag?.ko ?? [];
    expect(ko.length).toBe(3);
    expect(ko[0]?.ovelse).toBeFalsy();
    expect(ko[1]?.ovelse).toBe(true);
    expect(ko[0]?.type).not.toBe(ko[1]?.type);
    const etter = svarEn(startet);
    expect(etter.kurv["kloss-sylinder"]).toBe(1);
    expect(etter.aktivDag?.aktiv).toBe(1);
    let feil = utfor(startet, { slag: "svar", svar: "feil" }).lagret;
    feil = utfor(feil, { slag: "fortsett" }).lagret;
    feil = utfor(feil, { slag: "svar", svar: "feil" }).lagret;
    const slutt = utfor(feil, { slag: "fortsett" }).lagret;
    expect(slutt.aktivDag?.ko).toEqual([]);
    expect(slutt.kurv["kloss-sylinder"] ?? 0).toBe(0);
  });

  it("foreslår bare tomter innenfor kartutsnittet, også når dalen er full", () => {
    const bygg: PlassertBygg[] = [
      { instans: "hjem", bygg: "hus", x: 2, y: 4, steg: 4, ferdig: true, uthus: false, frie: [], pynt: [] },
    ];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (bygg.some((rad) => rad.x === x && rad.y === y)) continue;
        bygg.push({ instans: `f${x}-${y}`, bygg: "bronn", x, y, steg: 3, ferdig: true, uthus: true, frie: [], pynt: [] });
      }
    }
    const by: ByTilstand = {
      ...standardLagret().by,
      nivaa: 3,
      besteKlokkePaRad: 3,
      omrader: ["dalen", "bekken", "asen"],
      bygg,
    };
    const tomter = ledigeTomter(by, "villa");
    const ramme = kartUtsnitt(by);
    expect(tomter.length).toBeGreaterThan(0);
    for (const tomt of tomter) {
      const def = byggDef("villa");
      expect(tomt.x).toBeGreaterThanOrEqual(ramme.x0);
      expect(tomt.y).toBeGreaterThanOrEqual(ramme.y0);
      expect(tomt.x + def.bredde).toBeLessThanOrEqual(ramme.x1);
      expect(tomt.y + def.dybde).toBeLessThanOrEqual(ramme.y1);
    }
  });

  it("flytter tiden når barnet allerede er på torget og butikken er stengt", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    lagret = medDag(lagret, {
      tid: 17 * 60 + 45,
      sted: "torg",
      fase: "ute",
      dorLest: true,
      plan: { avtaler: [], butikk: { apner: 14 * 60, stenger: 17 * 60, stengtHele: false } },
    });
    const valg = anbefalt(lagret);
    expect(valg).not.toEqual({ slag: "gaa", sted: "torg" });
    const forTid = lagret.aktivDag?.tid ?? 0;
    const etter =
      valg.slag === "vent"
        ? utfor(lagret, { slag: "vent" })
        : valg.slag === "gaa"
          ? utfor(lagret, { slag: "ga", sted: valg.sted })
          : utfor(lagret, { slag: "avslutt" });
    const tid = etter.lagret.aktivDag?.tid;
    expect(tid === undefined || tid > forTid).toBe(true);
  });

  it("sier ifra at svaret er riktig og blir i butikken", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, { tid: dag.plan.butikk.apner, sted: "butikk", dorLest: true, fase: "handel" });
    const startet = utfor(lagret, { slag: "handle" });
    const oppgave = startet.lagret.aktivDag?.ko[0];
    if (!oppgave) throw new Error("mangler oppgave");
    const etter = utfor(startet.lagret, { slag: "svar", svar: oppgave.fasit });
    expect(etter.melding ?? "").toMatch(/Riktig/);
    expect(etter.lagret.aktivDag?.sted).toBe("butikk");
    expect(etter.lagret.aktivDag?.fase).not.toBe("ute");
  });

  it("stokker like former, og målformen er delen som kjøpes", () => {
    const fasit = new Set<string>();
    for (let fro = 1; fro < 40; fro++) {
      const oppgave = trekkOppgave({
        tilfeldig: froTilfeldig(fro),
        spraak: "nb",
        nivaa: "forste",
        mestring: {},
        plan: null,
        unngaMal: [],
        unngaNokkel: "",
        type: "finn-formen",
        hylle: "kloss",
        maalForm: "sylinder",
      });
      fasit.add(oppgave.fasit);
      expect(oppgave.form).toBe("sylinder");
      expect(oppgave.varer?.filter((vare) => vare.form === "sylinder").length).toBeGreaterThanOrEqual(2);
    }
    expect(fasit.size).toBeGreaterThan(1);
    expect([...fasit].every((rad) => rad === "f0,f1")).toBe(false);
  });

  it("tegner bygget innenfor rutene sine og setter navn på butikken", () => {
    const kart = tegnKart(standardLagret().by, 15 * 60);
    expect(kart).not.toContain("scale(0.4)");
    expect(kart).toContain("Butikk");
    expect(kart).toContain('class="skilt"');
  });

  it.each(["forste", "andre", "utfordrende"] as Nivaa[])(
    "når slottet på %s",
    (nivaa) => {
      let lagret = { ...standardLagret(), dato: STARTDATO, innstillinger: { ...standardLagret().innstillinger, nivaa } };
      let brukte = 0;
      for (let dag = 0; dag < 80 && !lagret.by.bygg.some((bygg) => bygg.bygg === "slott" && bygg.ferdig); dag++) {
        brukte++;
        lagret = utfor(lagret, { slag: "start" }).lagret;
        lagret = spillDagen(lagret);
        if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      }
      const ferdige = lagret.by.bygg.filter((bygg) => bygg.ferdig).length;
      if (nivaa === "forste") {
        expect(brukte).toBeGreaterThanOrEqual(25);
        expect(brukte).toBeLessThanOrEqual(35);
      }
      if (nivaa === "andre") {
        expect(brukte).toBeGreaterThanOrEqual(20);
        expect(brukte).toBeLessThanOrEqual(25);
      }
      if (nivaa === "utfordrende") expect(brukte).toBeGreaterThanOrEqual(20);
      expect(
        lagret.by.bygg.some((bygg) => bygg.bygg === "slott" && bygg.ferdig),
        `nivå ${lagret.by.nivaa}, ferdige ${ferdige}, mønster ${lagret.by.monsterFullfort}, klokke ${lagret.by.besteKlokkePaRad}, former ${lagret.by.kjente3d.join(",")}, stjerner ${lagret.by.dagerAlleAvtaler}, kan ${byggSomKanStartes(lagret.by).join(",")}`,
      ).toBe(true);
    },
    20000,
  );
});

function spillDagen(lagret: Lagret): Lagret {
  let forrige = "";
  let likt = 0;
  for (let vakt = 0; vakt < 200 && lagret.aktivDag; vakt++) {
    const dag = lagret.aktivDag;
    const fremdrift = lagret.by.bygg.reduce((sum, bygg) => sum + bygg.steg, 0);
    const kurv = Object.values(lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0);
    const nokkel = `${dag.tid}:${dag.sted}:${dag.fase}:${dag.aktiv}:${dag.ko.length}:${lagret.by.bygg.length}:${fremdrift}:${kurv}`;
    likt = nokkel === forrige ? likt + 1 : 0;
    forrige = nokkel;
    if (likt > 2) break;
    if (dag.ko.length > 0 && dag.fase !== "ute") {
      lagret = svarEn(lagret);
      continue;
    }
    const valg = anbefalt(lagret);
    if (valg.slag === "gaa") {
      if (valg.sted === dag.sted) break;
      const gikk = utfor(lagret, { slag: "ga", sted: valg.sted });
      lagret = gikk.lagret;
      continue;
    }
    if (valg.slag === "vent") {
      lagret = utfor(lagret, { slag: "vent" }).lagret;
      continue;
    }
    if (valg.slag === "bygg") {
      lagret = byggEtt(lagret, valg.bygg, valg.instans);
      continue;
    }
    if (valg.slag === "handle" || valg.slag === "mot" || valg.slag === "spis") {
      lagret = utfor(lagret, { slag: valg.slag }).lagret;
      continue;
    }
    if (valg.slag === "legg") {
      lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      continue;
    }
    if (valg.slag === "klokke") {
      lagret = utfor(lagret, { slag: "klokke" }).lagret;
      continue;
    }
    break;
  }
  return lagret;
}

function byggEtt(lagret: Lagret, id: ByggId, instans: string | null): Lagret {
  if (!lagret.aktivDag) return lagret;
  if (!instans) {
    const tomt = ledigeTomter(lagret.by, id)[0];
    if (!tomt) return lagret;
    if (lagret.aktivDag.sted !== "byggeplass") {
      const gikk = utfor(lagret, { slag: "ga", sted: "byggeplass" }).lagret;
      if (!gikk.aktivDag) return gikk;
      lagret = gikk;
    }
    return utfor(lagret, { slag: "velg-bygg", bygg: id, x: tomt.x, y: tomt.y }).lagret;
  }
  const valgt = utfor(lagret, { slag: "velg", instans });
  const naa = valgt.lagret.by.bygg.find((bygg) => bygg.instans === instans);
  const trinn = naa ? byggDef(id).oppskrift[naa.steg] : undefined;
  if (!trinn || (valgt.lagret.kurv[trinn.vare] ?? 0) < 1) return valgt.lagret;
  return utfor(valgt.lagret, { slag: "steg" }).lagret;
}
