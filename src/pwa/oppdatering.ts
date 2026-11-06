export type OppdateringUtfall = "sjekker" | "offline" | "nyeste" | "ny" | "feil";

const TEKST: Record<OppdateringUtfall, string> = {
  sjekker: "Sjekker …",
  offline: "Du er ikke på nett.",
  nyeste: "Du har nyeste versjon.",
  ny: "Ny versjon er klar.",
  feil: "Kunne ikke sjekke nå.",
};

export function oppdateringTekst(utfall: OppdateringUtfall): string {
  return TEKST[utfall];
}

export async function sjekkForOppdatering(kilder: {
  online: boolean;
  hentNyVersjon: () => Promise<boolean>;
}): Promise<Exclude<OppdateringUtfall, "sjekker">> {
  if (!kilder.online) return "offline";
  try {
    return (await kilder.hentNyVersjon()) ? "ny" : "nyeste";
  } catch {
    return "feil";
  }
}

/** Det vi bruker fra en ServiceWorkerRegistration. Gjør sjekken testbar uten nettleser. */
export interface Registrering {
  waiting: unknown;
  installing: { state: string; addEventListener: (type: "statechange", f: () => void) => void; removeEventListener: (type: "statechange", f: () => void) => void } | null;
  update: () => Promise<unknown>;
}

/** Venter til en service worker som installeres, er ferdig. Gir false ved tidsavbrudd. */
function ventPaInstallasjon(arbeider: NonNullable<Registrering["installing"]>, tidsavbrudd: number): Promise<boolean> {
  return new Promise((ferdig) => {
    if (arbeider.state !== "installing") {
      ferdig(true);
      return;
    }
    const lytter = () => {
      if (arbeider.state === "installing") return;
      clearTimeout(timer);
      arbeider.removeEventListener("statechange", lytter);
      ferdig(true);
    };
    const timer = setTimeout(() => {
      arbeider.removeEventListener("statechange", lytter);
      ferdig(false);
    }, tidsavbrudd);
    arbeider.addEventListener("statechange", lytter);
  });
}

/**
 * «Sjekk for oppdateringer» (gj. 10, C3). Spør serveren med `reg.update()` og venter på en ny versjon som installeres.
 * En versjon som allerede venter, meldes, men aktiveres ikke. Bare «Åpne på nytt» i banneret aktiverer den.
 */
export async function sjekkRegistrering(
  reg: Registrering | undefined,
  valg: { online: boolean; tidsavbrudd?: number },
): Promise<Exclude<OppdateringUtfall, "sjekker">> {
  if (!valg.online) return "offline";
  if (!reg) return "feil";
  if (reg.waiting) return "ny";
  try {
    await reg.update();
    const arbeider = reg.installing;
    if (arbeider && !(await ventPaInstallasjon(arbeider, valg.tidsavbrudd ?? 10_000))) return "feil";
    return reg.waiting ? "ny" : "nyeste";
  } catch {
    return "feil";
  }
}

/** Automatisk sjekk når appen blir synlig igjen: høyst én gang per kvarter. */
export const SJEKK_MELLOMROM = 15 * 60_000;

export function skalSjekkeIgjen(sist: number, naa: number): boolean {
  return naa - sist >= SJEKK_MELLOMROM;
}
