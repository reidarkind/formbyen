import type { ByggId } from "../typer";
import { BYGG } from "../bygg/katalog";
import { tegnBygg } from "./bygg-svg";
import { byggmester, ikon, kjaeledyr } from "./figurer";
import { formSvg } from "./former-svg";
import { urskive } from "./klokke";
import { FARGER } from "./stil";

export interface GalleriKort {
  tittel: string;
  svg: string;
  referanse: boolean;
}

export function galleriKort(): GalleriKort[] {
  const kort: GalleriKort[] = [
    { tittel: "Rønne", svg: tegnBygg("ronne"), referanse: true },
    { tittel: "Rønne kveld", svg: tegnBygg("ronne", true), referanse: false },
    { tittel: "Byggmester", svg: byggmester(0), referanse: true },
    { tittel: "Urskive", svg: urskive(14 * 60 + 30), referanse: true },
    { tittel: "Ikon", svg: ikon("still"), referanse: true },
  ];
  for (const id of Object.keys(BYGG) as ByggId[]) {
    if (id === "ronne") continue;
    kort.push({ tittel: id, svg: tegnBygg(id), referanse: false });
    kort.push({ tittel: `${id} kveld`, svg: tegnBygg(id, true), referanse: false });
  }
  for (const variant of [0, 1, 2, 3]) kort.push({ tittel: `mester ${variant}`, svg: byggmester(variant, variant % 2 === 1), referanse: false });
  for (const dyr of ["hund", "katt", "kanin"] as const) kort.push({ tittel: dyr, svg: kjaeledyr(dyr), referanse: false });
  for (const navn of ["still", "les", "koble", "sorter", "tell", "tegn", "velg", "feil", "ja", "nei", "mal", "vekt"]) {
    kort.push({ tittel: navn, svg: ikon(navn), referanse: false });
  }
  for (const form of ["sirkel", "trekant", "kvadrat", "rektangel", "femkant", "sekskant", "halvsirkel", "oval", "kule", "kube", "sylinder", "kjegle", "pyramide", "prisme"]) {
    kort.push({ tittel: form, svg: formSvg(form), referanse: false });
  }
  kort.push({ tittel: "Ur null", svg: urskive(0), referanse: false });
  void FARGER;
  return kort;
}
