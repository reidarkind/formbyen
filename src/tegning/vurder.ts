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

export function vurderTegning(strek: Raster, omriss: Raster, minDekning = 0.32, maksSol = 1.35): boolean {
  if (strek.bredde !== omriss.bredde || strek.hoyde !== omriss.hoyde) return false;
  let omrissPiksler = 0;
  let truffet = 0;
  let strekPiksler = 0;
  for (let i = 0; i < omriss.maske.length; i++) {
    if (omriss.maske[i]) {
      omrissPiksler += 1;
      if (strek.maske[i]) truffet += 1;
    }
    if (strek.maske[i]) strekPiksler += 1;
  }
  if (omrissPiksler === 0 || strekPiksler < 8) return false;
  return truffet / omrissPiksler >= minDekning && strekPiksler / omrissPiksler <= maksSol;
}
