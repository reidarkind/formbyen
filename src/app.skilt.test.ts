// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { NOKKEL } from "./lagring/lagring";
import { standardLagret } from "./lagring/lagring";
import { utfor } from "./spill/okt";

describe("skiltet på skjermen", () => {
  beforeAll(async () => {
    const startet = utfor({ ...standardLagret(), startet: true }, { slag: "start" }).lagret;
    const dag = startet.aktivDag;
    if (!dag) throw new Error("mangler dag");
    const lagret = {
      ...startet,
      startet: true,
      aktivDag: {
        ...dag,
        tid: 15 * 60 + 15,
        sted: "butikk" as const,
        dorLest: false,
        fase: "ute" as const,
        ko: [],
        forklaring: null,
        plan: {
          ...dag.plan,
          avtaler: [{ id: "middag", slag: "middag" as const, navn: "Middag", start: 18 * 60, varighet: 30, sted: "hjemme" }],
          butikk: { apner: 14 * 60, stenger: 17 * 60 + 30, stengtHele: false, stengtFra: 15 * 60, stengtTil: 15 * 60 + 30 },
        },
      },
    };
    document.body.innerHTML = `<div id="app"></div>`;
    localStorage.setItem(NOKKEL, JSON.stringify(lagret));
    await import("./app.ts");
  });

  it("viser ikke svaret før spørsmålet", () => {
    const forTekst = `${document.querySelector(".boble")?.textContent ?? ""} ${document.querySelector(".scene")?.textContent ?? ""}`;
    expect(forTekst.toLowerCase()).not.toMatch(/åpen|stengt|åpner/);
    document.querySelector<HTMLButtonElement>("[data-handling='handle']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const skilt = document.querySelector(".skilt");
    const h2 = document.querySelector(".kort h2");
    expect(skilt?.textContent ?? "").not.toMatch(/åpen|stengt|åpner/i);
    expect(skilt?.textContent).toContain("15:00");
    expect(skilt?.textContent).toContain("15:30");
    expect(h2 && skilt && Boolean(skilt.compareDocumentPosition(h2) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(document.querySelectorAll(".kort [data-svar]").length).toBe(2);
  });
});
