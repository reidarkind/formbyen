export interface Raster {
  bredde: number;
  hoyde: number;
  maske: boolean[];
}

export function rasterFraAlpha(data: Uint8ClampedArray, bredde: number, hoyde: number, terskel = 40): Raster {
  const maske: boolean[] = [];
  for (let i = 3; i < data.length; i += 4) maske.push((data[i] ?? 0) > terskel);
  return { bredde, hoyde, maske };
}

function dilater(raster: Raster, radius: number): boolean[] {
  const { bredde, hoyde, maske } = raster;
  const ut = maske.slice();
  const r2 = radius * radius;
  for (let i = 0; i < maske.length; i++) {
    if (!maske[i]) continue;
    const x0 = i % bredde;
    const y0 = Math.floor(i / bredde);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const x = x0 + dx;
        const y = y0 + dy;
        if (x < 0 || y < 0 || x >= bredde || y >= hoyde) continue;
        ut[y * bredde + x] = true;
      }
    }
  }
  return ut;
}

/** Penselen er tykkere enn den tynne kanten. Strek som følger kanten skal gjelde. */
export function vurderTegning(strek: Raster, omriss: Raster, minDekning = 0.8): boolean {
  if (strek.bredde !== omriss.bredde || strek.hoyde !== omriss.hoyde) return false;
  const rom = dilater(omriss, 8);
  let omrissPiksler = 0;
  let truffet = 0;
  let strekPiksler = 0;
  let innenfor = 0;
  for (let i = 0; i < omriss.maske.length; i++) {
    if (omriss.maske[i]) {
      omrissPiksler += 1;
      if (strek.maske[i]) truffet += 1;
    }
    if (strek.maske[i]) {
      strekPiksler += 1;
      if (rom[i]) innenfor += 1;
    }
  }
  if (omrissPiksler === 0 || strekPiksler < 8) return false;
  return truffet / omrissPiksler >= minDekning && innenfor / strekPiksler >= 0.75;
}
