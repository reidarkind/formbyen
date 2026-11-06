import { describe, expect, it } from "vitest";
import { byggDef } from "../bygg/katalog";
import { ledigeTomter } from "../bygg/kart";
import { formSvg } from "../grafikk/former-svg";
import { tegnFremdrift, tegnKart } from "../grafikk/bygg-svg";
import { FARGER } from "../grafikk/stil";
import { standardLagret } from "../lagring/lagring";
import type { Lagret, PlassertBygg } from "../typer";
import { sporsmalViser, svarViser } from "../oppgaver/visning";
import { anbefalt } from "./anbefaling";
import { utfor } from "./okt";

function medDag(lagret: Lagret, over: Partial<NonNullable<Lagret["aktivDag"]>>): Lagret {
  const dag = lagret.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return { ...lagret, aktivDag: { ...dag, ...over, plan: { ...dag.plan, ...(over.plan ?? {}) } } };
}

function plassert(over: Partial<PlassertBygg> & Pick<PlassertBygg, "instans" | "bygg" | "x" | "y">): PlassertBygg {
  return { steg: 4, ferdig: true, uthus: false, frie: [], pynt: [], ...over };
}

describe("runde 3", () => {
  it("åpner byggeplassen for en uferdig hytte og viser koordinater", () => {
    const lagret = standardLagret();
    lagret.by.bygg.push(plassert({ instans: "hytte-2", bygg: "hytte", x: 0, y: 4, steg: 1, ferdig: false }));
    const kart = tegnKart(lagret.by, 15 * 60, 20 * 60, { figur: { x: 2, y: 4 } });
    expect(kart).toContain('data-sted="bygg:hytte-2"');
    expect(kart.match(/<g data-sted="hjemme"/g)?.length).toBe(1);
    expect(kart).toContain(">A<");
    expect(kart).toContain(">1<");
    expect(kart).not.toContain(FARGER.aksentGul);
  });

  it("bygger hytta ferdig, og rønna blir uthus", () => {
    let lagret = standardLagret();
    lagret = {
      ...lagret,
      by: {
        ...lagret.by,
        bygg: [
          ...lagret.by.bygg,
          plassert({ instans: "bronn-2", bygg: "bronn", x: 4, y: 4, steg: 3 }),
          plassert({ instans: "gjerde-3", bygg: "gjerde", x: 5, y: 5, steg: 3 }),
        ],
      },
    };
    lagret = utfor(lagret, { slag: "start" }).lagret;
    const tomt = ledigeTomter(lagret.by, "hytte")[0];
    if (!tomt) throw new Error("ingen tomt");
    lagret = utfor(lagret, { slag: "velg-bygg", bygg: "hytte", x: tomt.x, y: tomt.y }).lagret;
    const instans = lagret.by.bygg.find((bygg) => bygg.bygg === "hytte")?.instans;
    expect(tegnKart(lagret.by, 15 * 60)).toContain(`data-sted="bygg:${instans}"`);
    for (const trinn of byggDef("hytte").oppskrift) {
      lagret = { ...lagret, kurv: { ...lagret.kurv, [trinn.vare]: (lagret.kurv[trinn.vare] ?? 0) + 1 } };
      const bygd = utfor(lagret, { slag: "steg" });
      if (!bygd.lagret.aktivDag) throw new Error(bygd.melding ?? "dagen sluttet");
      lagret = bygd.lagret;
    }
    expect(lagret.by.bygg.find((bygg) => bygg.bygg === "hytte")?.ferdig).toBe(true);
    expect(lagret.by.bygg.find((bygg) => bygg.bygg === "ronne")?.uthus).toBe(true);
    expect(lagret.by.nivaa).toBe(2);
  });

  it("gir ingen del når barnet prøver igjen hos tannlegen", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const start = 16 * 60;
    lagret = medDag(lagret, {
      tid: start,
      sted: "tannlege",
      fase: "ute",
      ko: [],
      plan: {
        ...dag.plan,
        avtaler: [{ id: "tann-1", slag: "fritid", navn: "tannlege", aktivitet: "tannlege", start, varighet: 30, sted: "tannlege" }],
      },
    });
    const mynter = lagret.mynter;
    lagret = utfor(lagret, { slag: "mot" }).lagret;
    lagret = utfor(lagret, { slag: "svar", svar: "feil" }).lagret;
    lagret = utfor(lagret, { slag: "fortsett" }).lagret;
    expect(lagret.aktivDag?.fase).toBe("aktivitet");
    expect(lagret.aktivDag?.ko[0]?.nokkel).toBe("avtale:tann-1");
    const etter = utfor(lagret, { slag: "svar", svar: "rett" });
    expect(Object.values(etter.lagret.kurv).reduce((sum, n) => sum + (n ?? 0), 0)).toBe(0);
    expect(etter.lagret.mynter).toBe(mynter);
    expect(etter.lagret.aktivDag?.besokt).toContain("tann-1");
    expect(etter.lagret.aktivDag?.tid).toBe(start + 30);
  });

  it("starter avtalen ved starttiden når barnet kommer for tidlig", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, {
      tid: 15 * 60 + 45,
      sted: "svommehall",
      fase: "ute",
      ko: [],
      plan: {
        ...dag.plan,
        avtaler: [{ id: "svom-1", slag: "fritid", navn: "svomming", aktivitet: "svomming", start: 16 * 60, varighet: 60, sted: "svommehall" }],
      },
    });
    lagret = utfor(lagret, { slag: "mot" }).lagret;
    const etter = utfor(lagret, { slag: "svar", svar: "rett" }).lagret;
    expect(etter.aktivDag?.tid).toBe(17 * 60);
  });

  it("legger stjernen i dagboka, ikke en blomst i kurven", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, {
      tid: 17 * 60,
      sted: "hjemme",
      besokt: ["lek"],
      plan: {
        ...dag.plan,
        avtaler: [
          { id: "lek", slag: "hjemme", navn: "lekser", aktivitet: "lekser", start: 15 * 60, varighet: 30, sted: "hjemme" },
          { id: "middag", slag: "middag", navn: "middag", aktivitet: "middag", start: 17 * 60, varighet: 30, sted: "hjemme" },
        ],
      },
    });
    lagret = utfor(lagret, { slag: "spis" }).lagret;
    expect(lagret.aktivDag?.besokt).toContain("middag");
    expect(lagret.aktivDag?.tid).toBe(17 * 60 + 30);
    const slutt = utfor(lagret, { slag: "avslutt" });
    expect(slutt.lagret.kurv["pynt-blomst"] ?? 0).toBe(0);
    expect(slutt.lagret.dagbok.at(-1)?.stjerne).toBe(true);
  });

  it("selger én del om gangen så lenge butikken er åpen", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, { tid: dag.plan.butikk.apner, sted: "butikk", dorLest: true, fase: "ute", ko: [], handlet: false });
    const forTid = lagret.aktivDag?.tid ?? 0;
    lagret = utfor(lagret, { slag: "handle" }).lagret;
    expect(lagret.aktivDag?.ko?.length).toBeGreaterThanOrEqual(3);
    expect(lagret.aktivDag?.ko[0]?.hvem.toLowerCase()).toContain("ekspedit");
    lagret = utfor(lagret, { slag: "svar", svar: lagret.aktivDag?.ko[0]?.fasit ?? "" }).lagret;
    expect(lagret.kurv["kloss-sylinder"]).toBe(1);
    expect(lagret.aktivDag?.tid).toBe(forTid);
    lagret = utfor(lagret, { slag: "handle" }).lagret;
    expect(lagret.aktivDag?.ko?.length).toBeGreaterThanOrEqual(3);
    expect(lagret.aktivDag?.fase).toBe("handel");
  });

  it("sender barnet til avtalen før det bygger", () => {
    let lagret = utfor(standardLagret(), { slag: "start" }).lagret;
    const dag = lagret.aktivDag;
    if (!dag) throw new Error("mangler dag");
    lagret = medDag(lagret, {
      tid: 15 * 60 + 40,
      sted: "hjemme",
      fase: "ute",
      ko: [],
      plan: {
        ...dag.plan,
        avtaler: [{ id: "tann-1", slag: "fritid", navn: "tannlege", aktivitet: "tannlege", start: 16 * 60, varighet: 30, sted: "tannlege" }],
      },
    });
    lagret = { ...lagret, kurv: { "kloss-sylinder": 1 } };
    const valg = anbefalt(lagret);
    expect(valg).toEqual({ slag: "gaa", sted: "tannlege" });
  });

  it("viser ikke samme klokkerepresentasjon i spørsmål og svar", () => {
    const analogTilOrd = {
      id: "les",
      type: "les-klokka" as const,
      mal: "les-1",
      ferdighet: "halv" as const,
      prompt: "Hvilket ord passer?",
      nokkel: "k",
      valg: [{ id: "a", klokke: 14 * 60 + 30, tekst: "halv tre" }],
      fasit: "a",
      vare: "planke" as const,
      hvem: "ekspeditøren",
      overraskelse: false,
      maalKlokke: 14 * 60 + 30,
    };
    expect(sporsmalViser(analogTilOrd)).toBe("analog");
    expect(svarViser(analogTilOrd)).toBe("ord");
    const still = { ...analogTilOrd, type: "still-klokka" as const, prompt: "Still klokka til 14:30" };
    expect(sporsmalViser(still)).toBe("digital");
    expect(svarViser(still)).toBe("analog");
  });

  it("tegner 3D-former ulikt 2D, og uten gul", () => {
    expect(formSvg("kube")).not.toBe(formSvg("kvadrat"));
    expect(formSvg("kule")).not.toBe(formSvg("sirkel"));
    expect(formSvg("pyramide")).not.toBe(formSvg("kjegle"));
    expect(formSvg("sirkel")).not.toContain(FARGER.aksentGul);
    expect(formSvg("kube")).not.toContain(FARGER.aksentGul);
  });

  it("tegner brønnen som sylinder når første del er satt på", () => {
    const svg = tegnFremdrift("bronn", 1, 3);
    expect(svg).toContain("<ellipse");
    expect(tegnFremdrift("bronn", 0, 3)).toContain("stroke-dasharray");
  });
});
