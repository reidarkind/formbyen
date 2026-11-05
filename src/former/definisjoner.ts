export type Form2dId =
  | "sirkel"
  | "trekant"
  | "kvadrat"
  | "rektangel"
  | "femkant"
  | "sekskant"
  | "halvsirkel"
  | "oval";

export type Form3dId = "kule" | "kube" | "sylinder" | "kjegle" | "pyramide" | "prisme";

export interface Form2d {
  id: Form2dId;
  sider: number;
  hjorner: number;
  rund: boolean;
  retteVinkler: number;
  likeSider: boolean;
}

export interface Form3d {
  id: Form3dId;
  kanter: number;
  hjorner: number;
  flater: number;
  retteVinkler: boolean;
  /** Flater barnet kan navngi. */
  sider: Form2dId[];
  /** Formen du får når du stempler med bunnen. */
  stempel: Form2dId;
}

export const FORMER_2D: Record<Form2dId, Form2d> = {
  sirkel: { id: "sirkel", sider: 0, hjorner: 0, rund: true, retteVinkler: 0, likeSider: false },
  trekant: { id: "trekant", sider: 3, hjorner: 3, rund: false, retteVinkler: 0, likeSider: true },
  kvadrat: { id: "kvadrat", sider: 4, hjorner: 4, rund: false, retteVinkler: 4, likeSider: true },
  rektangel: { id: "rektangel", sider: 4, hjorner: 4, rund: false, retteVinkler: 4, likeSider: false },
  femkant: { id: "femkant", sider: 5, hjorner: 5, rund: false, retteVinkler: 0, likeSider: true },
  sekskant: { id: "sekskant", sider: 6, hjorner: 6, rund: false, retteVinkler: 0, likeSider: true },
  halvsirkel: { id: "halvsirkel", sider: 2, hjorner: 2, rund: true, retteVinkler: 0, likeSider: false },
  oval: { id: "oval", sider: 0, hjorner: 0, rund: true, retteVinkler: 0, likeSider: false },
};

export const FORMER_3D: Record<Form3dId, Form3d> = {
  kule: { id: "kule", kanter: 0, hjorner: 0, flater: 1, retteVinkler: false, sider: ["sirkel"], stempel: "sirkel" },
  kube: { id: "kube", kanter: 12, hjorner: 8, flater: 6, retteVinkler: true, sider: ["kvadrat"], stempel: "kvadrat" },
  sylinder: {
    id: "sylinder",
    kanter: 2,
    hjorner: 0,
    flater: 3,
    retteVinkler: false,
    sider: ["sirkel", "rektangel"],
    stempel: "sirkel",
  },
  kjegle: { id: "kjegle", kanter: 1, hjorner: 1, flater: 2, retteVinkler: false, sider: ["sirkel"], stempel: "sirkel" },
  pyramide: {
    id: "pyramide",
    kanter: 8,
    hjorner: 5,
    flater: 5,
    retteVinkler: false,
    sider: ["kvadrat", "trekant"],
    stempel: "kvadrat",
  },
  prisme: {
    id: "prisme",
    kanter: 9,
    hjorner: 6,
    flater: 5,
    retteVinkler: true,
    sider: ["trekant", "rektangel"],
    stempel: "trekant",
  },
};

export const GRUNNFORMER: Form2dId[] = ["sirkel", "trekant", "kvadrat", "rektangel"];
export const FLERE_FORMER: Form2dId[] = ["femkant", "sekskant", "halvsirkel", "oval"];
export const ENKLE_3D: Form3dId[] = ["kule", "kube"];
export const ALLE_2D = Object.keys(FORMER_2D) as Form2dId[];
export const ALLE_3D = Object.keys(FORMER_3D) as Form3dId[];

export function form2d(id: Form2dId): Form2d {
  return FORMER_2D[id];
}

export function form3d(id: Form3dId): Form3d {
  return FORMER_3D[id];
}

export function erForm2d(verdi: string): verdi is Form2dId {
  return verdi in FORMER_2D;
}

export function erForm3d(verdi: string): verdi is Form3dId {
  return verdi in FORMER_3D;
}
