import { describe, expect, it } from "vitest";
import { STARTDATO } from "../dag/plan";
import { importer, normaliserLagret, standardLagret } from "../lagring/lagring";
import { utfor, PYNT_PRIS } from "../spill/okt";
import { spillDag } from "../spill/testbot";
import type { ByggId, Lagret, VareId } from "../typer";
import { BYGG } from "./katalog";
import { ledigeTomter, pyntPlasser } from "./kart";

/** Pynten (gj. 10, C4): står i hagene, aldri på en rute som kan bli tomt. */

function medDag(lagret: Lagret): Lagret {
  return utfor({ ...lagret, mynter: 200 }, { slag: "start" }).lagret;
}

describe("pynt i hagene (gj. 10, C4)", () => {
  it("har plasser inne i ferdige bygg, langs stien og ved torget, og aldri på en mulig tomt", () => {
    const by = standardLagret().by;
    const plasser = pyntPlasser(by);
    expect(plasser.length).toBeGreaterThanOrEqual(6);
    const ruter = new Set(plasser.map((plass) => `${Math.floor(plass.x)},${Math.floor(plass.y)}`));
    for (const id of Object.keys(BYGG) as ByggId[]) {
      for (const tomt of ledigeTomter(by, id)) {
        const def = BYGG[id];
        for (let dx = 0; dx < def.bredde; dx++) for (let dy = 0; dy < def.dybde; dy++) expect(ruter.has(`${tomt.x + dx},${tomt.y + dy}`), `${id} ${tomt.x + dx},${tomt.y + dy}`).toBe(false);
      }
    }
  });

  it("gir 3–4 plasser per bygg på én rute, og flere for større bygg", () => {
    const by = standardLagret().by;
    const hjem = by.bygg.find((rad) => rad.ferdig);
    expect(hjem).toBeDefined();
    const egne = pyntPlasser(by).filter((plass) => plass.plass.startsWith(`${hjem!.instans}:`));
    const def = BYGG[hjem!.bygg];
    expect(egne.length).toBeGreaterThanOrEqual(def.bredde * def.dybde > 1 ? 4 : 3);
  });

  it("setter, flytter og fjerner pynt på en plass, og tar betalt", () => {
    let lagret = medDag(standardLagret());
    const [en, to] = pyntPlasser(lagret.by);
    expect(en && to).toBeTruthy();
    const mynter = lagret.mynter;
    lagret = utfor(lagret, { slag: "pynt", vare: "pynt-tre", plass: en!.plass }).lagret;
    expect(lagret.mynter).toBe(mynter - (PYNT_PRIS["pynt-tre"] ?? 0));
    expect(lagret.by.pynt?.map((rad) => rad.plass)).toEqual([en!.plass]);
    // Plassen er tatt.
    const igjen = utfor(lagret, { slag: "pynt", vare: "pynt-blomst", plass: en!.plass });
    expect(igjen.lagret.by.pynt?.length).toBe(1);
    expect(igjen.melding).toBe("Der står det alt pynt.");
    const id = lagret.by.pynt?.[0]?.id ?? "";
    lagret = utfor(lagret, { slag: "pynt-flytt", id, plass: to!.plass }).lagret;
    expect(lagret.by.pynt?.[0]?.plass).toBe(to!.plass);
    lagret = utfor(lagret, { slag: "pynt-fjern", id }).lagret;
    expect(lagret.by.pynt).toEqual([]);
    expect(lagret.mynter).toBe(mynter);
  });

  it("sier hvor mange mynter som mangler", () => {
    const lagret = { ...medDag(standardLagret()), mynter: 1 };
    const plass = pyntPlasser(lagret.by)[0]!.plass;
    const ut = utfor(lagret, { slag: "pynt", vare: "pynt-benk", plass });
    expect(ut.melding).toBe("Du mangler 4 mynter.");
  });

  it("tar vare på pynten ved lagring og flytter gammel pynt på ruter til mynter", () => {
    const lagret = medDag(standardLagret());
    const plass = pyntPlasser(lagret.by)[0]!.plass;
    const med = utfor(lagret, { slag: "pynt", vare: "pynt-blomst", plass }).lagret;
    const lest = normaliserLagret(JSON.parse(JSON.stringify(med)));
    expect(lest?.by.pynt?.[0]?.plass).toBe(plass);
    const gammel = { ...med, mynter: 3, by: { ...med.by, pynt: [{ id: "p", vare: "pynt-lykt" as VareId, x: 4, y: 4 }] } };
    const migrert = importer(JSON.stringify(gammel));
    expect(migrert?.by.pynt).toEqual([]);
    expect(migrert?.mynter).toBe(3 + (PYNT_PRIS["pynt-lykt"] ?? 0));
  });

  it("lar aldri et bygg stå oppå pynt helt fram til slottet", () => {
    const grunn = standardLagret();
    let lagret: Lagret = { ...grunn, fro: 3, dato: STARTDATO, startet: true, innstillinger: { ...grunn.innstillinger, nivaa: "andre" } };
    for (let dag = 0; dag < 40 && !lagret.by.bygg.some((rad) => rad.bygg === "slott" && rad.ferdig); dag++) {
      lagret = utfor({ ...lagret, mynter: lagret.mynter + 10 }, { slag: "start" }).lagret;
      const ledig = pyntPlasser(lagret.by).find((plass) => !(lagret.by.pynt ?? []).some((rad) => rad.plass === plass.plass));
      if (ledig) lagret = utfor(lagret, { slag: "pynt", vare: "pynt-blomst", plass: ledig.plass }).lagret;
      lagret = spillDag(lagret).lagret;
      if (lagret.aktivDag) lagret = utfor(lagret, { slag: "avslutt" }).lagret;
      for (const pynt of lagret.by.pynt ?? []) {
        const plass = pyntPlasser(lagret.by).find((rad) => rad.plass === pynt.plass);
        expect(plass, `pynt ${pynt.plass} mistet plassen sin`).toBeDefined();
      }
    }
    expect(lagret.by.pynt?.length ?? 0).toBeGreaterThan(5);
  }, 60_000);
});
