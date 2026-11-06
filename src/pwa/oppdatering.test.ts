import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type Registrering, oppdateringTekst, sjekkForOppdatering, sjekkRegistrering, skalSjekkeIgjen } from "./oppdatering";

describe("oppdatering", () => {
  it("forteller barnet om nett, ny versjon og feil", () => {
    expect(oppdateringTekst("sjekker")).toBe("Sjekker …");
    expect(oppdateringTekst("offline")).toBe("Du er ikke på nett.");
    expect(oppdateringTekst("nyeste")).toBe("Du har nyeste versjon.");
    expect(oppdateringTekst("ny")).toBe("Ny versjon er klar.");
    expect(oppdateringTekst("feil")).toBe("Kunne ikke sjekke nå.");
  });

  it("sjekker ikke når telefonen er offline", async () => {
    let kalt = false;
    const utfall = await sjekkForOppdatering({
      online: false,
      hentNyVersjon: async () => {
        kalt = true;
        return true;
      },
    });
    expect(utfall).toBe("offline");
    expect(kalt).toBe(false);
  });

  it("skiller ny versjon fra den som allerede ligger på telefonen", async () => {
    expect(await sjekkForOppdatering({ online: true, hentNyVersjon: async () => false })).toBe("nyeste");
    expect(await sjekkForOppdatering({ online: true, hentNyVersjon: async () => true })).toBe("ny");
  });

  it("tåler at sjekken feiler", async () => {
    const utfall = await sjekkForOppdatering({
      online: true,
      hentNyVersjon: async () => {
        throw new Error("nett");
      },
    });
    expect(utfall).toBe("feil");
  });

  it("har knapp i innstillinger, lokal Nunito og PWA-oppsett", () => {
    const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
    const vite = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
    const app = readFileSync(new URL("../app.ts", import.meta.url), "utf8");
    expect(app).toContain("Sjekk for oppdateringer");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
    expect(css).not.toContain("fonts.googleapis.com");
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family:\s*Nunito/);
    expect(css).toMatch(/nunito-latin.*\.woff2/);
    expect(css).toMatch(/nunito-latin-ext.*\.woff2/);
    expect(vite).toMatch(/base:\s*"\/formbyen\/"/);
    expect(vite).toMatch(/registerType:\s*"prompt"/);
    expect(vite).toMatch(/globPatterns:\s*\["\*\*\/\*\.\{js,css,html,svg,png,woff2,json,wasm\}"\]/);
  });

  // Gj. 10, C3: knappen må spørre serveren, og den skal ikke aktivere en ventende versjon.
  function falsk(oppsett: { venter?: boolean; nyPaServer?: boolean; feiler?: boolean; henger?: boolean }): Registrering & { oppdatert: number } {
    const reg: Registrering & { oppdatert: number } = {
      oppdatert: 0,
      waiting: oppsett.venter ? {} : null,
      installing: null,
      async update() {
        reg.oppdatert += 1;
        if (oppsett.feiler) throw new Error("nett");
        if (oppsett.nyPaServer) {
          const lyttere: (() => void)[] = [];
          const arbeider = {
            state: "installing",
            addEventListener: (_: string, f: () => void) => lyttere.push(f),
            removeEventListener: () => undefined,
          };
          reg.installing = arbeider;
          if (!oppsett.henger)
            setTimeout(() => {
              arbeider.state = "installed";
              reg.installing = null;
              reg.waiting = arbeider;
              lyttere.forEach((f) => f());
            }, 5);
        }
      },
    };
    return reg;
  }

  it("spør serveren og venter til den nye versjonen er installert", async () => {
    const reg = falsk({ nyPaServer: true });
    expect(await sjekkRegistrering(reg, { online: true })).toBe("ny");
    expect(reg.oppdatert).toBe(1);
  });

  it("svarer nyeste når serveren ikke har noe nytt", async () => {
    const reg = falsk({});
    expect(await sjekkRegistrering(reg, { online: true })).toBe("nyeste");
    expect(reg.oppdatert).toBe(1);
  });

  it("melder en versjon som allerede venter uten å aktivere den", async () => {
    const reg = falsk({ venter: true });
    expect(await sjekkRegistrering(reg, { online: true })).toBe("ny");
    expect(reg.oppdatert).toBe(0);
  });

  it("svarer offline, feil og tidsavbrudd", async () => {
    expect(await sjekkRegistrering(falsk({}), { online: false })).toBe("offline");
    expect(await sjekkRegistrering(falsk({ feiler: true }), { online: true })).toBe("feil");
    expect(await sjekkRegistrering(undefined, { online: true })).toBe("feil");
    expect(await sjekkRegistrering(falsk({ nyPaServer: true, henger: true }), { online: true, tidsavbrudd: 20 })).toBe("feil");
  });

  it("sjekker automatisk høyst én gang per kvarter", () => {
    expect(skalSjekkeIgjen(0, 15 * 60_000)).toBe(true);
    expect(skalSjekkeIgjen(1000, 1000 + 14 * 60_000)).toBe(false);
  });
});
