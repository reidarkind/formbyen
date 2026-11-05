/** Regulære former. Samme punkter brukes til oppgaver og til tegning. */

export function regulær(n: number, cx: number, cy: number, r: number, rotasjon = -Math.PI / 2): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const vinkel = rotasjon + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(vinkel), cy + r * Math.sin(vinkel)] as [number, number];
  });
}

export function kvadratPunkter(x: number, y: number, side: number): [number, number][] {
  return [
    [x, y],
    [x + side, y],
    [x + side, y + side],
    [x, y + side],
  ];
}

export function sideLengder(punkter: readonly (readonly [number, number])[]): number[] {
  return punkter.map((punkt, i) => {
    const neste = punkter[(i + 1) % punkter.length] ?? punkt;
    return Math.hypot(neste[0] - punkt[0], neste[1] - punkt[1]);
  });
}

export function retteVinkler(punkter: readonly (readonly [number, number])[]): number {
  let antall = 0;
  for (let i = 0; i < punkter.length; i++) {
    const forrige = punkter[(i + punkter.length - 1) % punkter.length];
    const punkt = punkter[i];
    const neste = punkter[(i + 1) % punkter.length];
    if (!forrige || !punkt || !neste) continue;
    const ax = forrige[0] - punkt[0];
    const ay = forrige[1] - punkt[1];
    const bx = neste[0] - punkt[0];
    const by = neste[1] - punkt[1];
    const prikk = ax * bx + ay * by;
    const lengde = Math.hypot(ax, ay) * Math.hypot(bx, by);
    if (lengde > 0 && Math.abs(prikk / lengde) < 0.02) antall += 1;
  }
  return antall;
}
