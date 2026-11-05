// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { NOKKEL, standardLagret } from "./lagring/lagring";
import { utfor } from "./spill/okt";
import type { Lagret } from "./typer";

function kveld(): Lagret {
  const startet = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
  const dag = startet.aktivDag;
  if (!dag) throw new Error("mangler dag");
  return {
    ...startet,
    startet: true,
    mynter: 3,
    by: {
      ...startet.by,
      bygg: [
        ...startet.by.bygg,
        { instans: "slott-1", bygg: "slott", x: 8, y: 8, steg: 1, ferdig: true, uthus: false, frie: [], pynt: [] },
      ],
    },
    aktivDag: {
      ...dag,
      tid: dag.plan.leggetid - 60,
      sted: "hjemme",
      dorLest: true,
      fase: "ute",
      ko: [],
      forklaring: null,
      klokkeLekt: false,
      besokt: dag.plan.avtaler.map((avtale) => avtale.id),
    },
  };
}

describe("klokkeleken", () => {
  beforeAll(async () => {
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.setItem(NOKKEL, JSON.stringify(kveld()));
    await import("./app.ts");
  });

  it("åpner tårnuret med ett trykk og flytter viseren med nivåets trinn", () => {
    const forTid = JSON.parse(localStorage.getItem(NOKKEL) ?? "{}").aktivDag.tid as number;
    const knapp = document.querySelector<HTMLButtonElement>("[data-handling='klokke']");
    expect(knapp).toBeTruthy();
    knapp?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(document.querySelector("h1")?.textContent).toBe("Tårnuret");
    expect(JSON.parse(localStorage.getItem(NOKKEL) ?? "{}").aktivDag.tid).toBe(forTid);
    const pluss = document.querySelector<HTMLButtonElement>("[data-minutt='30']");
    expect(pluss?.textContent).toBe("+ 30 min");
    const forUr = document.querySelector("[data-ur]")?.innerHTML;
    pluss?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const etter = document.querySelector("[data-ur]")?.innerHTML;
    expect(etter).not.toBe(forUr);
    document.querySelector<HTMLButtonElement>("[data-minutt='-30']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(document.querySelector("[data-ur]")?.innerHTML).toBe(forUr);
    expect(JSON.parse(localStorage.getItem(NOKKEL) ?? "{}").aktivDag.tid).toBe(forTid);
  });
});
