import type { Raster } from "./vurder";
import type { Form2dId } from "../former/definisjoner";

function avstandPunktLinje(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengde = Math.hypot(dx, dy) || 1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (lengde * lengde)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function naerKant(x: number, y: number, punkter: [number, number][], tykk: number): boolean {
  for (let i = 0; i < punkter.length; i++) {
    const a = punkter[i];
    const b = punkter[(i + 1) % punkter.length];
    if (a && b && avstandPunktLinje(x, y, a[0], a[1], b[0], b[1]) <= tykk) return true;
  }
  return false;
}

function mangekant(n: number, cx: number, cy: number, r: number, rotasjon = -Math.PI / 2): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const vinkel = rotasjon + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(vinkel), cy + r * Math.sin(vinkel)] as [number, number];
  });
}

export function omrissForForm(form: Form2dId, bredde = 48, hoyde = 48): Raster {
  const maske = Array.from({ length: bredde * hoyde }, () => false);
  const cx = (bredde - 1) / 2;
  const cy = (hoyde - 1) / 2;
  const r = bredde * 0.34;
  const tykk = 2.4;
  for (let y = 0; y < hoyde; y++) {
    for (let x = 0; x < bredde; x++) {
      let treff = false;
      if (form === "sirkel") treff = Math.abs(Math.hypot(x - cx, y - cy) - r) <= tykk;
      else if (form === "oval") {
        const dx = (x - cx) / (r * 1.15);
        const dy = (y - cy) / (r * 0.72);
        treff = Math.abs(Math.hypot(dx, dy) - 1) <= tykk / r;
      } else if (form === "halvsirkel") {
        const dy = y - cy;
        const bue = dy <= 2 && Math.abs(Math.hypot(x - cx, y - cy) - r) <= tykk;
        const bunn = Math.abs(y - (cy + 1)) <= tykk && Math.abs(x - cx) <= r;
        treff = bue || bunn;
      } else if (form === "rektangel") {
        treff = naerKant(x, y, [
          [cx - r, cy - r * 0.62],
          [cx + r, cy - r * 0.62],
          [cx + r, cy + r * 0.62],
          [cx - r, cy + r * 0.62],
        ], tykk);
      } else {
        const n = form === "trekant" ? 3 : form === "kvadrat" ? 4 : form === "femkant" ? 5 : 6;
        treff = naerKant(x, y, mangekant(n, cx, cy, r), tykk);
      }
      if (treff) maske[y * bredde + x] = true;
    }
  }
  return { bredde, hoyde, maske };
}
