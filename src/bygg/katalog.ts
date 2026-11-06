import type { ByggId, VareId } from "../typer";

export interface Plass {
  x: number;
  y: number;
  b: number;
  h: number;
}

export interface OppskriftSteg {
  vare: VareId;
  nb: string;
  nn: string;
  plass?: Plass;
}

export interface ByggDef {
  id: ByggId;
  nivaa: 1 | 2 | 3 | 4 | 5 | 6;
  bredde: number;
  dybde: number;
  hjem: boolean;
  oppskrift: OppskriftSteg[];
  former: string[];
  vann?: boolean;
  havn?: boolean;
  materiale: "tre" | "mur" | "stein";
  tak: "rod" | "bla" | "ingen";
  etasjer: number;
}

function steg(vare: VareId, nb: string, nn: string): OppskriftSteg {
  return { vare, nb, nn };
}

export const BYGG: Record<ByggId, ByggDef> = {
  ronne: {
    id: "ronne",
    nivaa: 1,
    bredde: 1,
    dybde: 1,
    hjem: true,
    materiale: "tre",
    tak: "rod",
    etasjer: 1,
    former: ["kvadrat", "rektangel", "trekant"],
    oppskrift: [
      steg("vegg-tre", "Sett opp veggen.", "Set opp veggen."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("vindu-kvadrat", "Sett inn det kvadratiske vinduet.", "Set inn det kvadratiske vindauget."),
      steg("tak-rodt", "Legg på saltaket.", "Legg på saltaket."),
    ],
  },
  hytte: {
    id: "hytte",
    nivaa: 2,
    bredde: 2,
    dybde: 1,
    hjem: true,
    materiale: "tre",
    tak: "rod",
    etasjer: 1,
    former: ["sirkel", "trekant"],
    oppskrift: [
      steg("vegg-tre", "Sett opp veggene.", "Set opp veggane."),
      steg("vegg-tre", "Sett opp den andre veggen.", "Set opp den andre veggen."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("vindu-sirkel", "Sett inn det runde vinduet.", "Set inn det runde vindauget."),
      steg("tak-rodt", "Legg på taket og skorsteinen.", "Legg på taket og skorsteinen."),
    ],
  },
  hus: {
    id: "hus",
    nivaa: 3,
    bredde: 2,
    dybde: 2,
    hjem: true,
    materiale: "mur",
    tak: "rod",
    etasjer: 2,
    former: ["rektangel", "kvadrat"],
    oppskrift: [
      steg("vegg-mur", "Mur første etasje.", "Mur første etasje."),
      steg("vegg-mur", "Mur andre etasje.", "Mur andre etasje."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("vindu-rektangel", "Sett inn et vindu.", "Set inn eit vindauge."),
      steg("vindu-kvadrat", "Sett inn ett vindu til.", "Set inn eit vindauge til."),
      steg("tak-rodt", "Legg på saltaket.", "Legg på saltaket."),
    ],
  },
  villa: {
    id: "villa",
    nivaa: 4,
    bredde: 3,
    dybde: 2,
    hjem: true,
    materiale: "mur",
    tak: "bla",
    etasjer: 2,
    former: ["halvsirkel", "rektangel"],
    oppskrift: [
      steg("vegg-mur", "Mur veggene.", "Mur veggane."),
      steg("vegg-mur", "Mur andre etasje.", "Mur andre etasje."),
      steg("dor-bue", "Sett inn buen over døra.", "Set inn bogen over døra."),
      steg("vindu-halvsirkel", "Sett inn halvsirkelvinduet.", "Set inn halvsirkelvindauget."),
      steg("vindu-rektangel", "Sett inn verandavinduet.", "Set inn verandavindauget."),
      steg("planke", "Legg verandaen.", "Legg verandaen."),
      steg("tak-blatt", "Legg på det blå taket.", "Legg på det blå taket."),
    ],
  },
  borg: {
    id: "borg",
    nivaa: 5,
    bredde: 3,
    dybde: 3,
    hjem: true,
    materiale: "stein",
    tak: "bla",
    etasjer: 2,
    former: ["sylinder", "kjegle"],
    oppskrift: [
      steg("vegg-stein", "Bygg ringmuren.", "Bygg ringmuren."),
      steg("vegg-stein", "Sett tinder på muren.", "Set tinder på muren."),
      steg("kloss-sylinder", "Reis et tårn.", "Reis eit tårn."),
      steg("kloss-kjegle", "Sett kjeglespiret på.", "Set kjeglespiret på."),
      steg("dor-bue", "Bygg porten.", "Bygg porten."),
      steg("vindu-rektangel", "Sett inn et vindu.", "Set inn eit vindauge."),
      steg("kloss-kube", "Sett en kube til på muren.", "Set ein kube til på muren."),
      steg("tak-blatt", "Legg tak over porten.", "Legg tak over porten."),
    ],
  },
  slott: {
    id: "slott",
    nivaa: 6,
    bredde: 4,
    dybde: 3,
    hjem: true,
    materiale: "stein",
    tak: "bla",
    etasjer: 3,
    former: ["prisme", "pyramide"],
    oppskrift: [
      steg("vegg-stein", "Bygg første etasje.", "Bygg første etasje."),
      steg("vegg-stein", "Bygg andre etasje.", "Bygg andre etasje."),
      steg("kloss-prisme", "Reis prismetårnet.", "Reis prismetårnet."),
      steg("kloss-pyramide", "Sett på pyramidetaket.", "Set på pyramidetaket."),
      steg("dor-bue", "Åpne porten til festsalen.", "Opne porten til festsalen."),
      steg("vindu-sekskant", "Sett inn sekskantvinduet.", "Set inn sekskantvindauget."),
      steg("kloss-sylinder", "Sett søyler i salen.", "Set søyler i salen."),
      steg("tak-blatt", "Legg kuppelen.", "Legg kuppelen."),
    ],
  },
  bronn: {
    id: "bronn",
    nivaa: 1,
    bredde: 1,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "rod",
    etasjer: 1,
    former: ["sylinder", "trekant"],
    oppskrift: [
      steg("kloss-sylinder", "Sett sylinderen som brønn.", "Set sylinderen som brønn."),
      steg("vegg-stein", "Mur kanten.", "Mur kanten."),
      steg("tak-rodt", "Legg det lille taket.", "Legg det vesle taket."),
    ],
  },
  gjerde: {
    id: "gjerde",
    nivaa: 1,
    bredde: 2,
    dybde: 1,
    hjem: false,
    materiale: "tre",
    tak: "ingen",
    etasjer: 1,
    former: ["monster"],
    oppskrift: [
      steg("planke", "Sett første planke.", "Set første planke."),
      steg("planke", "Sett neste planke i mønsteret.", "Set neste planke i mønsteret."),
      steg("planke", "Fullfør gjerdet.", "Fullfør gjerdet."),
    ],
  },
  vedskjul: {
    id: "vedskjul",
    nivaa: 1,
    bredde: 1,
    dybde: 1,
    hjem: false,
    materiale: "tre",
    tak: "rod",
    etasjer: 1,
    former: ["rektangel", "trekant"],
    oppskrift: [
      steg("vegg-tre", "Sett opp skjulet.", "Set opp skjulet."),
      steg("planke", "Legg vedplanker.", "Legg vedplankar."),
      steg("dor-rektangel", "Sett på døra.", "Set på døra."),
      steg("tak-rodt", "Legg taket.", "Legg taket."),
    ],
  },
  bakeri: {
    id: "bakeri",
    nivaa: 2,
    bredde: 2,
    dybde: 1,
    hjem: false,
    materiale: "mur",
    tak: "rod",
    etasjer: 1,
    former: ["rektangel", "sirkel"],
    oppskrift: [
      steg("vegg-mur", "Mur bakeriet.", "Mur bakeriet."),
      steg("vindu-rektangel", "Sett inn det store vinduet.", "Set inn det store vindauget."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("vindu-sirkel", "Heng kringle-skiltet.", "Heng kringle-skiltet."),
      steg("tak-rodt", "Legg saltaket.", "Legg saltaket."),
    ],
  },
  lekeplass: {
    id: "lekeplass",
    nivaa: 2,
    bredde: 2,
    dybde: 2,
    hjem: false,
    materiale: "tre",
    tak: "ingen",
    etasjer: 1,
    former: ["sirkel", "kube"],
    oppskrift: [
      steg("planke", "Bygg klatrestativet.", "Bygg klatrestativet."),
      steg("kloss-kule", "Legg ballen klar.", "Legg ballen klar."),
      steg("kloss-kube", "Sett en kube å hoppe på.", "Set ein kube å hoppe på."),
    ],
  },
  bro: {
    id: "bro",
    nivaa: 2,
    bredde: 2,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "ingen",
    etasjer: 1,
    vann: true,
    former: ["halvsirkel"],
    oppskrift: [
      steg("vegg-stein", "Legg den ene brukara.", "Legg den eine brukara."),
      steg("vegg-stein", "Mur buen.", "Mur bogen."),
      steg("kloss-kube", "Sett rekkverket.", "Set rekkverket."),
      steg("planke", "Legg dekket.", "Legg dekket."),
    ],
  },
  skole: {
    id: "skole",
    nivaa: 3,
    bredde: 3,
    dybde: 2,
    hjem: false,
    materiale: "mur",
    tak: "bla",
    etasjer: 2,
    former: ["kvadrat"],
    oppskrift: [
      steg("vegg-mur", "Mur skolen.", "Mur skulen."),
      steg("vegg-mur", "Mur andre etasje.", "Mur andre etasje."),
      steg("vindu-kvadrat", "Sett inn et kvadratvindu.", "Set inn eit kvadratvindauge."),
      steg("vindu-kvadrat", "Sett inn vinduet ved siden av.", "Set inn vindauget ved sida av."),
      steg("dor-rektangel", "Sett inn døra med klokke over.", "Set inn døra med klokke over."),
      steg("tak-blatt", "Legg det flate taket.", "Legg det flate taket."),
    ],
  },
  idrettshall: {
    id: "idrettshall",
    nivaa: 3,
    bredde: 3,
    dybde: 2,
    hjem: false,
    materiale: "mur",
    tak: "bla",
    etasjer: 1,
    former: ["rektangel"],
    oppskrift: [
      steg("vegg-mur", "Reis hallen.", "Reis hallen."),
      steg("vegg-mur", "Sett den andre langveggen.", "Set den andre langveggen."),
      steg("vindu-rektangel", "Sett inn de høye vinduene.", "Set inn dei høge vindauga."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("tak-blatt", "Legg det flate taket.", "Legg det flate taket."),
    ],
  },
  korpslokale: {
    id: "korpslokale",
    nivaa: 3,
    bredde: 2,
    dybde: 1,
    hjem: false,
    materiale: "tre",
    tak: "rod",
    etasjer: 1,
    former: ["sirkel"],
    oppskrift: [
      steg("vegg-tre", "Sett opp lokalet.", "Set opp lokalet."),
      steg("vindu-sirkel", "Sett sirkelen i gavlen.", "Set sirkelen i gavlen."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("tak-rodt", "Legg saltaket.", "Legg saltaket."),
    ],
  },
  musikkskole: {
    id: "musikkskole",
    nivaa: 4,
    bredde: 2,
    dybde: 2,
    hjem: false,
    materiale: "mur",
    tak: "bla",
    etasjer: 1,
    former: ["sekskant", "halvsirkel"],
    oppskrift: [
      steg("vegg-mur", "Mur musikkskolen.", "Mur musikkskulen."),
      steg("vindu-sekskant", "Sett inn sekskantvinduet.", "Set inn sekskantvindauget."),
      steg("dor-bue", "Sett inn halvsirkeldøra.", "Set inn halvsirkeldøra."),
      steg("vindu-kvadrat", "Sett inn et vindu til.", "Set inn eit vindauge til."),
      steg("tak-blatt", "Legg taket.", "Legg taket."),
    ],
  },
  bibliotek: {
    id: "bibliotek",
    nivaa: 4,
    bredde: 2,
    dybde: 2,
    hjem: false,
    materiale: "mur",
    tak: "rod",
    etasjer: 1,
    former: ["sylinder", "trekant"],
    oppskrift: [
      steg("vegg-mur", "Mur biblioteket.", "Mur biblioteket."),
      steg("kloss-sylinder", "Sett opp søylene.", "Set opp søylene."),
      steg("vindu-rektangel", "Sett inn vinduet.", "Set inn vindauget."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("tak-rodt", "Legg trekantgavlen.", "Legg trekantgavlen."),
    ],
  },
  togstasjon: {
    id: "togstasjon",
    nivaa: 4,
    bredde: 3,
    dybde: 1,
    hjem: false,
    materiale: "mur",
    tak: "rod",
    etasjer: 1,
    former: ["sirkel"],
    oppskrift: [
      steg("vegg-mur", "Bygg stasjonen.", "Bygg stasjonen."),
      steg("vindu-rektangel", "Sett inn vinduet.", "Set inn vindauget."),
      steg("dor-rektangel", "Sett inn døra.", "Set inn døra."),
      steg("kloss-sylinder", "Heng opp den store urskiven.", "Heng opp den store urskiva."),
      steg("tak-rodt", "Legg saltaket.", "Legg saltaket."),
    ],
  },
  kirke: {
    id: "kirke",
    nivaa: 5,
    bredde: 2,
    dybde: 2,
    hjem: false,
    materiale: "stein",
    tak: "rod",
    etasjer: 1,
    former: ["kjegle", "halvsirkel"],
    oppskrift: [
      steg("vegg-stein", "Mur kirken.", "Mur kyrkja."),
      steg("kloss-sylinder", "Reis tårnet.", "Reis tårnet."),
      steg("kloss-kjegle", "Sett spiret på.", "Set spiret på."),
      steg("vindu-halvsirkel", "Sett inn det buete vinduet.", "Set inn det boga vindauget."),
      steg("dor-bue", "Sett inn døra.", "Set inn døra."),
      steg("tak-rodt", "Legg taket.", "Legg taket."),
    ],
  },
  vanntaarn: {
    id: "vanntaarn",
    nivaa: 5,
    bredde: 1,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "bla",
    etasjer: 2,
    former: ["sylinder"],
    oppskrift: [
      steg("kloss-sylinder", "Sett søylene.", "Set søylene."),
      steg("kloss-sylinder", "Løft tanken opp.", "Lyft tanken opp."),
      steg("vegg-stein", "Fest tanken.", "Fest tanken."),
      steg("tak-blatt", "Legg kuppelen.", "Legg kuppelen."),
    ],
  },
  fyrtarn: {
    id: "fyrtarn",
    nivaa: 5,
    bredde: 1,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "rod",
    etasjer: 3,
    havn: true,
    former: ["sylinder", "kjegle", "sirkel"],
    oppskrift: [
      steg("kloss-sylinder", "Reis det høye tårnet.", "Reis det høge tårnet."),
      steg("kloss-sylinder", "Bygg ett nivå til.", "Bygg eitt nivå til."),
      steg("vindu-sirkel", "Sett inn det runde vinduet.", "Set inn det runde vindauget."),
      steg("kloss-kjegle", "Sett kjegletaket.", "Set kjegletaket."),
      steg("tak-rodt", "Tenn lykten.", "Tenn lykta."),
    ],
  },
  ringmur: {
    id: "ringmur",
    nivaa: 5,
    bredde: 3,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "ingen",
    etasjer: 1,
    former: ["rektangel"],
    oppskrift: [
      steg("vegg-stein", "Legg første del av muren.", "Legg første del av muren."),
      steg("vegg-stein", "Fortsett muren.", "Fortsett muren."),
      steg("vegg-stein", "Sett tinder.", "Set tinder."),
      steg("kloss-kube", "Sett et hjørnetårn.", "Set eit hjørnetårn."),
    ],
  },
  park: {
    id: "park",
    nivaa: 6,
    bredde: 3,
    dybde: 3,
    hjem: false,
    materiale: "stein",
    tak: "ingen",
    etasjer: 1,
    former: ["sirkel", "sylinder"],
    oppskrift: [
      steg("jord", "Legg gresset.", "Legg graset."),
      steg("planke", "Sett en benk.", "Set ein benk."),
      steg("kloss-sylinder", "Bygg fontenen.", "Bygg fontena."),
      steg("maling", "Mal kanten.", "Mal kanten."),
    ],
  },
  festplass: {
    id: "festplass",
    nivaa: 6,
    bredde: 3,
    dybde: 3,
    hjem: false,
    materiale: "stein",
    tak: "ingen",
    etasjer: 1,
    former: ["kvadrat"],
    oppskrift: [
      steg("vegg-stein", "Legg steinhellene.", "Legg steinhellene."),
      steg("planke", "Sett opp scenen.", "Set opp scena."),
      steg("maling", "Mal gulvet.", "Mal golvet."),
      steg("kloss-kube", "Sett hjørnesteinene.", "Set hjørnesteinane."),
    ],
  },
  klokketarn: {
    id: "klokketarn",
    nivaa: 6,
    bredde: 1,
    dybde: 1,
    hjem: false,
    materiale: "stein",
    tak: "rod",
    etasjer: 2,
    former: ["kube", "prisme", "pyramide"],
    oppskrift: [
      steg("kloss-kube", "Sett kuben nederst.", "Set kuben nedst."),
      steg("kloss-prisme", "Sett prismet oppå.", "Set prismet oppå."),
      steg("vindu-sirkel", "Heng urskiven på den ene siden.", "Heng urskiva på den eine sida."),
      steg("vindu-sirkel", "Heng urskiven på den andre siden.", "Heng urskiva på den andre sida."),
      steg("kloss-pyramide", "Sett pyramidetaket.", "Set pyramidetaket."),
      steg("tak-rodt", "Legg den siste steinen.", "Legg den siste steinen."),
    ],
  },
};

export const VEKT_KG: Record<string, number> = {
  sement: 6,
  sand: 4,
  grus: 5,
  maling: 2,
  fliselim: 3,
  spiker: 1,
  jord: 8,
};

export const PLANKER = [
  { id: "kort", klosser: 2, cm: 20 },
  { id: "middels", klosser: 3, cm: 30 },
  { id: "lang", klosser: 4, cm: 40 },
  { id: "svart", klosser: 5, cm: 50 },
] as const;

/** Plass i fasaden, 0–100 bortover og 0–120 nedover. Samme bilde brukes i kurven. */
export function standardPlass(vare: string, i: number): Plass {
  if (vare.startsWith("tak")) return { x: 8, y: 4, b: 84, h: 36 };
  if (vare.startsWith("dor")) return { x: 40, y: 74, b: 20, h: 42 };
  if (vare.startsWith("vindu")) return { x: 16 + (i % 3) * 26, y: 52, b: 18, h: 18 };
  if (vare === "planke") return { x: 12 + (i % 4) * 22, y: 34, b: 16, h: 72 };
  if (vare === "kloss-sylinder") return { x: 28, y: 42, b: 44, h: 58 };
  if (vare === "vegg-stein" && i > 0) return { x: 22, y: 34, b: 56, h: 18 };
  if (vare.startsWith("vegg")) return { x: 14, y: 40, b: 72, h: 74 };
  if (vare.startsWith("kloss-")) return { x: 20 + (i % 2) * 32, y: 28, b: 36, h: 42 };
  return { x: 16 + (i % 3) * 26, y: 28 + Math.floor(i / 3) * 30, b: 22, h: 24 };
}

export function byggDef(id: ByggId): ByggDef {
  const def = BYGG[id];
  return {
    ...def,
    oppskrift: def.oppskrift.map((trinn, i) => ({ ...trinn, plass: trinn.plass ?? standardPlass(trinn.vare, i) })),
  };
}

export const HJEM_FOR_NIVAA: Record<1 | 2 | 3 | 4 | 5 | 6, ByggId> = {
  1: "ronne",
  2: "hytte",
  3: "hus",
  4: "villa",
  5: "borg",
  6: "slott",
};
