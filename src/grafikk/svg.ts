export function avrund(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function punktStreng(punkter: readonly (readonly [number, number])[]): string {
  return punkter.map(([x, y]) => `${avrund(x)},${avrund(y)}`).join(" ");
}

export function polygon(
  punkter: readonly (readonly [number, number])[],
  fyll: string,
  bredde: 2 | 3 = 3,
  ekstra = "",
): string {
  return `<polygon points="${punktStreng(punkter)}" fill="${fyll}" stroke="#3B2F2A" stroke-width="${bredde}" stroke-linejoin="round"${ekstra}/>`;
}

export function svgDokument(innhold: string, bredde: number, hoyde: number, minX = 0, minY = 0, klasse = ""): string {
  const navn = klasse ? ` class="${klasse}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${bredde} ${hoyde}" width="${bredde}" height="${hoyde}"${navn} fill="none">${innhold}</svg>`;
}

export function fargerI(svg: string): string[] {
  const funnet = new Set<string>();
  for (const treff of svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,8})"/g)) {
    const farge = treff[1];
    if (farge) funnet.add(farge.toUpperCase());
  }
  return [...funnet];
}

export function harForbudt(svg: string): boolean {
  return /linearGradient|radialGradient|<filter|<text|#[0]{3}(?:[0]{3})?/i.test(svg);
}
