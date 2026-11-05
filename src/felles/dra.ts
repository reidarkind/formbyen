/** Peker-dra som virker med mus og finger. Slippes formen utenfor en kasse, kommer den tilbake. */

export function bindDra(flate: Element, slipp: (vare: string, kasseId: string | null) => void): void {
  flate.addEventListener("pointerdown", (hendelse: Event) => {
    if (!(hendelse instanceof PointerEvent)) return;
    const mal = hendelse.target;
    if (!(mal instanceof Element)) return;
    const knapp = mal.closest("[data-vare]");
    if (!(knapp instanceof HTMLElement) || !knapp.dataset.vare) return;
    const vare = knapp.dataset.vare;
    hendelse.preventDefault();
    const kopi = knapp.cloneNode(true);
    if (!(kopi instanceof HTMLElement)) return;
    kopi.classList.add("loftet");
    kopi.style.position = "fixed";
    kopi.style.pointerEvents = "none";
    kopi.style.zIndex = "5";
    kopi.style.left = `${hendelse.clientX - 36}px`;
    kopi.style.top = `${hendelse.clientY - 36}px`;
    document.body.append(kopi);
    const merk = (x: number, y: number) => {
      for (const kasse of document.querySelectorAll(".kasse")) kasse.classList.remove("under");
      const under = document.elementFromPoint(x, y);
      const kasse = under instanceof Element ? under.closest("[data-kasse]") : null;
      if (kasse instanceof HTMLElement) kasse.classList.add("under");
    };
    const flytt = (e: PointerEvent) => {
      kopi.style.left = `${e.clientX - 36}px`;
      kopi.style.top = `${e.clientY - 36}px`;
      merk(e.clientX, e.clientY);
    };
    const slippPeker = (e: PointerEvent) => {
      window.removeEventListener("pointermove", flytt);
      window.removeEventListener("pointerup", slippPeker);
      kopi.remove();
      for (const kasse of document.querySelectorAll(".kasse")) kasse.classList.remove("under");
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const kasse = under instanceof Element ? under.closest("[data-kasse]") : null;
      const id = kasse instanceof HTMLElement ? kasse.dataset.kasse ?? null : null;
      slipp(vare, id);
    };
    window.addEventListener("pointermove", flytt);
    window.addEventListener("pointerup", slippPeker);
  });
}
