let kontekst: AudioContext | null = null;

function hent(): AudioContext | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  kontekst ??= new Ctor();
  return kontekst;
}

/** Kort tone. Av som standard. Hver lyd har også et synlig svar i skjermen. */
export function klikk(pa: boolean, slag: "riktig" | "hammer" | "kasse" | "klokke"): void {
  if (!pa) return;
  const ctx = hent();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const forsterker = ctx.createGain();
  osc.frequency.value = slag === "hammer" ? 160 : slag === "kasse" ? 420 : slag === "klokke" ? 660 : 520;
  forsterker.gain.value = 0.05;
  osc.connect(forsterker);
  forsterker.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}
