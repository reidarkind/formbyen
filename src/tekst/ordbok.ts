import type { Spraak } from "../typer";
import { fyllSteg } from "./steg";

type Andre = Record<Exclude<Spraak, "nb">, string>;

const ORD = new Map<string, Andre>();

function o(nb: string, nn: string, en: string, es: string, de: string, pt: string, sv: string, da: string, fr: string): void {
  ORD.set(nb, { nn, en, es, de, pt, sv, da, fr });
}

/** Bokmål er nøkkelen. Nynorsk fra kallet vinner over ordboka. */
export function fraNb(spraak: Spraak, nb: string, nn?: string): string {
  if (spraak === "nb") return nb;
  const rad = ORD.get(nb);
  if (spraak === "nn") return nn ?? rad?.nn ?? nb;
  return rad?.[spraak] ?? nb;
}

export function mal(spraak: Spraak, nb: string, nn: string, verdier: Record<string, string> = {}): string {
  return Object.entries(verdier).reduce((setning, [nokkel, verdi]) => setning.replaceAll(`{${nokkel}}`, verdi), fraNb(spraak, nb, nn));
}

export function harOversettelse(nb: string): boolean {
  return ORD.has(nb);
}

function navn(id: string, spraak: Spraak, tabell: Record<string, Andre>, nb: string, nn: string): string {
  if (spraak === "nb") return nb;
  if (spraak === "nn") return nn;
  return tabell[id]?.[spraak] ?? nb;
}

const AKTIVITET: Record<string, Andre> = {};
function a(id: string, nn: string, en: string, es: string, de: string, pt: string, sv: string, da: string, fr: string): void {
  AKTIVITET[id] = { nn, en, es, de, pt, sv, da, fr };
}

a("middag", "Middag", "Dinner", "Cena", "Abendessen", "Jantar", "Middag", "Middag", "Dîner");
a("lekser", "Lekser", "Homework", "Deberes", "Hausaufgaben", "Lição", "Läxor", "Lektier", "Devoirs");
a("hund", "Lufte hunden", "Walk the dog", "Pasear al perro", "Hund ausführen", "Passear o cão", "Rasta hunden", "Lufte hunden", "Promener le chien");
a("tannlege", "Tannlækjar", "Dentist", "Dentista", "Zahnarzt", "Dentista", "Tandläkare", "Tandlæge", "Dentiste");
a("lillesoster", "Hente lillesyster", "Pick up little sister", "Buscar a la hermana", "Kleine Schwester abholen", "Buscar a irmã", "Hämta lillasyster", "Hente lillesøster", "Chercher la petite sœur");
a("svomming", "Symjing", "Swimming", "Natación", "Schwimmen", "Natação", "Simning", "Svømning", "Natation");
a("dans", "Dans", "Dance", "Baile", "Tanz", "Dança", "Dans", "Dans", "Danse");
a("ski", "Ski", "Ski", "Esquí", "Ski", "Esqui", "Skidor", "Ski", "Ski");
a("skoyter", "Skøyter", "Skating", "Patinaje", "Schlittschuh", "Patinagem", "Skridsko", "Skøjter", "Patin");
a("speider", "Speidar", "Scouts", "Exploradores", "Pfadfinder", "Escoteiros", "Scouter", "Spejder", "Scouts");
a("sjakk", "Sjakk", "Chess", "Ajedrez", "Schach", "Xadrez", "Schack", "Skak", "Échecs");
a("fotball", "Fotballtrening", "Football practice", "Fútbol", "Fußballtraining", "Treino de futebol", "Fotbollsträning", "Fodboldtræning", "Entraînement de foot");
a("handball", "Handballtrening", "Handball practice", "Balonmano", "Handballtraining", "Andebol", "Handbollsträning", "Håndboldtræning", "Handball");
a("turn", "Turn", "Gymnastics", "Gimnasia", "Turnen", "Ginástica", "Gymnastik", "Gymnastik", "Gymnastique");
a("korps", "Korpsøving", "Band practice", "Banda", "Blasmusik", "Banda", "Blåsorkester", "Korps", "Fanfare");
a("kor", "Kor", "Choir", "Coro", "Chor", "Coro", "Kör", "Kor", "Chorale");
a("cello", "Cello", "Cello", "Violonchelo", "Cello", "Violoncelo", "Cello", "Cello", "Violoncelle");
a("piano", "Piano", "Piano", "Piano", "Klavier", "Piano", "Piano", "Klaver", "Piano");
a("fiolin", "Fiolin", "Violin", "Violín", "Geige", "Violino", "Fiol", "Violin", "Violon");
a("bibliotek", "Biblioteket", "Library", "Biblioteca", "Bibliothek", "Biblioteca", "Biblioteket", "Biblioteket", "Bibliothèque");
a("besteforeldre", "Besteforeldre", "Grandparents", "Abuelos", "Großeltern", "Avós", "Morföräldrar", "Bedsteforældre", "Grands-parents");
a("henting", "Henting på SFO", "Pickup after school", "Recoger en el cole", "Von der Betreuung abholen", "Buscar na escola", "Hämta på fritids", "Hente på SFO", "Aller chercher à l'école");
a("nabo", "Hjelp naboen", "Help the neighbor", "Ayudar al vecino", "Dem Nachbarn helfen", "Ajudar o vizinho", "Hjälp grannen", "Hjælp naboen", "Aider le voisin");
a("levering", "Varelevering", "Delivery", "Entrega", "Lieferung", "Entrega", "Varuleverans", "Varelevering", "Livraison");
a("bursdag", "Fødselsdag", "Birthday", "Cumpleaños", "Geburtstag", "Aniversário", "Födelsedag", "Fødselsdag", "Anniversaire");
a("norsk", "norsk", "Norwegian", "noruego", "Norwegisch", "norueguês", "norska", "norsk", "norvégien");
a("matematikk", "matematikk", "math", "matemáticas", "Mathe", "matemática", "matematik", "matematik", "maths");
a("kroppsoving", "kroppsøving", "PE", "educación física", "Sport", "educação física", "idrott", "idræt", "sport");
a("musikk", "musikk", "music", "música", "Musik", "música", "musik", "musik", "musique");
a("naturfag", "naturfag", "science", "ciencias", "Sachkunde", "ciências", "NO", "natur/teknik", "sciences");
a("krle", "KRLE", "religion", "religión", "Religion", "religião", "religion", "religion", "religion");
a("kunst", "kunst og handverk", "art", "arte", "Kunst", "arte", "bild", "billedkunst", "arts");
a("engelsk", "engelsk", "English", "inglés", "Englisch", "inglês", "engelska", "engelsk", "anglais");
a("svommetime", "symjing", "swimming", "natación", "Schwimmen", "natação", "simning", "svømning", "natation");

const BYGG: Record<string, Andre> = {};
function b(id: string, nn: string, en: string, es: string, de: string, pt: string, sv: string, da: string, fr: string): void {
  BYGG[id] = { nn, en, es, de, pt, sv, da, fr };
}

b("ronne", "Rønne", "Cottage", "Cabaña", "Kate", "Cabana", "Stuga", "Hytte", "Chaumière");
b("hytte", "Hytte", "Cabin", "Cabaña", "Hütte", "Cabana", "Stuga", "Hytte", "Cabane");
b("hus", "Hus", "House", "Casa", "Haus", "Casa", "Hus", "Hus", "Maison");
b("villa", "Villa", "Villa", "Villa", "Villa", "Vivenda", "Villa", "Villa", "Villa");
b("borg", "Borg", "Castle", "Castillo", "Burg", "Castelo", "Borg", "Borg", "Château fort");
b("slott", "Slott", "Palace", "Palacio", "Schloss", "Palácio", "Slott", "Slot", "Château");
b("bronn", "Brunn", "Well", "Pozo", "Brunnen", "Poço", "Brunn", "Brønd", "Puits");
b("gjerde", "Gjerde", "Fence", "Valla", "Zaun", "Cerca", "Staket", "Hegn", "Clôture");
b("vedskjul", "Vedskjul", "Woodshed", "Leñera", "Holzschuppen", "Lenheiro", "Vedbod", "Brændeskur", "Bûcher");
b("bakeri", "Bakeri", "Bakery", "Panadería", "Bäckerei", "Padaria", "Bageri", "Bageri", "Boulangerie");
b("lekeplass", "Lekeplass", "Playground", "Parque infantil", "Spielplatz", "Parque infantil", "Lekplats", "Legeplads", "Aire de jeux");
b("bro", "Bru", "Bridge", "Puente", "Brücke", "Ponte", "Bro", "Bro", "Pont");
b("skole", "Skule", "School", "Escuela", "Schule", "Escola", "Skola", "Skole", "École");
b("idrettshall", "Idrettshall", "Sports hall", "Polideportivo", "Sporthalle", "Pavilhão", "Idrottshall", "Idrætshal", "Gymnase");
b("korpslokale", "Korpslokale", "Band room", "Local de la banda", "Probenraum", "Sala da banda", "Orkesterlokal", "Korpslokale", "Salle de fanfare");
b("musikkskole", "Musikkskule", "Music school", "Escuela de música", "Musikschule", "Escola de música", "Musikskola", "Musikskole", "École de musique");
b("bibliotek", "Bibliotek", "Library", "Biblioteca", "Bibliothek", "Biblioteca", "Bibliotek", "Bibliotek", "Bibliothèque");
b("togstasjon", "Togstasjon", "Train station", "Estación", "Bahnhof", "Estação", "Station", "Station", "Gare");
b("kirke", "Kyrkje", "Church", "Iglesia", "Kirche", "Igreja", "Kyrka", "Kirke", "Église");
b("vanntaarn", "Vasstårn", "Water tower", "Torre de agua", "Wasserturm", "Torre de água", "Vattentorn", "Vandtårn", "Château d'eau");
b("fyrtarn", "Fyrtårn", "Lighthouse", "Faro", "Leuchtturm", "Farol", "Fyr", "Fyrtårn", "Phare");
b("ringmur", "Ringmur", "Ring wall", "Muralla", "Ringmauer", "Muralha", "Ringmur", "Ringmur", "Rempart");
b("park", "Park", "Park", "Parque", "Park", "Parque", "Park", "Park", "Parc");
b("festplass", "Festplass", "Festival square", "Plaza de fiesta", "Festplatz", "Terreiro", "Festplats", "Festplads", "Place de fête");
b("klokketarn", "Klokketårn", "Clock tower", "Torre del reloj", "Uhrturm", "Torre do relógio", "Klocktorn", "Klokketårn", "Beffroi");

const VARE: Record<string, Andre> = {};
function v(id: string, nn: string, en: string, es: string, de: string, pt: string, sv: string, da: string, fr: string): void {
  VARE[id] = { nn, en, es, de, pt, sv, da, fr };
}

v("sement", "sement", "cement", "cemento", "Zement", "cimento", "cement", "cement", "ciment");
v("sand", "sand", "sand", "arena", "Sand", "areia", "sand", "sand", "sable");
v("grus", "grus", "gravel", "grava", "Kies", "cascalho", "grus", "grus", "gravier");
v("maling", "måling", "paint", "pintura", "Farbe", "tinta", "färg", "maling", "peinture");
v("fliselim", "fliselim", "tile glue", "adhesivo", "Fliesenkleber", "cola", "kakellim", "fliselim", "colle");
v("spiker", "spikar", "nails", "clavos", "Nägel", "pregos", "spik", "søm", "clous");
v("jord", "jord", "soil", "tierra", "Erde", "terra", "jord", "jord", "terre");
v("vegg-tre", "trevegg", "wood wall", "pared de madera", "Holzwand", "parede de madeira", "trävägg", "trævæg", "mur en bois");
v("vegg-mur", "murvegg", "brick wall", "pared de ladrillo", "Mauer", "parede de tijolo", "tegelvägg", "murvæg", "mur de briques");
v("vegg-stein", "steinkant", "stone edge", "borde de piedra", "Steinkante", "borda de pedra", "stenskant", "stenkant", "bord de pierre");
v("tak-rodt", "raudt tak", "red roof", "tejado rojo", "rotes Dach", "telhado vermelho", "rött tak", "rødt tag", "toit rouge");
v("tak-blatt", "blått tak", "blue roof", "tejado azul", "blaues Dach", "telhado azul", "blått tak", "blåt tag", "toit bleu");
v("planke", "planke", "plank", "tablón", "Planke", "tábua", "planka", "planke", "planche");
v("dor-rektangel", "dør", "door", "puerta", "Tür", "porta", "dörr", "dør", "porte");
v("dor-bue", "boga dør", "arched door", "puerta de arco", "Bogentür", "porta em arco", "välvd dörr", "buet dør", "porte en arc");
v("vindu-kvadrat", "kvadratvindauge", "square window", "ventana cuadrada", "Quadratfenster", "janela quadrada", "kvadratfönster", "kvadratvindue", "fenêtre carrée");
v("vindu-rektangel", "rektangelvindauge", "rectangle window", "ventana rectangular", "Rechteckfenster", "janela retangular", "rektangelfönster", "rektangelvindue", "fenêtre rectangulaire");
v("vindu-sirkel", "sirkelvindauge", "round window", "ventana redonda", "Rundes Fenster", "janela redonda", "runt fönster", "rundt vindue", "fenêtre ronde");
v("vindu-halvsirkel", "halvsirkelvindauge", "semicircle window", "ventana de semicírculo", "Halbkreisfenster", "janela em semicírculo", "halvcirkelfönster", "halvcirkelvindue", "fenêtre en demi-cercle");
v("vindu-sekskant", "sekskantvindauge", "hexagon window", "ventana hexagonal", "Sechseckfenster", "janela hexagonal", "sexhörningsfönster", "sekskantvindue", "fenêtre hexagonale");
v("vindu-femkant", "femkantvindauge", "pentagon window", "ventana pentagonal", "Fünfeckfenster", "janela pentagonal", "femhörningsfönster", "femkantvindue", "fenêtre pentagonale");
v("kloss-kube", "kube", "cube", "cubo", "Würfel", "cubo", "kub", "terning", "cube");
v("kloss-sylinder", "sylinder", "cylinder", "cilindro", "Zylinder", "cilindro", "cylinder", "cylinder", "cylindre");
v("kloss-kule", "kule", "sphere", "esfera", "Kugel", "esfera", "klot", "kugle", "sphère");
v("kloss-kjegle", "kjegle", "cone", "cono", "Kegel", "cone", "kon", "kegle", "cône");
v("kloss-pyramide", "pyramide", "pyramid", "pirámide", "Pyramide", "pirâmide", "pyramid", "pyramide", "pyramide");
v("kloss-prisme", "prisme", "prism", "prisma", "Prisma", "prisma", "prisma", "prisme", "prisme");
v("pynt-blomst", "blomster", "flower", "flor", "Blume", "flor", "blomma", "blomst", "fleur");
v("pynt-flagg", "flagg", "flag", "bandera", "Fahne", "bandeira", "flagga", "flag", "drapeau");
v("pynt-benk", "benk", "bench", "banco", "Bank", "banco", "bänk", "bænk", "banc");
v("pynt-lykt", "lykt", "lamp", "farol", "Laterne", "lanterna", "lykta", "lygte", "lanterne");

export function navnAktivitet(id: string, spraak: Spraak, nb: string, nn: string): string {
  return navn(id, spraak, AKTIVITET, nb, nn);
}

export function navnBygg(id: string, spraak: Spraak, nb: string, nn: string): string {
  return navn(id, spraak, BYGG, nb, nn);
}

const VARE_NB: Record<string, string> = {
  "vegg-tre": "trevegg",
  "vegg-mur": "murvegg",
  "vegg-stein": "steinkant",
  "tak-rodt": "rødt tak",
  "tak-blatt": "blått tak",
  planke: "planke",
  "dor-rektangel": "dør",
  "dor-bue": "buet dør",
  "vindu-kvadrat": "kvadratvindu",
  "vindu-rektangel": "rektangelvindu",
  "vindu-sirkel": "sirkelvindu",
  "vindu-halvsirkel": "halvsirkelvindu",
  "vindu-sekskant": "sekskantvindu",
  "vindu-femkant": "femkantvindu",
  "kloss-kube": "kube",
  "kloss-sylinder": "sylinder",
  "kloss-kule": "kule",
  "kloss-kjegle": "kjegle",
  "kloss-pyramide": "pyramide",
  "kloss-prisme": "prisme",
  sement: "sement",
  sand: "sand",
  grus: "grus",
  maling: "maling",
  fliselim: "fliselim",
  spiker: "spiker",
  jord: "jord",
  "pynt-blomst": "blomst",
  "pynt-flagg": "flagg",
  "pynt-benk": "benk",
  "pynt-lykt": "lykt",
};

export function navnVare(id: string, spraak: Spraak): string {
  const nb = VARE_NB[id] ?? id;
  if (spraak === "nb") return nb;
  if (spraak === "nn") return VARE[id]?.nn ?? nb;
  return VARE[id]?.[spraak] ?? nb;
}

const BESTEMT_NB: Record<string, string> = {
  planke: "Planken",
  "vegg-tre": "Treveggen",
  "vegg-mur": "Murveggen",
  "vegg-stein": "Steinkanten",
  "tak-rodt": "Det røde taket",
  "tak-blatt": "Det blå taket",
  "dor-rektangel": "Døra",
  "dor-bue": "Den buede døra",
  "vindu-kvadrat": "Kvadratvinduet",
  "vindu-rektangel": "Rektangelvinduet",
  "vindu-sirkel": "Sirkelvinduet",
  "vindu-halvsirkel": "Halvsirkelvinduet",
  "vindu-sekskant": "Sekskantvinduet",
  "vindu-femkant": "Femkantvinduet",
  "kloss-kube": "Kuben",
  "kloss-sylinder": "Sylinderen",
  "kloss-kule": "Kula",
  "kloss-kjegle": "Kjeglen",
  "kloss-pyramide": "Pyramiden",
  "kloss-prisme": "Prismet",
  jord: "Jorda",
  sand: "Sanden",
  grus: "Grusen",
  sement: "Sementen",
  maling: "Malingen",
  fliselim: "Fliselimet",
  spiker: "Spikeren",
  "pynt-blomst": "Blomsten",
  "pynt-flagg": "Flagget",
  "pynt-benk": "Benken",
  "pynt-lykt": "Lykta",
};
const BESTEMT_NN: Record<string, string> = {
  jord: "Jorda",
  sand: "Sanden",
  grus: "Grusen",
  sement: "Sementen",
  maling: "Målinga",
  fliselim: "Fliselimet",
  spiker: "Spikaren",
  "pynt-blomst": "Blomen",
  "pynt-flagg": "Flagget",
  "pynt-benk": "Benken",
  "pynt-lykt": "Lykta",
  planke: "Planken",
  "vegg-tre": "Treveggen",
  "vegg-mur": "Murveggen",
  "vegg-stein": "Steinkanten",
  "tak-rodt": "Det raude taket",
  "tak-blatt": "Det blå taket",
  "dor-rektangel": "Døra",
  "dor-bue": "Den boga døra",
  "vindu-kvadrat": "Kvadratvindauget",
  "vindu-rektangel": "Rektangelvindauget",
  "vindu-sirkel": "Sirkelvindauget",
  "vindu-halvsirkel": "Halvsirkelvindauget",
  "vindu-sekskant": "Sekskantvindauget",
  "vindu-femkant": "Femkantvindauget",
  "kloss-kube": "Kuben",
  "kloss-sylinder": "Sylinderen",
  "kloss-kule": "Kula",
  "kloss-kjegle": "Kjeglen",
  "kloss-pyramide": "Pyramiden",
  "kloss-prisme": "Prismet",
};
const FLERTALL_VARE_NB: Record<string, string> = {
  planke: "planker",
  "vegg-tre": "trevegger",
  "vegg-mur": "murvegger",
  "vegg-stein": "steinkanter",
  "tak-rodt": "røde tak",
  "tak-blatt": "blå tak",
  "dor-rektangel": "dører",
  "dor-bue": "buede dører",
  "vindu-kvadrat": "kvadratvinduer",
  "vindu-rektangel": "rektangelvinduer",
  "vindu-sirkel": "sirkelvinduer",
  "vindu-halvsirkel": "halvsirkelvinduer",
  "vindu-sekskant": "sekskantvinduer",
  "vindu-femkant": "femkantvinduer",
  "kloss-kube": "kuber",
  "kloss-sylinder": "sylindere",
  "kloss-kule": "kuler",
  "kloss-kjegle": "kjegler",
  "kloss-pyramide": "pyramider",
  "kloss-prisme": "prismer",
};
const FLERTALL_VARE_NN: Record<string, string> = {
  planke: "plankar",
  "vegg-tre": "treveggar",
  "vegg-mur": "murveggar",
  "vegg-stein": "steinkantar",
  "tak-rodt": "raude tak",
  "tak-blatt": "blå tak",
  "dor-rektangel": "dører",
  "dor-bue": "boga dører",
  "vindu-kvadrat": "kvadratvindauge",
  "vindu-rektangel": "rektangelvindauge",
  "vindu-sirkel": "sirkelvindauge",
  "vindu-halvsirkel": "halvsirkelvindauge",
  "vindu-sekskant": "sekskantvindauge",
  "vindu-femkant": "femkantvindauge",
  "kloss-kube": "kubar",
  "kloss-sylinder": "sylindrar",
  "kloss-kule": "kuler",
  "kloss-kjegle": "kjeglar",
  "kloss-pyramide": "pyramidar",
  "kloss-prisme": "prismar",
};

/** Liten forbokstav, når et navn står inne i en setning. */
export function smaForbokstav(tekst: string): string {
  return tekst.charAt(0).toLowerCase() + tekst.slice(1);
}

/** «en trekant», «et rektangel». Andre språk får navnet uten artikkel. */
export function formMedArtikkel(id: string, spraak: Spraak): string {
  const navn = formNavn(id, spraak);
  if (spraak !== "nb" && spraak !== "nn") return navn;
  const intet = id === "kvadrat" || id === "rektangel" || id === "prisme";
  if (spraak === "nn") return `${intet ? "eit" : "ein"} ${navn}`;
  return `${intet ? "et" : "en"} ${navn}`;
}

/** Stor forbokstav, for setninger som starter med et navn. */
export function storForbokstav(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

export function vareBestemt(id: string, spraak: Spraak): string {
  if (spraak === "nn") return BESTEMT_NN[id] ?? storForbokstav(navnVare(id, spraak));
  if (spraak === "nb") return BESTEMT_NB[id] ?? storForbokstav(navnVare(id, spraak));
  return storForbokstav(navnVare(id, spraak));
}

/** Stoffer uten artikkel: «Vi trenger jord.» */
const UTEN_ARTIKKEL = new Set(["jord", "sand", "grus", "sement", "maling", "fliselim", "spiker"]);

function intetkjonn(id: string): boolean {
  return id.startsWith("tak-") || id.startsWith("vindu-") || id === "kloss-prisme" || id === "pynt-flagg";
}

/** «en planke», «et rødt tak», «jord». Andre språk får navnet uten artikkel. */
export function vareMedArtikkel(id: string, spraak: Spraak): string {
  const navn = navnVare(id, spraak);
  if (UTEN_ARTIKKEL.has(id) || (spraak !== "nb" && spraak !== "nn")) return navn;
  if (spraak === "nn") {
    const ei = id.startsWith("dor-") || id === "kloss-kule" || id === "pynt-lykt";
    return `${intetkjonn(id) ? "eit" : ei ? "ei" : "ein"} ${navn}`;
  }
  return `${intetkjonn(id) ? "et" : "en"} ${navn}`;
}

/** «klar» eller «klart» etter delen. */
export function klarFor(id: string, spraak: Spraak): string {
  const nn = spraak === "nn";
  if (intetkjonn(id) || id === "fliselim") return nn ? "klart" : "klart";
  return "klar";
}

/** Antall av en vare: «1 planke», «3 planker». */
export function vareAntall(id: string, antall: number, spraak: Spraak): string {
  return antall === 1 ? `1 ${navnVare(id, spraak)}` : `${antall} ${vareFlertall(id, spraak)}`;
}

export function vareFlertall(id: string, spraak: Spraak): string {
  if (spraak === "nn") return FLERTALL_VARE_NN[id] ?? navnVare(id, spraak);
  if (spraak === "nb") return FLERTALL_VARE_NB[id] ?? navnVare(id, spraak);
  return navnVare(id, spraak);
}

const BYGG_BESTEMT: Record<string, [string, string]> = {
  ronne: ["rønna", "rønna"],
  hytte: ["hytta", "hytta"],
  hus: ["huset", "huset"],
  villa: ["villaen", "villaen"],
  borg: ["borgen", "borga"],
  slott: ["slottet", "slottet"],
  bronn: ["brønnen", "brunnen"],
  gjerde: ["gjerdet", "gjerdet"],
  vedskjul: ["vedskjulet", "vedskjulet"],
  bakeri: ["bakeriet", "bakeriet"],
  lekeplass: ["lekeplassen", "leikeplassen"],
  bro: ["broa", "brua"],
  skole: ["skolen", "skulen"],
  idrettshall: ["idrettshallen", "idrettshallen"],
  korpslokale: ["korpslokalet", "korpslokalet"],
  musikkskole: ["musikkskolen", "musikkskulen"],
  bibliotek: ["biblioteket", "biblioteket"],
  togstasjon: ["togstasjonen", "togstasjonen"],
  kirke: ["kirken", "kyrkja"],
  vanntaarn: ["vanntårnet", "vasstårnet"],
  fyrtarn: ["fyrtårnet", "fyrtårnet"],
  ringmur: ["ringmuren", "ringmuren"],
  park: ["parken", "parken"],
  festplass: ["festplassen", "festplassen"],
  klokketarn: ["klokketårnet", "klokketårnet"],
};

/** «brønnen», «vanntårnet». Aldri rå id. Andre språk får byggnavnet. */
export function byggBestemt(id: string, spraak: Spraak, stor = false): string {
  const rad = BYGG_BESTEMT[id];
  const tekst = spraak === "nb" ? rad?.[0] : spraak === "nn" ? rad?.[1] : BYGG[id]?.[spraak]?.toLowerCase();
  const ut = tekst ?? id;
  return stor ? storForbokstav(ut) : ut;
}

const FORM_NB: Record<string, string> = {
  sirkel: "sirkel",
  trekant: "trekant",
  kvadrat: "kvadrat",
  rektangel: "rektangel",
  femkant: "femkant",
  sekskant: "sekskant",
  halvsirkel: "halvsirkel",
  oval: "oval",
  kube: "kube",
  kule: "kule",
  sylinder: "sylinder",
  kjegle: "kjegle",
  pyramide: "pyramide",
  prisme: "prisme",
};
const FORM: Record<string, Andre> = {};
function f(id: string, nn: string, en: string, es: string, de: string, pt: string, sv: string, da: string, fr: string): void {
  FORM[id] = { nn, en, es, de, pt, sv, da, fr };
}
f("sirkel", "sirkel", "circle", "círculo", "Kreis", "círculo", "cirkel", "cirkel", "cercle");
f("trekant", "trekant", "triangle", "triángulo", "Dreieck", "triângulo", "triangel", "trekant", "triangle");
f("kvadrat", "kvadrat", "square", "cuadrado", "Quadrat", "quadrado", "kvadrat", "kvadrat", "carré");
f("rektangel", "rektangel", "rectangle", "rectángulo", "Rechteck", "retângulo", "rektangel", "rektangel", "rectangle");
f("femkant", "femkant", "pentagon", "pentágono", "Fünfeck", "pentágono", "femhörning", "femkant", "pentagone");
f("sekskant", "sekskant", "hexagon", "hexágono", "Sechseck", "hexágono", "sexhörning", "sekskant", "hexagone");
f("halvsirkel", "halvsirkel", "semicircle", "semicírculo", "Halbkreis", "semicírculo", "halvcirkel", "halvcirkel", "demi-cercle");
f("oval", "oval", "oval", "óvalo", "Oval", "oval", "oval", "oval", "ovale");
f("kube", "kube", "cube", "cubo", "Würfel", "cubo", "kub", "terning", "cube");
f("kule", "kule", "sphere", "esfera", "Kugel", "esfera", "klot", "kugle", "sphère");
f("sylinder", "sylinder", "cylinder", "cilindro", "Zylinder", "cilindro", "cylinder", "cylinder", "cylindre");
f("kjegle", "kjegle", "cone", "cono", "Kegel", "cone", "kon", "kegle", "cône");
f("pyramide", "pyramide", "pyramid", "pirámide", "Pyramide", "pirâmide", "pyramid", "pyramide", "pyramide");
f("prisme", "prisme", "prism", "prisma", "Prisma", "prisma", "prisma", "prisme", "prisme");

export function formNavn(id: string, spraak: Spraak): string {
  const nb = FORM_NB[id] ?? id;
  if (spraak === "nb") return nb;
  if (spraak === "nn") return FORM[id]?.nn ?? nb;
  return FORM[id]?.[spraak] ?? nb;
}

const FLERTALL_NB: Record<string, string> = {
  kule: "kulene",
  kube: "kubene",
  sylinder: "sylindrene",
  kjegle: "kjeglene",
  trekant: "trekantene",
  sirkel: "sirklene",
  kvadrat: "kvadratene",
  rektangel: "rektanglene",
  femkant: "femkantene",
  sekskant: "sekskantene",
  halvsirkel: "halvsirklene",
  oval: "ovalene",
  pyramide: "pyramidene",
  prisme: "prismene",
};
const FLERTALL_NN: Record<string, string> = {
  kule: "kulene",
  kube: "kubane",
  sylinder: "sylindrane",
  kjegle: "kjeglane",
  trekant: "trekantane",
  sirkel: "sirklane",
  kvadrat: "kvadratane",
  rektangel: "rektangla",
  femkant: "femkantane",
  sekskant: "sekskantane",
  halvsirkel: "halvsirklane",
  oval: "ovalane",
  pyramide: "pyramidane",
  prisme: "prisma",
};

/** Bestemt flertall: «Finn alle kulene.» */
export function formFlertall(id: string, spraak: Spraak): string {
  if (spraak === "nn") return FLERTALL_NN[id] ?? formNavn(id, spraak);
  if (spraak === "nb") return FLERTALL_NB[id] ?? formNavn(id, spraak);
  return formNavn(id, spraak);
}

o("Slik er klokka", "Slik er klokka", "This is the time", "Así es la hora", "So ist die Uhr", "Esta é a hora", "Så är klockan", "Sådan er klokken", "Voici l'heure");
o("Ferdig", "Ferdig", "Done", "Listo", "Fertig", "Pronto", "Klar", "Færdig", "Fini");
o("Hva viser klokka?", "Kva viser klokka?", "What does the clock show?", "¿Qué muestra el reloj?", "Was zeigt die Uhr?", "O que mostra o relógio?", "Vad visar klockan?", "Hvad viser uret?", "Que montre l'horloge ?");
o("Fra", "Frå", "From", "Desde", "Von", "De", "Från", "Fra", "De");
o("Nå", "No", "Now", "Ahora", "Jetzt", "Agora", "Nu", "Nu", "Maintenant");
o("Åpner", "Opnar", "Opens", "Abre", "Öffnet", "Abre", "Öppnar", "Åbner", "Ouvre");
o("Til", "Til", "To", "Hasta", "Bis", "Até", "Till", "Til", "À");
o("Slik gjør du det.", "Slik gjer du det.", "This is how.", "Así se hace.", "So geht es.", "Faz-se assim.", "Så gör du.", "Sådan gør du.", "Voici comment.");
o("Prøv igjen", "Prøv igjen", "Try again", "Inténtalo otra vez", "Noch einmal", "Tenta outra vez", "Försök igen", "Prøv igen", "Essaie encore");
o("Butikken er stengt", "Butikken er stengt", "The shop is closed", "La tienda está cerrada", "Der Laden hat zu", "A loja está fechada", "Butiken är stängd", "Butikken er lukket", "La boutique est fermée");
o("Leggetid", "Leggetid", "Bedtime", "Hora de dormir", "Schlafenszeit", "Hora de deitar", "Läggdags", "Sengetid", "Heure du coucher");
o("Start ettermiddagen", "Start ettermiddagen", "Start the afternoon", "Empieza la tarde", "Nachmittag starten", "Começa a tarde", "Starta eftermiddagen", "Start eftermiddagen", "Commence l'après-midi");
o("Meny", "Meny", "Menu", "Menú", "Menü", "Menu", "Meny", "Menu", "Menu");
o("Hjemme", "Heime", "Home", "Casa", "Zuhause", "Casa", "Hemma", "Hjemme", "Maison");
o("Butikken", "Butikken", "Shop", "Tienda", "Laden", "Loja", "Butiken", "Butikken", "Boutique");
o("Torget", "Torget", "Square", "Plaza", "Platz", "Praça", "Torget", "Torvet", "Place");
o("Byen", "Byen", "City", "Ciudad", "Stadt", "Cidade", "Staden", "Byen", "Ville");
o("Vent", "Vent", "Wait", "Espera", "Warte", "Espera", "Vänta", "Vent", "Attends");
o("Handle", "Handle", "Shop", "Comprar", "Einkaufen", "Comprar", "Handla", "Handle", "Acheter");
o("Se døra", "Sjå døra", "Look at the door", "Mira la puerta", "Sieh die Tür", "Olha a porta", "Se dörren", "Se døren", "Regarde la porte");
o("Still uret", "Still uret", "Set the clock", "Pon el reloj", "Stelle die Uhr", "Põe o relógio", "Ställ klockan", "Stil uret", "Mets l'horloge");
o("Møt opp", "Møt opp", "Show up", "Llega", "Komm hin", "Chega", "Kom dit", "Mød op", "Va au rendez-vous");
o("Legg deg", "Legg deg", "Go to bed", "A dormir", "Geh schlafen", "Vai dormir", "Gå och lägg dig", "Gå i seng", "Va te coucher");
o("Tilbake", "Tilbake", "Back", "Atrás", "Zurück", "Voltar", "Tillbaka", "Tilbage", "Retour");
o("Snu", "Snu", "Turn", "Girar", "Drehen", "Rodar", "Vänd", "Vend", "Tourner");
o("Større", "Større", "Bigger", "Más grande", "Größer", "Maior", "Större", "Større", "Plus grand");
o("Mindre", "Mindre", "Smaller", "Más pequeño", "Kleiner", "Menor", "Mindre", "Mindre", "Plus petit");
o("Venstre", "Venstre", "Left", "Izquierda", "Links", "Esquerda", "Vänster", "Venstre", "Gauche");
o("Høyre", "Høgre", "Right", "Derecha", "Rechts", "Direita", "Höger", "Højre", "Droite");
o("Opp", "Opp", "Up", "Arriba", "Hoch", "Cima", "Upp", "Op", "Haut");
o("Ned", "Ned", "Down", "Abajo", "Runter", "Baixo", "Ner", "Ned", "Bas");
o("Velg et bygg", "Vel eit bygg", "Choose a building", "Elige un edificio", "Wähl ein Gebäude", "Escolhe um prédio", "Välj en byggnad", "Vælg et byggeri", "Choisis un bâtiment");
o("Ferdig.", "Ferdig.", "Done.", "Listo.", "Fertig.", "Pronto.", "Klar.", "Færdig.", "Fini.");
o("Bygg steget", "Bygg steget", "Build the step", "Construye el paso", "Bau den Schritt", "Constrói o passo", "Bygg steget", "Byg trinnet", "Construis l'étape");
o("Angre", "Angre", "Undo", "Deshacer", "Rückgängig", "Desfazer", "Ångra", "Fortryd", "Annuler");
o("Formbyen", "Formbyen", "Formbyen", "Formbyen", "Formbyen", "Formbyen", "Formbyen", "Formbyen", "Formbyen");
o("Bygg en by. Pass klokka.", "Bygg ein by. Pass klokka.", "Build a city. Watch the clock.", "Construye una ciudad. Mira el reloj.", "Bau eine Stadt. Pass auf die Uhr auf.", "Constrói uma cidade. Olha o relógio.", "Bygg en stad. Passa klockan.", "Byg en by. Pas på uret.", "Construis une ville. Surveille l'horloge.");
o("Fortsett dagen", "Hald fram", "Continue the day", "Sigue el día", "Tag fortsetzen", "Continua o dia", "Fortsätt dagen", "Fortsæt dagen", "Continue la journée");
o("Ny ettermiddag", "Ny ettermiddag", "New afternoon", "Nueva tarde", "Neuer Nachmittag", "Nova tarde", "Ny eftermiddag", "Ny eftermiddag", "Nouvel après-midi");
o("Dagboka", "Dagboka", "Diary", "Diario", "Tagebuch", "Diário", "Dagboken", "Dagbogen", "Journal");
o("Innstillinger", "Innstillingar", "Settings", "Ajustes", "Einstellungen", "Definições", "Inställningar", "Indstillinger", "Réglages");
o("Installer", "Installer", "Install", "Instalar", "Installieren", "Instalar", "Installera", "Installer", "Installer");
o("Om appen", "Om appen", "About", "Acerca de", "Über die App", "Sobre a app", "Om appen", "Om appen", "À propos");
o("Voksen", "Vaksen", "Adult", "Adulto", "Erwachsene", "Adulto", "Vuxen", "Voksen", "Adulte");
o("Hvem bygger?", "Kven byggjer?", "Who is building?", "¿Quién construye?", "Wer baut?", "Quem constrói?", "Vem bygger?", "Hvem bygger?", "Qui construit ?");
o("Byggmester", "Byggmeister", "Builder", "Constructor", "Baumeister", "Construtor", "Byggmästare", "Bygmester", "Bâtisseur");
o("Klar", "Klar", "Ready", "Listo", "Bereit", "Pronto", "Klar", "Klar", "Prêt");
o("Lyd er på", "Lyden er på", "Sound is on", "El sonido está activado", "Ton ist an", "O som está ligado", "Ljudet är på", "Lyden er til", "Le son est allumé");
o("Lyd er av", "Lyden er av", "Sound is off", "El sonido está apagado", "Ton ist aus", "O som está desligado", "Ljudet är av", "Lyden er fra", "Le son est éteint");
o("Digital klokke er skjult", "Digital klokke er skjult", "Digital clock is hidden", "El reloj digital está oculto", "Digitaluhr ist versteckt", "O relógio digital está oculto", "Digital klocka är dold", "Digitalt ur er skjult", "L'horloge digitale est cachée");
o("Digital klokke vises", "Digital klokke blir vist", "Digital clock is shown", "El reloj digital se muestra", "Digitaluhr wird gezeigt", "O relógio digital é mostrado", "Digital klocka visas", "Digitalt ur vises", "L'horloge digitale est affichée");
o("Etter første besøk kan du spille uten nett.", "Etter første besøk kan du spele utan nett.", "After the first visit you can play offline.", "Tras la primera visita puedes jugar sin red.", "Nach dem ersten Besuch kannst du offline spielen.", "Depois da primeira visita podes jogar sem rede.", "Efter första besöket kan du spela utan nät.", "Efter første besøg kan du spille uden net.", "Après la première visite, tu peux jouer hors ligne.");
o("Sjekk for oppdateringer", "Sjekk for oppdateringar", "Check for updates", "Buscar actualizaciones", "Nach Updates suchen", "Procurar atualizações", "Sök efter uppdateringar", "Søg efter opdateringer", "Chercher des mises à jour");
o("For voksne", "For vaksne", "For adults", "Para adultos", "Für Erwachsene", "Para adultos", "För vuxna", "For voksne", "Pour les adultes");
o("Åpne", "Opne", "Open", "Abrir", "Öffnen", "Abrir", "Öppna", "Åbn", "Ouvrir");
o("Mestring", "Mestring", "Progress", "Progreso", "Fortschritt", "Progresso", "Utveckling", "Mestring", "Progrès");
o("Tidsrom er på", "Tidsrom er på", "Time spans are on", "Los intervalos están activados", "Zeitspannen sind an", "Os intervalos estão ligados", "Tidsspann är på", "Tidsrum er til", "Les durées sont activées");
o("Tidsrom er av", "Tidsrom er av", "Time spans are off", "Los intervalos están apagados", "Zeitspannen sind aus", "Os intervalos estão desligados", "Tidsspann är av", "Tidsrum er fra", "Les durées sont désactivées");
o("Dagbokliste er på", "Dagbokliste er på", "Diary list is on", "La lista del diario está activada", "Tagebuchliste ist an", "A lista do diário está ligada", "Dagbokslistan är på", "Dagbogslisten er til", "La liste du journal est activée");
o("Dagbokliste er av", "Dagbokliste er av", "Diary list is off", "La lista del diario está apagada", "Tagebuchliste ist aus", "A lista do diário está desligada", "Dagbokslistan är av", "Dagbogslisten er fra", "La liste du journal est désactivée");
o("Faste avtaler", "Faste avtalar", "Regular plans", "Citas fijas", "Feste Termine", "Planos fixos", "Fasta tider", "Faste aftaler", "Rendez-vous fixes");
o("Fest avtale", "Fest avtale", "Pin a plan", "Fijar cita", "Termin festlegen", "Fixar plano", "Fäst en tid", "Fastgør aftale", "Épingler un rendez-vous");
o("Eksporter byen", "Eksporter byen", "Export the city", "Exportar la ciudad", "Stadt exportieren", "Exportar a cidade", "Exportera staden", "Eksportér byen", "Exporter la ville");
o("Slette byen på denne telefonen?", "Slette byen på denne telefonen?", "Delete the city on this phone?", "¿Borrar la ciudad en este teléfono?", "Stadt auf diesem Telefon löschen?", "Apagar a cidade neste telefone?", "Radera staden på den här telefonen?", "Slette byen på denne telefon?", "Effacer la ville sur ce téléphone ?");
o("Ja, slett", "Ja, slett", "Yes, delete", "Sí, borrar", "Ja, löschen", "Sim, apagar", "Ja, radera", "Ja, slet", "Oui, effacer");
o("Nullstill byen", "Nullstill byen", "Reset the city", "Reiniciar la ciudad", "Stadt zurücksetzen", "Repor a cidade", "Nollställ staden", "Nulstil byen", "Réinitialiser la ville");
o("Et byggespill om former og klokka for 1. og 2. klasse. Riktige svar gir materialer. Ingenting som er bygget, forsvinner.", "Eit byggespel om former og klokka for 1. og 2. klasse. Rette svar gir materiale. Ingenting som er bygd, forsvinn.", "A building game about shapes and the clock for grades 1 and 2. Right answers give materials. Nothing you have built disappears.", "Un juego de construir sobre formas y el reloj para 1.º y 2.º. Las respuestas buenas dan materiales. Nada de lo construido desaparece.", "Ein Bauspiel über Formen und die Uhr für Klasse 1 und 2. Richtige Antworten geben Material. Gebautes bleibt.", "Um jogo de construir sobre formas e o relógio para o 1.º e o 2.º ano. Respostas certas dão materiais. Nada do que construíste desaparece.", "Ett byggspel om former och klockan för årskurs 1 och 2. Rätta svar ger material. Inget som är byggt försvinner.", "Et byggespil om former og uret for 1. og 2. klasse. Rigtige svar giver materialer. Intet der er bygget, forsvinder.", "Un jeu de construction sur les formes et l'heure pour le CP et le CE1. Les bonnes réponses donnent des matériaux. Rien de construit ne disparaît.");
o("Personvern", "Personvern", "Privacy", "Privacidad", "Datenschutz", "Privacidade", "Integritet", "Privatliv", "Confidentialité");
o("Ingen konto. Ingen sky. Ingen analyse. Byen ligger bare på telefonen. Du kan eksportere den som fil.", "Ingen konto. Ingen sky. Ingen analyse. Byen ligg berre på telefonen. Du kan eksportere han som fil.", "No account. No cloud. No analytics. The city stays on the phone. You can export it as a file.", "Sin cuenta. Sin nube. Sin análisis. La ciudad se queda en el teléfono. Puedes exportarla como archivo.", "Kein Konto. Keine Cloud. Keine Analyse. Die Stadt bleibt auf dem Telefon. Du kannst sie als Datei exportieren.", "Sem conta. Sem nuvem. Sem análise. A cidade fica no telefone. Podes exportá-la como ficheiro.", "Inget konto. Inget moln. Ingen analys. Staden ligger bara på telefonen. Du kan exportera den som fil.", "Ingen konto. Ingen sky. Ingen analyse. Byen ligger kun på telefonen. Du kan eksportere den som fil.", "Pas de compte. Pas de cloud. Pas d'analyse. La ville reste sur le téléphone. Tu peux l'exporter en fichier.");
o("Ideen er Reidar Kind sin. Utviklet ved hjelp av AI.", "Ideen er Reidar Kind sin. Utvikla ved hjelp av AI.", "The idea is Reidar Kind's. Developed with the help of AI.", "La idea es de Reidar Kind. Desarrollado con ayuda de IA.", "Die Idee ist von Reidar Kind. Entwickelt mit Hilfe von KI.", "A ideia é de Reidar Kind. Desenvolvido com ajuda de IA.", "Idén är Reidar Kinds. Utvecklad med hjälp av AI.", "Ideen er Reidar Kinds. Udviklet ved hjælp af AI.", "L'idée est de Reidar Kind. Développé avec l'aide de l'IA.");
o("Andre apper", "Andre appar", "Other apps", "Otras apps", "Andere Apps", "Outras apps", "Andra appar", "Andre apps", "Autres applis");
o("Formbyen er en nettside du legger på hjemskjermen. Den ligger ikke i App Store.", "Formbyen er ei nettside du legg på heimeskjermen. Ho ligg ikkje i App Store.", "Formbyen is a website you put on the home screen. It is not in the App Store.", "Formbyen es una web que pones en la pantalla de inicio. No está en App Store.", "Formbyen ist eine Webseite für den Startbildschirm. Sie ist nicht im App Store.", "Formbyen é um site que pões no ecrã inicial. Não está na App Store.", "Formbyen är en webbplats du lägger på hemskärmen. Den finns inte i App Store.", "Formbyen er en webside, du lægger på hjemmeskærmen. Den ligger ikke i App Store.", "Formbyen est un site à mettre sur l'écran d'accueil. Il n'est pas dans l'App Store.");
o("Åpne Formbyen i Safari.", "Opne Formbyen i Safari.", "Open Formbyen in Safari.", "Abre Formbyen en Safari.", "Öffne Formbyen in Safari.", "Abre Formbyen no Safari.", "Öppna Formbyen i Safari.", "Åbn Formbyen i Safari.", "Ouvre Formbyen dans Safari.");
o("Trykk Del.", "Trykk Del.", "Tap Share.", "Pulsa Compartir.", "Tippe auf Teilen.", "Toca Partilhar.", "Tryck på Dela.", "Tryk på Del.", "Appuie sur Partager.");
o("Trykk Legg til på Hjem-skjerm.", "Trykk Legg til på Heim-skjerm.", "Tap Add to Home Screen.", "Pulsa Añadir a inicio.", "Tippe auf Zum Home-Bildschirm.", "Toca Adicionar ao ecrã principal.", "Tryck på Lägg till på hemskärmen.", "Tryk på Føj til hjemmeskærm.", "Appuie sur Sur l'écran d'accueil.");
o("Åpne Formbyen i Chrome.", "Opne Formbyen i Chrome.", "Open Formbyen in Chrome.", "Abre Formbyen en Chrome.", "Öffne Formbyen in Chrome.", "Abre Formbyen no Chrome.", "Öppna Formbyen i Chrome.", "Åbn Formbyen i Chrome.", "Ouvre Formbyen dans Chrome.");
o("Trykk menyen og Installer app.", "Trykk menyen og Installer app.", "Tap the menu and Install app.", "Pulsa el menú e Instalar app.", "Tippe auf das Menü und App installieren.", "Toca o menu e Instalar app.", "Tryck på menyn och Installera app.", "Tryk på menuen og Installer app.", "Appuie sur le menu et Installer l'appli.");
o("Når du har åpnet appen én gang, kan du spille uten nett.", "Når du har opna appen éin gong, kan du spele utan nett.", "After you have opened the app once, you can play offline.", "Cuando hayas abierto la app una vez, puedes jugar sin red.", "Wenn du die App einmal geöffnet hast, kannst du offline spielen.", "Depois de abrires a app uma vez, podes jogar sem rede.", "När du har öppnat appen en gång kan du spela utan nät.", "Når du har åbnet appen én gang, kan du spille uden net.", "Après avoir ouvert l'appli une fois, tu peux jouer hors ligne.");
o("Ingen dager ennå.", "Ingen dagar enno.", "No days yet.", "Aún no hay días.", "Noch keine Tage.", "Ainda não há dias.", "Inga dagar än.", "Ingen dage endnu.", "Pas encore de jours.");
o("Fotoalbum", "Fotoalbum", "Photo album", "Álbum de fotos", "Fotoalbum", "Álbum de fotos", "Fotoalbum", "Fotoalbum", "Album photo");
o("Del bilde", "Del bilete", "Share picture", "Compartir imagen", "Bild teilen", "Partilhar imagem", "Dela bild", "Del billede", "Partager l'image");
o("Bildene kommer når byen vokser.", "Bileta kjem når byen veks.", "Pictures come as the city grows.", "Las fotos llegan cuando la ciudad crece.", "Bilder kommen, wenn die Stadt wächst.", "As imagens chegam quando a cidade cresce.", "Bilderna kommer när staden växer.", "Billederne kommer, når byen vokser.", "Les images arrivent quand la ville grandit.");
o("Tårnuret", "Tårnuret", "The tower clock", "El reloj de la torre", "Die Turmuhr", "O relógio da torre", "Tornuret", "Tårnuret", "L'horloge de la tour");
o("Kvelden kommer", "Kvelden kjem", "Evening comes", "Llega la tarde", "Der Abend kommt", "A noite chega", "Kvällen kommer", "Aftenen kommer", "Le soir arrive");
o("Til menyen", "Til menyen", "To the menu", "Al menú", "Zum Menü", "Para o menu", "Till menyn", "Til menuen", "Vers le menu");
o("Ny versjon.", "Ny versjon.", "New version.", "Nueva versión.", "Neue Version.", "Nova versão.", "Ny version.", "Ny version.", "Nouvelle version.");
o("Åpne på nytt", "Opne på nytt", "Open again", "Abrir de nuevo", "Neu öffnen", "Abrir de novo", "Öppna igen", "Åbn igen", "Rouvrir");
o("Filen passet ikke.", "Fila passa ikkje.", "The file did not fit.", "El archivo no encajó.", "Die Datei passte nicht.", "O ficheiro não serviu.", "Filen passade inte.", "Filen passede ikke.", "Le fichier ne convenait pas.");
o("1. klasse", "1. klasse", "Grade 1", "1.º", "1. Klasse", "1.º ano", "Årskurs 1", "1. klasse", "CP");
o("2. klasse", "2. klasse", "Grade 2", "2.º", "2. Klasse", "2.º ano", "Årskurs 2", "2. klasse", "CE1");
o("Utfordrende", "Utfordrande", "Challenge", "Desafío", "Herausforderung", "Desafio", "Utmaning", "Udfordring", "Défi");
o("Blandet", "Blanda", "Mixed", "Mezclado", "Gemischt", "Misturado", "Blandat", "Blandet", "Mélangé");
o("Klokke og kalender", "Klokke og kalender", "Clock and calendar", "Reloj y calendario", "Uhr und Kalender", "Relógio e calendário", "Klocka och kalender", "Ur og kalender", "Horloge et calendrier");
o("Former", "Former", "Shapes", "Formas", "Formen", "Formas", "Former", "Former", "Formes");
o("3D og måling", "3D og måling", "3D and measuring", "3D y medida", "3D und Messen", "3D e medida", "3D och mätning", "3D og måling", "3D et mesure");
o("Sjekker…", "Sjekkar…", "Checking…", "Comprobando…", "Prüfe…", "A verificar…", "Kontrollerar…", "Tjekker…", "Vérification…");
o("Du spiller fra telefonen. Prøv igjen når du er på nett.", "Du speler frå telefonen. Prøv igjen når du er på nett.", "You are playing from the phone. Try again when you are online.", "Juegas desde el teléfono. Inténtalo cuando tengas red.", "Du spielst vom Telefon. Versuch es wieder, wenn du online bist.", "Estás a jogar a partir do telefone. Tenta outra vez quando tiveres rede.", "Du spelar från telefonen. Försök igen när du är uppkopplad.", "Du spiller fra telefonen. Prøv igen, når du er på nettet.", "Tu joues depuis le téléphone. Réessaie quand tu es en ligne.");
o("Du har nyeste.", "Du har nyaste.", "You have the newest.", "Tienes la más nueva.", "Du hast die neueste.", "Tens a mais recente.", "Du har den senaste.", "Du har den nyeste.", "Tu as la plus récente.");
o("Ny versjon. Åpne appen på nytt.", "Ny versjon. Opne appen på nytt.", "New version. Open the app again.", "Nueva versión. Abre la app de nuevo.", "Neue Version. Öffne die App neu.", "Nova versão. Abre a app de novo.", "Ny version. Öppna appen igen.", "Ny version. Åbn appen igen.", "Nouvelle version. Rouvre l'appli.");
o("Klarte ikke å sjekke. Prøv igjen.", "Klarte ikkje å sjekke. Prøv igjen.", "Could not check. Try again.", "No se pudo comprobar. Inténtalo otra vez.", "Konnte nicht prüfen. Versuch es noch einmal.", "Não foi possível verificar. Tenta outra vez.", "Kunde inte kontrollera. Försök igen.", "Kunne ikke tjekke. Prøv igen.", "Impossible de vérifier. Essaie encore.");
o("Nivå {n}", "Nivå {n}", "Level {n}", "Nivel {n}", "Stufe {n}", "Nível {n}", "Nivå {n}", "Niveau {n}", "Niveau {n}");
o("Skolen slutter etter {fag}", "Skulen sluttar etter {fag}", "School ends after {fag}", "El cole termina después de {fag}", "Die Schule endet nach {fag}", "A escola acaba depois de {fag}", "Skolan slutar efter {fag}", "Skolen slutter efter {fag}", "L'école finit après {fag}");
o("Skolen slutter", "Skulen sluttar", "School ends", "El cole termina", "Die Schule endet", "A escola acaba", "Skolan slutar", "Skolen slutter", "L'école finit");
o("Butikk {fra}–{til}", "Butikk {fra}–{til}", "Shop {fra}–{til}", "Tienda {fra}–{til}", "Laden {fra}–{til}", "Loja {fra}–{til}", "Butik {fra}–{til}", "Butik {fra}–{til}", "Boutique {fra}–{til}");
o("Ja", "Ja", "Yes", "Sí", "Ja", "Sim", "Ja", "Ja", "Oui");
o("Nei", "Nei", "No", "No", "Nein", "Não", "Nej", "Nej", "Non");
o("Åpen", "Open", "Open", "Abierta", "Offen", "Aberta", "Öppen", "Åben", "Ouverte");
o("Stengt", "Stengt", "Closed", "Cerrada", "Zu", "Fechada", "Stängd", "Lukket", "Fermée");
o("Rund", "Rund", "Round", "Redonda", "Rund", "Redonda", "Rund", "Rund", "Ronde");
o("Ikke rund", "Ikkje rund", "Not round", "No redonda", "Nicht rund", "Não redonda", "Inte rund", "Ikke rund", "Pas ronde");
o("Er butikken åpen nå?", "Er butikken open no?", "Is the shop open now?", "¿Está abierta la tienda ahora?", "Hat der Laden jetzt offen?", "A loja está aberta agora?", "Är butiken öppen nu?", "Er butikken åben nu?", "La boutique est ouverte maintenant ?");
o("Gå til butikken først.", "Gå til butikken først.", "Go to the shop first.", "Ve primero a la tienda.", "Geh zuerst zum Laden.", "Vai primeiro à loja.", "Gå till butiken först.", "Gå til butikken først.", "Va d'abord à la boutique.");
o("Butikken er åpen. Du kan handle.", "Butikken er open. Du kan handle.", "The shop is open. You can shop.", "La tienda está abierta. Puedes comprar.", "Der Laden ist offen. Du kannst einkaufen.", "A loja está aberta. Podes comprar.", "Butiken är öppen. Du kan handla.", "Butikken er åben. Du kan handle.", "La boutique est ouverte. Tu peux acheter.");
o("Fint! Varene er i kurven.", "Fint! Varene er i korga.", "Good! The parts are in the basket.", "¡Bien! Las piezas están en la cesta.", "Gut! Die Teile sind im Korb.", "Bom! As peças estão no cesto.", "Bra! Delarna är i korgen.", "Fint! Delene er i kurven.", "Bien ! Les pièces sont dans le panier.");
o("Riktig!", "Rett!", "Right!", "¡Bien!", "Richtig!", "Certo!", "Rätt!", "Rigtigt!", "Juste !");
o("Den tomta passer ikke.", "Den tomta passar ikkje.", "That plot does not fit.", "Ese solar no encaja.", "Das Grundstück passt nicht.", "Esse lote não serve.", "Den tomten passar inte.", "Den grund passer ikke.", "Ce terrain ne convient pas.");
o("Bygget er ferdig.", "Bygget er ferdig.", "The building is done.", "El edificio está listo.", "Das Gebäude ist fertig.", "O prédio está pronto.", "Byggnaden är klar.", "Byggeriet er færdigt.", "Le bâtiment est fini.");
o("Du trenger delen. Gå til butikken.", "Du treng delen. Gå til butikken.", "You need the part. Go to the shop.", "Necesitas la pieza. Ve a la tienda.", "Du brauchst das Teil. Geh zum Laden.", "Precisas da peça. Vai à loja.", "Du behöver delen. Gå till butiken.", "Du mangler delen. Gå til butikken.", "Il te faut la pièce. Va à la boutique.");
o("Bygget er ferdig!", "Bygget er ferdig!", "The building is done!", "¡El edificio está listo!", "Das Gebäude ist fertig!", "O prédio está pronto!", "Byggnaden är klar!", "Byggeriet er færdigt!", "Le bâtiment est fini !");
o("Delen er tilbake i kurven.", "Delen er tilbake i korga.", "The part is back in the basket.", "La pieza está otra vez en la cesta.", "Das Teil ist wieder im Korb.", "A peça voltou ao cesto.", "Delen är tillbaka i korgen.", "Delen er tilbage i kurven.", "La pièce est de retour dans le panier.");
o("Du trenger to mynter.", "Du treng to myntar.", "You need two coins.", "Necesitas dos monedas.", "Du brauchst zwei Münzen.", "Precisas de duas moedas.", "Du behöver två mynt.", "Du mangler to mønter.", "Il te faut deux pièces.");
o("Der er det ikke plass.", "Der er det ikkje plass.", "There is no room there.", "Ahí no hay sitio.", "Da ist kein Platz.", "Aí não há espaço.", "Där finns det inte plats.", "Der er der ikke plads.", "Il n'y a pas de place là.");
o("Du rakk alt. En stjerne i dagboka!", "Du rakk alt. Ei stjerne i dagboka!", "You made everything. A star in the diary!", "Llegaste a todo. ¡Una estrella en el diario!", "Du hast alles geschafft. Ein Stern im Tagebuch!", "Chegaste a tudo. Uma estrela no diário!", "Du hann allt. En stjärna i dagboken!", "Du nåede alt. En stjerne i dagbogen!", "Tu as tout eu. Une étoile dans le journal !");
o("Dagen er slutt. Byen står der i morgen.", "Dagen er slutt. Byen står der i morgon.", "The day is over. The city will be there tomorrow.", "El día terminó. La ciudad sigue mañana.", "Der Tag ist vorbei. Die Stadt steht morgen noch.", "O dia acabou. A cidade fica lá amanhã.", "Dagen är slut. Staden står kvar i morgon.", "Dagen er slut. Byen står der i morgen.", "La journée est finie. La ville sera là demain.");
o("Vi spiste klokka {a}, nå er den {b}.", "Vi åt klokka {a}, no er den {b}.", "We ate at {a}. Now it is {b}.", "Comimos a {a}. Ahora son {b}.", "Wir haben um {a} gegessen. Jetzt ist es {b}.", "Comemos às {a}. Agora são {b}.", "Vi åt klockan {a}, nu är den {b}.", "Vi spiste klokken {a}, nu er den {b}.", "Nous avons mangé à {a}. Maintenant il est {b}.");
o("{navn} har begynt. Du kan likevel komme.", "{navn} har begynt. Du kan likevel kome.", "{navn} has started. You can still come.", "{navn} ha empezado. Aún puedes llegar.", "{navn} hat begonnen. Du kannst trotzdem kommen.", "{navn} já começou. Ainda podes chegar.", "{navn} har börjat. Du kan ändå komma.", "{navn} er begyndt. Du kan stadig komme.", "{navn} a commencé. Tu peux encore venir.");
o("Åpner i morgen kl. {tid}", "Opnar i morgon kl. {tid}", "Opens tomorrow at {tid}", "Abre mañana a las {tid}", "Öffnet morgen um {tid}", "Abre amanhã às {tid}", "Öppnar i morgon kl. {tid}", "Åbner i morgen kl. {tid}", "Ouvre demain à {tid}");
o("ekspeditøren", "ekspeditøren", "the shopkeeper", "el tendero", "der Verkäufer", "o vendedor", "expediten", "ekspedienten", "le vendeur");
o("naboen", "naboen", "the neighbor", "el vecino", "der Nachbar", "o vizinho", "grannen", "naboen", "le voisin");
o("treneren", "trenaren", "the coach", "el entrenador", "der Trainer", "o treinador", "tränaren", "træneren", "l'entraîneur");
o("skiltet", "skiltet", "the sign", "el cartel", "das Schild", "a placa", "skylten", "skiltet", "le panneau");
o("lappen", "lappen", "the note", "la nota", "der Zettel", "o recado", "lappen", "sedlen", "le mot");
o("kjæledyret", "kjæledyret", "the pet", "la mascota", "das Haustier", "o animal", "husdjuret", "kæledyret", "l'animal");
o("Still klokka til {ord}.", "Still klokka til {ord}.", "Set the clock to {ord}.", "Pon el reloj en {ord}.", "Stelle die Uhr auf {ord}.", "Põe o relógio em {ord}.", "Ställ klockan på {ord}.", "Stil uret på {ord}.", "Mets l'horloge sur {ord}.");
o("Butikken åpner klokka {ord}. Vis det.", "Butikken opnar klokka {ord}. Vis det.", "The shop opens at {ord}. Show it.", "La tienda abre a {ord}. Muéstralo.", "Der Laden öffnet um {ord}. Zeig es.", "A loja abre às {ord}. Mostra.", "Butiken öppnar {ord}. Visa det.", "Butikken åbner {ord}. Vis det.", "La boutique ouvre à {ord}. Montre-le.");
o("Middagen er klokka {ord}. Still klokka.", "Middagen er klokka {ord}. Still klokka.", "Dinner is at {ord}. Set the clock.", "La cena es a {ord}. Pon el reloj.", "Das Abendessen ist um {ord}. Stelle die Uhr.", "O jantar é às {ord}. Põe o relógio.", "Middagen är {ord}. Ställ klockan.", "Middagen er {ord}. Stil uret.", "Le dîner est à {ord}. Mets l'horloge.");
o("Leggetid er klokka {ord}. Vis det.", "Leggetid er klokka {ord}. Vis det.", "Bedtime is {ord}. Show it.", "La hora de dormir es {ord}. Muéstralo.", "Schlafenszeit ist {ord}. Zeig es.", "A hora de deitar é {ord}. Mostra.", "Läggdags är {ord}. Visa det.", "Sengetid er {ord}. Vis det.", "L'heure du coucher est {ord}. Montre-le.");
o("Avtalen starter klokka {ord}. Still viserne.", "Avtala startar klokka {ord}. Still visarane.", "The plan starts at {ord}. Set the hands.", "La cita empieza a {ord}. Pon las agujas.", "Der Termin beginnt um {ord}. Stelle die Zeiger.", "O plano começa às {ord}. Põe os ponteiros.", "Avtalet börjar {ord}. Ställ visarna.", "Aftalen starter {ord}. Stil viserne.", "Le rendez-vous commence à {ord}. Mets les aiguilles.");
o("Vis klokka {ord}. Den er halvveis til {neste}.", "Vis klokka {ord}. Den er halvveis til {neste}.", "Show {ord}. That is thirty minutes after {denne}.", "Muestra {ord}. Son treinta minutos después de {denne}.", "Zeige {ord}. Das ist halbwegs bis {neste}.", "Mostra {ord}. São trinta minutos depois de {denne}.", "Visa {ord}. Den är halvvägs till {neste}.", "Vis {ord}. Den er halvvejs til {neste}.", "Montre {ord}. C'est trente minutes après {denne}.");
o("Vis klokka {ord}.", "Vis klokka {ord}.", "Show {ord}.", "Muestra {ord}.", "Zeige {ord}.", "Mostra {ord}.", "Visa {ord}.", "Vis {ord}.", "Montre {ord}.");
o("Skriv tiden digitalt: {digital}.", "Skriv tida digitalt: {digital}.", "Write the time in digits: {digital}.", "Escribe la hora en cifras: {digital}.", "Schreib die Zeit digital: {digital}.", "Escreve a hora em dígitos: {digital}.", "Skriv tiden digitalt: {digital}.", "Skriv tiden digitalt: {digital}.", "Écris l'heure en chiffres : {digital}.");
o("{hvem} sier klokka {ord}. Still klokka.", "{hvem} seier klokka {ord}. Still klokka.", "{hvem} says {ord}. Set the clock.", "{hvem} dice {ord}. Pon el reloj.", "{hvem} sagt {ord}. Stelle die Uhr.", "{hvem} diz {ord}. Põe o relógio.", "{hvem} säger {ord}. Ställ klockan.", "{hvem} siger {ord}. Stil uret.", "{hvem} dit {ord}. Mets l'horloge.");
o("Tårnuret har stoppet. Still det til klokka {ord}.", "Tårnuret har stoppa. Still det til klokka {ord}.", "The tower clock has stopped. Set it to {ord}.", "El reloj de la torre se ha parado. Ponlo en {ord}.", "Die Turmuhr ist stehen geblieben. Stelle sie auf {ord}.", "O relógio da torre parou. Põe-no em {ord}.", "Tornuret har stannat. Ställ det på {ord}.", "Tårnuret er stoppet. Stil det på {ord}.", "L'horloge de la tour s'est arrêtée. Mets-la sur {ord}.");
o("Lappen sier klokka {ord}. Still klokka.", "Lappen seier klokka {ord}. Still klokka.", "The note says {ord}. Set the clock.", "La nota dice {ord}. Pon el reloj.", "Der Zettel sagt {ord}. Stelle die Uhr.", "O recado diz {ord}. Põe o relógio.", "Lappen säger {ord}. Ställ klockan.", "Sedlen siger {ord}. Stil uret.", "Le mot dit {ord}. Mets l'horloge.");
o("Hvilket ord passer til klokka?", "Kva for ord passar til klokka?", "Which words match the clock?", "¿Qué palabras van con el reloj?", "Welches Wort passt zur Uhr?", "Que palavras combinam com o relógio?", "Vilket ord passar till klockan?", "Hvilket ord passer til uret?", "Quels mots vont avec l'horloge ?");
o("Hvilken digital tid passer?", "Kva for digital tid passar?", "Which digital time matches?", "¿Qué hora digital encaja?", "Welche Digitalzeit passt?", "Que hora digital combina?", "Vilken digital tid passar?", "Hvilken digital tid passer?", "Quelle heure digitale convient ?");
o("Hvilken klokke viser tiden?", "Kva for klokke viser tida?", "Which clock shows the time?", "¿Qué reloj muestra la hora?", "Welche Uhr zeigt die Zeit?", "Que relógio mostra a hora?", "Vilken klocka visar tiden?", "Hvilket ur viser tiden?", "Quelle horloge montre l'heure ?");
o("Stemmer det at klokka er {ord}?", "Stemmer det at klokka er {ord}?", "Is the clock really {ord}?", "¿Es verdad que son {ord}?", "Stimmt es, dass es {ord} ist?", "É verdade que são {ord}?", "Stämmer det att klockan är {ord}?", "Passer det, at klokken er {ord}?", "Est-ce bien {ord} ?");
o("Hvilken tid passer ikke til klokka?", "Kva for tid passar ikkje til klokka?", "Which time does not match the clock?", "¿Qué hora no encaja con el reloj?", "Welche Zeit passt nicht zur Uhr?", "Que hora não combina com o relógio?", "Vilken tid passar inte till klockan?", "Hvilken tid passer ikke til uret?", "Quelle heure ne va pas avec l'horloge ?");
o("Hva er {ord}?", "Kva er {ord}?", "What is {ord}?", "¿Qué es {ord}?", "Was ist {ord}?", "O que é {ord}?", "Vad är {ord}?", "Hvad er {ord}?", "C'est quoi, {ord} ?");
o("Hva er klokka om en halvtime?", "Kva er klokka om ein halvtime?", "What time is it in half an hour?", "¿Qué hora es dentro de media hora?", "Wie spät ist es in einer halben Stunde?", "Que horas são daqui a meia hora?", "Vad är klockan om en halvtimme?", "Hvad er klokken om en halv time?", "Quelle heure sera-t-il dans une demi-heure ?");
o("Hva er klokka om en time?", "Kva er klokka om ein time?", "What time is it in one hour?", "¿Qué hora es dentro de una hora?", "Wie spät ist es in einer Stunde?", "Que horas são daqui a uma hora?", "Vad är klockan om en timme?", "Hvad er klokken om en time?", "Quelle heure sera-t-il dans une heure ?");
o("Når stenger butikken?", "Når stengjer butikken?", "When does the shop close?", "¿Cuándo cierra la tienda?", "Wann schließt der Laden?", "Quando fecha a loja?", "När stänger butiken?", "Hvornår lukker butikken?", "Quand ferme la boutique ?");
o("Når er middagen?", "Når er middagen?", "When is dinner?", "¿Cuándo es la cena?", "Wann ist das Abendessen?", "Quando é o jantar?", "När är middagen?", "Hvornår er middagen?", "C'est quand, le dîner ?");
o("Tårnuret viser feil. Hvilken er rett?", "Tårnuret viser feil. Kva for ei er rett?", "The tower clock is wrong. Which one is right?", "El reloj de la torre está mal. ¿Cuál es el bueno?", "Die Turmuhr zeigt falsch. Welche stimmt?", "O relógio da torre está errado. Qual é o certo?", "Tornuret visar fel. Vilken är rätt?", "Tårnuret viser forkert. Hvilket er rigtigt?", "L'horloge de la tour est fausse. Laquelle est juste ?");
o("Hvilken tid på dagen er dette?", "Kva for tid på dagen er dette?", "What time of day is this?", "¿Qué momento del día es?", "Welche Tageszeit ist das?", "Que parte do dia é esta?", "Vilken tid på dagen är det?", "Hvilken tid på dagen er det?", "C'est quel moment de la journée ?");
o("Hvilken tid viser klokka?", "Kva for tid viser klokka?", "What time does the clock show?", "¿Qué hora marca el reloj?", "Welche Zeit zeigt die Uhr?", "Que horas mostra o relógio?", "Vilken tid visar klockan?", "Hvilken tid viser uret?", "Quelle heure indique l'horloge ?");
o("Du bruker {min} minutter. Rekker du fristen?", "Du brukar {min} minutt. Rekk du fristen?", "It takes {min} minutes. Will you make it?", "Tardas {min} minutos. ¿Llegas a tiempo?", "Du brauchst {min} Minuten. Schaffst du es?", "Demoras {min} minutos. Chegas a tempo?", "Det tar {min} minuter. Hinner du?", "Du bruger {min} minutter. Når du det?", "Ça prend {min} minutes. Tu arrives à temps ?");
o("Fra {fra} til {til}. Hvor mange timer?", "Frå {fra} til {til}. Kor mange timar?", "From {fra} to {til}. How many hours?", "De {fra} a {til}. ¿Cuántas horas?", "Von {fra} bis {til}. Wie viele Stunden?", "De {fra} até {til}. Quantas horas?", "Från {fra} till {til}. Hur många timmar?", "Fra {fra} til {til}. Hvor mange timer?", "De {fra} à {til}. Combien d'heures ?");
o("Fra {fra} til {til}. Hvor mange halve timer?", "Frå {fra} til {til}. Kor mange halve timar?", "From {fra} to {til}. How many half hours?", "De {fra} a {til}. ¿Cuántas medias horas?", "Von {fra} bis {til}. Wie viele halbe Stunden?", "De {fra} até {til}. Quantas meias horas?", "Från {fra} till {til}. Hur många halvtimmar?", "Fra {fra} til {til}. Hvor mange halve timer?", "De {fra} à {til}. Combien de demi-heures ?");
o("Hvilken dag er avtalen?", "Kva for dag er avtala?", "Which day is the plan?", "¿Qué día es la cita?", "Welcher Tag ist der Termin?", "Que dia é o plano?", "Vilken dag är avtalet?", "Hvilken dag er aftalen?", "Quel jour est le rendez-vous ?");
o("Hvilken årstid er det?", "Kva for årstid er det?", "Which season is it?", "¿Qué estación es?", "Welche Jahreszeit ist es?", "Que estação é?", "Vilken årstid är det?", "Hvilken årstid er det?", "C'est quelle saison ?");
o("Hvilken måned er det?", "Kva for månad er det?", "Which month is it?", "¿Qué mes es?", "Welcher Monat ist es?", "Que mês é?", "Vilken månad är det?", "Hvilken måned er det?", "C'est quel mois ?");
o("Hvilken dag er i morgen?", "Kva for dag er i morgon?", "Which day is tomorrow?", "¿Qué día es mañana?", "Welcher Tag ist morgen?", "Que dia é amanhã?", "Vilken dag är i morgon?", "Hvilken dag er i morgen?", "C'est quel jour, demain ?");
o("Trykk på alle som har samme form.", "Trykk på alle som har same form.", "Tap all that have the same shape.", "Toca todas las que tienen la misma forma.", "Tippe auf alle mit derselben Form.", "Toca todas as que têm a mesma forma.", "Tryck på alla med samma form.", "Tryk på alle med samme form.", "Touche toutes celles qui ont la même forme.");
o("Hvem passer ikke inn?", "Kven passar ikkje inn?", "Which one does not fit?", "¿Cuál no encaja?", "Welche passt nicht?", "Qual não encaixa?", "Vilken passar inte in?", "Hvem passer ikke ind?", "Laquelle ne va pas ?");
o("Sorter i kassene.", "Sorter i kassane.", "Sort into the boxes.", "Ordena en las cajas.", "Sortiere in die Kisten.", "Ordena nas caixas.", "Sortera i lådorna.", "Sortér i kasserne.", "Trie dans les boîtes.");
o("Tegn formen.", "Teikn forma.", "Draw the shape.", "Dibuja la forma.", "Zeichne die Form.", "Desenha a forma.", "Rita formen.", "Tegn formen.", "Dessine la forme.");
o("Tell.", "Tel.", "Count.", "Cuenta.", "Zähl.", "Conta.", "Räkna.", "Tæl.", "Compte.");
o("Hva kommer etterpå?", "Kva kjem etterpå?", "What comes next?", "¿Qué viene después?", "Was kommt danach?", "O que vem a seguir?", "Vad kommer sedan?", "Hvad kommer bagefter?", "Qu'est-ce qui vient après ?");
o("Klossen trykkes ned i sanden. Hvilken form får merket?", "Klossen vert trykt ned i sanden. Kva for form får merket?", "The block is pressed into the sand. What shape is the mark?", "El bloque se aprieta en la arena. ¿Qué forma tiene la marca?", "Der Klotz wird in den Sand gedrückt. Welche Form hat der Abdruck?", "O bloco é apertado na areia. Que forma tem a marca?", "Klossen trycks ner i sanden. Vilken form får märket?", "Klodsen trykkes ned i sandet. Hvilken form får mærket?", "Le bloc est pressé dans le sable. Quelle forme a la marque ?");
o("Hvor mange centimeter er planken?", "Kor mange centimeter er planken?", "How many centimeters is the plank?", "¿Cuántos centímetros mide el tablón?", "Wie viele Zentimeter ist die Planke?", "Quantos centímetros tem a tábua?", "Hur många centimeter är plankan?", "Hvor mange centimeter er planken?", "Combien de centimètres fait la planche ?");
o("Hvor mange klosser lang er planken?", "Kor mange klossar lang er planken?", "How many blocks long is the plank?", "¿Cuántos bloques mide el tablón?", "Wie viele Klötze lang ist die Planke?", "Quantos blocos tem a tábua?", "Hur många klossar lång är plankan?", "Hvor mange klodser lang er planken?", "La planche fait combien de blocs ?");
o("Hvor mange kilo veier sekken?", "Kor mange kilo veg sekken?", "How many kilos does the sack weigh?", "¿Cuántos kilos pesa el saco?", "Wie viele Kilo wiegt der Sack?", "Quantos quilos pesa o saco?", "Hur många kilo väger säcken?", "Hvor mange kilo vejer sækken?", "Le sac pèse combien de kilos ?");
o("Hvor mange {vare} veier like mye?", "Kor mange {vare} veg like mykje?", "How many {vare} weigh the same?", "¿Cuántos {vare} pesan lo mismo?", "Wie viele {vare} wiegen gleich viel?", "Quantos {vare} pesam o mesmo?", "Hur många {vare} väger lika mycket?", "Hvor mange {vare} vejer det samme?", "Combien de {vare} pèsent pareil ?");
o("Hvilken tomt er størst?", "Kva for tomt er størst?", "Which plot is the largest?", "¿Qué solar es el más grande?", "Welches Grundstück ist am größten?", "Que lote é o maior?", "Vilken tomt är störst?", "Hvilken grund er størst?", "Quel terrain est le plus grand ?");
o("Hvilken tomt har akkurat nok plass?", "Kva for tomt har akkurat nok plass?", "Which plot has just enough room?", "¿Qué solar tiene justo el sitio?", "Welches Grundstück hat genau genug Platz?", "Que lote tem espaço certo?", "Vilken tomt har precis plats?", "Hvilken grund har lige plads nok?", "Quel terrain a juste assez de place ?");
o("Hvor skal du bygge?", "Kor skal du byggje?", "Where will you build?", "¿Dónde vas a construir?", "Wo wirst du bauen?", "Onde vais construir?", "Var ska du bygga?", "Hvor skal du bygge?", "Où vas-tu construire ?");
o("Hvor mange småsekker veier like mye som den store?", "Kor mange småsekkar veg like mykje som den store?", "How many small sacks weigh the same as the big one?", "¿Cuántos sacos pequeños pesan como el grande?", "Wie viele kleine Säcke wiegen so viel wie der große?", "Quantos sacos pequenos pesam como o grande?", "Hur många småsäckar väger lika mycket som den stora?", "Hvor mange småsække vejer det samme som den store?", "Combien de petits sacs pèsent comme le grand ?");
o("Klokka er {ord}. Digitalt er det {digital}.", "Klokka er {ord}. Digitalt er det {digital}.", "The clock says {ord}. In digits it is {digital}.", "El reloj dice {ord}. En cifras es {digital}.", "Die Uhr sagt {ord}. Digital ist es {digital}.", "O relógio diz {ord}. Em dígitos é {digital}.", "Klockan är {ord}. Digitalt är det {digital}.", "Klokken er {ord}. Digitalt er det {digital}.", "L'horloge dit {ord}. En chiffres, il est {digital}.");
o("Det er {tall}. Følg med når de lyses opp.", "Det er {tall}. Følg med når dei lyser opp.", "There are {tall}. Watch when they light up.", "Hay {tall}. Mira cuando se encienden.", "Es sind {tall}. Schau, wenn sie aufleuchten.", "Há {tall}. Olha quando acendem.", "Det är {tall}. Följ med när de lyser upp.", "Der er {tall}. Følg med, når de lyser op.", "Il y en a {tall}. Regarde quand ils s'allument.");
o("Se tidslinjen. Den korte veien rekker, den lange gjør ikke det.", "Sjå tidslinja. Den korte vegen rekk, den lange gjer ikkje det.", "Look at the timeline. The short way makes it. The long way does not.", "Mira la línea de tiempo. El camino corto llega. El largo no.", "Sieh die Zeitlinie. Der kurze Weg schafft es. Der lange nicht.", "Olha a linha do tempo. O caminho curto chega. O longo não.", "Se tidslinjen. Den korta vägen hinner. Den långa gör det inte.", "Se tidslinjen. Den korte vej når det. Den lange gør ikke.", "Regarde la ligne du temps. Le chemin court arrive. Le long n'arrive pas.");
o("Se på bildet en gang til. Det riktige er markert.", "Sjå på biletet ein gong til. Det rette er merkt.", "Look at the picture again. The right one is marked.", "Mira el dibujo otra vez. Lo correcto está marcado.", "Sieh das Bild noch einmal an. Das Richtige ist markiert.", "Olha a imagem outra vez. O certo está marcado.", "Titta på bilden en gång till. Det rätta är markerat.", "Se på billedet en gang til. Det rigtige er markeret.", "Regarde l'image encore. La bonne est marquée.");

o("Stengt i dag.", "Stengt i dag.", "Closed today.", "Cerrada hoy.", "Heute zu.", "Fechada hoje.", "Stängd i dag.", "Lukket i dag.", "Fermée aujourd'hui.");
o("Åpner kl. {tid}", "Opnar kl. {tid}", "Opens at {tid}", "Abre a las {tid}", "Öffnet um {tid}", "Abre às {tid}", "Öppnar kl. {tid}", "Åbner kl. {tid}", "Ouvre à {tid}");
o("Stengt nå. Åpner kl. {tid}", "Stengt no. Opnar kl. {tid}", "Closed now. Opens at {tid}", "Cerrada ahora. Abre a las {tid}", "Jetzt zu. Öffnet um {tid}", "Fechada agora. Abre às {tid}", "Stängd nu. Öppnar kl. {tid}", "Lukket nu. Åbner kl. {tid}", "Fermée. Ouvre à {tid}");
o("Stengt nå. Åpner i morgen.", "Stengt no. Opnar i morgon.", "Closed now. Opens tomorrow.", "Cerrada ahora. Abre mañana.", "Jetzt zu. Öffnet morgen.", "Fechada agora. Abre amanhã.", "Stängd nu. Öppnar i morgon.", "Lukket nu. Åbner i morgen.", "Fermée. Ouvre demain.");
o("Butikken er åpen.", "Butikken er open.", "The shop is open.", "La tienda está abierta.", "Der Laden ist offen.", "A loja está aberta.", "Butiken är öppen.", "Butikken er åben.", "La boutique est ouverte.");
o("Er butikken åpen nå? Klokka er {naa}.", "Er butikken open no? Klokka er {naa}.", "Is the shop open now? It is {naa}.", "¿Está abierta la tienda ahora? Son las {naa}.", "Hat der Laden jetzt offen? Es ist {naa}.", "A loja está aberta agora? São {naa}.", "Är butiken öppen nu? Klockan är {naa}.", "Er butikken åben nu? Klokken er {naa}.", "La boutique est ouverte maintenant ? Il est {naa}.");
o("Det er ingen avtale nå.", "Det er inga avtale no.", "There is no plan right now.", "No hay ninguna cita ahora.", "Gerade ist kein Termin.", "Não há nenhum plano agora.", "Det finns ingen plan nu.", "Der er ingen aftale nu.", "Il n'y a pas de rendez-vous maintenant.");
o("{navn} varer {min} minutter. Når er den ferdig?", "{navn} varer {min} minutt. Når er den ferdig?", "{navn} lasts {min} minutes. When does it end?", "{navn} dura {min} minutos. ¿Cuándo termina?", "{navn} dauert {min} Minuten. Wann ist es fertig?", "{navn} dura {min} minutos. Quando acaba?", "{navn} varar {min} minuter. När är den klar?", "{navn} varer {min} minutter. Hvornår er den færdig?", "{navn} dure {min} minutes. Quand est-ce fini ?");
o("Vi øver mer på den senere.", "Vi øver meir på den seinare.", "We will practice that later.", "Lo practicamos luego.", "Das üben wir später.", "Praticamos isso depois.", "Vi övar mer på den senare.", "Vi øver mere på den senere.", "On s'entraînera plus tard.");
o("Tegn en {form}.", "Teikn ein {form}.", "Draw a {form}.", "Dibuja un {form}.", "Zeichne einen {form}.", "Desenha um {form}.", "Rita en {form}.", "Tegn en {form}.", "Dessine un {form}.");
o("Tegn et {form}.", "Teikn eit {form}.", "Draw a {form}.", "Dibuja un {form}.", "Zeichne ein {form}.", "Desenha um {form}.", "Rita ett {form}.", "Tegn et {form}.", "Dessine un {form}.");
o("Tell sidene.", "Tel sidene.", "Count the sides.", "Cuenta los lados.", "Zähl die Seiten.", "Conta os lados.", "Räkna sidorna.", "Tæl siderne.", "Compte les côtés.");
o("Tell hjørnene.", "Tel hjørna.", "Count the corners.", "Cuenta las esquinas.", "Zähl die Ecken.", "Conta os cantos.", "Räkna hörnen.", "Tæl hjørnerne.", "Compte les coins.");
o("Hvor mange hjørner er helt rette, som hjørnet på en bok?", "Kor mange hjørne er heilt rette, som hjørnet på ei bok?", "How many corners are square, like the corner of a book?", "¿Cuántas esquinas son rectas, como la de un libro?", "Wie viele Ecken sind gerade wie bei einem Buch?", "Quantos cantos são retos, como o de um livro?", "Hur många hörn är räta, som hörnet på en bok?", "Hvor mange hjørner er helt rette, som hjørnet på en bog?", "Combien de coins sont droits, comme le coin d'un livre ?");
o("Hvor mange kanter har klossen?", "Kor mange kantar har klossen?", "How many edges does the block have?", "¿Cuántas aristas tiene el bloque?", "Wie viele Kanten hat der Klotz?", "Quantas arestas tem o bloco?", "Hur många kanter har klossen?", "Hvor mange kanter har klodsen?", "Combien d'arêtes a le bloc ?");
o("Hvor mange flate sider har klossen?", "Kor mange flate sider har klossen?", "How many flat sides does the block have?", "¿Cuántas caras planas tiene el bloque?", "Wie viele flache Seiten hat der Klotz?", "Quantos lados planos tem o bloco?", "Hur många platta sidor har klossen?", "Hvor mange flade sider har klodsen?", "Combien de faces plates a le bloc ?");
o("Det er {tall}.", "Det er {tall}.", "There are {tall}.", "Hay {tall}.", "Es sind {tall}.", "Há {tall}.", "Det är {tall}.", "Der er {tall}.", "Il y en a {tall}.");
o("Følg kanten rundt hele formen.", "Følg kanten rundt heile forma.", "Follow the edge around the whole shape.", "Sigue el borde de toda la forma.", "Folge der Kante um die ganze Form.", "Segue a borda à volta da forma.", "Följ kanten runt hela formen.", "Følg kanten rundt hele formen.", "Suis le bord de toute la forme.");
o("Se på bildet en gang til.", "Sjå på biletet ein gong til.", "Look at the picture again.", "Mira el dibujo otra vez.", "Sieh das Bild noch einmal an.", "Olha a imagem outra vez.", "Titta på bilden en gång till.", "Se på billedet en gang til.", "Regarde l'image encore.");
o("Det riktige er {svar}.", "Det rette er {svar}.", "The right one is {svar}.", "Lo correcto es {svar}.", "Das Richtige ist {svar}.", "O certo é {svar}.", "Det rätta är {svar}.", "Det rigtige er {svar}.", "La bonne réponse est {svar}.");
o("Tøm", "Tøm", "Clear", "Borrar", "Leeren", "Apagar", "Töm", "Tøm", "Effacer");
o("Spill", "Spel", "Play", "Jugar", "Spielen", "Jogar", "Spela", "Spil", "Jouer");
o("Pause", "Pause", "Pause", "Pausa", "Pause", "Pausa", "Paus", "Pause", "Pause");
o("Fortsett", "Hald fram", "Continue", "Sigue", "Weiter", "Continua", "Fortsätt", "Fortsæt", "Continue");
o("Avslutt dagen", "Avslutt dagen", "End the day", "Termina el día", "Tag beenden", "Acaba o dia", "Avsluta dagen", "Afslut dagen", "Finis la journée");
o("Avslutte dagen nå?", "Avslutte dagen no?", "End the day now?", "¿Terminar el día ahora?", "Den Tag jetzt beenden?", "Acabar o dia agora?", "Avsluta dagen nu?", "Afslutte dagen nu?", "Finir la journée maintenant ?");
o("Ja, avslutt", "Ja, avslutt", "Yes, end it", "Sí, terminar", "Ja, beenden", "Sim, acabar", "Ja, avsluta", "Ja, afslut", "Oui, finir");
o("Neste del", "Neste del", "Next part", "Siguiente pieza", "Nächstes Teil", "Próxima peça", "Nästa del", "Næste del", "Pièce suivante");
o("Du har delen.", "Du har delen.", "You have the part.", "Tienes la pieza.", "Du hast das Teil.", "Tens a peça.", "Du har delen.", "Du har delen.", "Tu as la pièce.");
o("Du trenger delen.", "Du treng delen.", "You need the part.", "Te falta la pieza.", "Dir fehlt das Teil.", "Falta-te a peça.", "Du behöver delen.", "Du mangler delen.", "Il te faut la pièce.");
o("Vent til {tid}", "Vent til {tid}", "Wait until {tid}", "Espera hasta las {tid}", "Warte bis {tid}", "Espera até às {tid}", "Vänta till {tid}", "Vent til {tid}", "Attends jusqu'à {tid}");
o("Hopp over", "Hopp over", "Skip", "Saltar", "Überspringen", "Saltar", "Hoppa över", "Spring over", "Passer");
o("Neste", "Neste", "Next", "Siguiente", "Weiter", "Seguinte", "Nästa", "Næste", "Suivant");
o("Hele timer og halve.", "Heile timar og halve.", "Whole hours and half hours.", "Horas enteras y medias.", "Volle und halbe Stunden.", "Horas inteiras e meias.", "Hela timmar och halva.", "Hele timer og halve.", "Heures entières et demies.");
o("Kvartene også.", "Kvartane også.", "Quarters too.", "También los cuartos.", "Auch Viertel.", "Quartos também.", "Kvartar också.", "Kvarter også.", "Les quarts aussi.");
o("Fem minutter.", "Fem minutt.", "Five minutes.", "Cinco minutos.", "Fünf Minuten.", "Cinco minutos.", "Fem minuter.", "Fem minutter.", "Cinq minutes.");
o("Litt av hvert.", "Litt av kvart.", "A bit of everything.", "Un poco de todo.", "Ein bisschen von allem.", "Um pouco de tudo.", "Lite av varje.", "Lidt af hvert.", "Un peu de tout.");
o("Spiller", "Spelar", "Player", "Jugador", "Spieler", "Jogador", "Spelare", "Spiller", "Joueur");
o("Lyd og visning", "Lyd og vising", "Sound and display", "Sonido y pantalla", "Ton und Anzeige", "Som e ecrã", "Ljud och visning", "Lyd og visning", "Son et affichage");
o("Språk", "Språk", "Language", "Idioma", "Sprache", "Língua", "Språk", "Sprog", "Langue");
o("Lyd", "Lyd", "Sound", "Sonido", "Ton", "Som", "Ljud", "Lyd", "Son");
o("Digital klokke", "Digital klokke", "Digital clock", "Reloj digital", "Digitale Uhr", "Relógio digital", "Digital klocka", "Digitalt ur", "Horloge digitale");
o("Tid", "Tid", "Time", "Hora", "Zeit", "Hora", "Tid", "Tid", "Heure");
o("Introduksjon", "Introduksjon", "Introduction", "Introducción", "Einführung", "Introdução", "Introduktion", "Introduktion", "Introduction");
o("Se introduksjonen", "Sjå introduksjonen", "See the introduction", "Ver la introducción", "Einführung ansehen", "Ver a introdução", "Se introduktionen", "Se introduktionen", "Voir l'introduction");
o("Kurven", "Korga", "Basket", "Cesta", "Korb", "Cesto", "Korgen", "Kurven", "Panier");
o("Handlelisten er tom.", "Handlelista er tom.", "The shopping list is empty.", "La lista está vacía.", "Die Einkaufsliste ist leer.", "A lista está vazia.", "Inköpslistan är tom.", "Indkøbslisten er tom.", "La liste est vide.");
o("{navn} er snart.", "{navn} er snart.", "{navn} is soon.", "{navn} es pronto.", "{navn} ist bald.", "{navn} é já.", "{navn} är snart.", "{navn} er snart.", "{navn} est bientôt.");
o("Hva vil du gjøre?", "Kva vil du gjere?", "What do you want to do?", "¿Qué quieres hacer?", "Was willst du tun?", "O que queres fazer?", "Vad vill du göra?", "Hvad vil du lave?", "Tu veux faire quoi ?");
o("Bygg", "Bygg", "Build", "Construye", "Baue", "Constrói", "Bygg", "Byg", "Construis");
o("Gå til butikken", "Gå til butikken", "Go to the shop", "Ve a la tienda", "Geh zum Laden", "Vai à loja", "Gå till butiken", "Gå til butikken", "Va à la boutique");
o("Stenger", "Stengjer", "Closes", "Cierra", "Schließt", "Fecha", "Stänger", "Lukker", "Ferme");
o("Stjerne", "Stjerne", "Star", "Estrella", "Stern", "Estrela", "Stjärna", "Stjerne", "Étoile");
o("Tidsrom er oppgaver om hvor lenge noe varer.", "Tidsrom er oppgåver om kor lenge noko varer.", "Time spans are tasks about how long something lasts.", "Los intervalos son tareas sobre cuánto dura algo.", "Zeitspannen sind Aufgaben dazu, wie lange etwas dauert.", "Intervalos são tarefas sobre quanto tempo algo dura.", "Tidsrymder är uppgifter om hur länge något varar.", "Tidsrum er opgaver om, hvor længe noget varer.", "Les durées sont des tâches sur combien de temps ça dure.");
o("Dagboklisten viser alle dager.", "Dagboklista viser alle dagar.", "The diary list shows every day.", "La lista muestra todos los días.", "Die Liste zeigt alle Tage.", "A lista mostra todos os dias.", "Listan visar alla dagar.", "Listen viser alle dage.", "La liste montre tous les jours.");
o("Data", "Data", "Data", "Datos", "Daten", "Dados", "Data", "Data", "Données");
o("Nivå", "Nivå", "Level", "Nivel", "Stufe", "Nível", "Nivå", "Niveau", "Niveau");
o("Om appen", "Om appen", "About the app", "Sobre la app", "Über die App", "Sobre a app", "Om appen", "Om appen", "À propos");
o("Lukk", "Lukk", "Close", "Cerrar", "Schließen", "Fechar", "Stäng", "Luk", "Fermer");
o("SFO", "SFO", "After-school club", "Actividades", "Hort", "ATL", "Fritids", "SFO", "Garderie");
o("Dag", "Dag", "Day", "Día", "Tag", "Dia", "Dag", "Dag", "Jour");
o("Kveld", "Kveld", "Evening", "Tarde", "Abend", "Tarde", "Kväll", "Aften", "Soir");
o("Dalen er tom.", "Dalen er tom.", "The valley is empty.", "El valle está vacío.", "Das Tal ist leer.", "O vale está vazio.", "Dalen är tom.", "Dalen er tom.", "La vallée est vide.");
o("Her er byen din. Rønna står klar.", "Her er byen din. Rønna står klar.", "This is your town. The cottage is ready.", "Esta es tu ciudad. La cabaña está lista.", "Das ist deine Stadt. Die Hütte steht bereit.", "Esta é a tua cidade. A cabana está pronta.", "Här är din stad. Stugan står klar.", "Her er din by. Hytten står klar.", "Voici ta ville. La cabane est prête.");
o("Du har handlet i dag.", "Du har handla i dag.", "You have shopped today.", "Ya has comprado hoy.", "Du hast heute eingekauft.", "Já fizeste compras hoje.", "Du har handlat i dag.", "Du har handlet i dag.", "Tu as déjà fait les courses.");
o("Da har du alt til {bygg}!", "Då har du alt til {bygg}!", "You have everything for {bygg}!", "Ya tienes todo para {bygg}.", "Du hast alles für {bygg}!", "Já tens tudo para {bygg}!", "Nu har du allt till {bygg}!", "Nu har du alt til {bygg}!", "Tu as tout pour {bygg} !");
o("Du fikk {vare}.", "Du fekk {vare}.", "You got a {vare}.", "Conseguiste un {vare}.", "Du hast {vare} bekommen.", "Recebeste um {vare}.", "Du fick {vare}.", "Du fik {vare}.", "Tu as reçu {vare}.");
o("Butikken stenger en stund", "Butikken stengjer ei stund", "The shop closes for a while", "La tienda cierra un rato", "Der Laden macht eine Pause", "A loja fecha um pouco", "Butiken stänger en stund", "Butikken lukker en stund", "La boutique ferme un moment");
o("Butikken åpner igjen", "Butikken opnar att", "The shop opens again", "La tienda abre otra vez", "Der Laden öffnet wieder", "A loja abre de novo", "Butiken öppnar igen", "Butikken åbner igen", "La boutique rouvre");
o("Tannlegen", "Tannlækjaren", "Dentist", "Dentista", "Zahnarzt", "Dentista", "Tandläkaren", "Tandlægen", "Dentiste");
o("Svømmehallen", "Symjehallen", "Pool", "Piscina", "Schwimmbad", "Piscina", "Simhallen", "Svømmehallen", "Piscine");
o("Sett delen på plass", "Set delen på plass", "Put the part on", "Pon la pieza", "Setze das Teil", "Põe a peça", "Sätt delen på plats", "Sæt delen på plads", "Pose la pièce");
o("Familien spiser.", "Familien et.", "The family is eating.", "La familia come.", "Die Familie isst.", "A família come.", "Familjen äter.", "Familien spiser.", "La famille mange.");
o("Tilbake til byen", "Tilbake til byen", "Back to town", "Volver a la ciudad", "Zurück in die Stadt", "Voltar à cidade", "Tillbaka till stan", "Tilbage til byen", "Retour en ville");
o("Velg figur", "Vel figur", "Choose a person", "Elige una figura", "Wähle eine Figur", "Escolhe uma figura", "Välj en figur", "Vælg en figur", "Choisis un personnage");
o("Velg kjæledyr", "Vel kjæledyr", "Choose a pet", "Elige una mascota", "Wähle ein Haustier", "Escolhe um animal", "Välj ett djur", "Vælg et kæledyr", "Choisis un animal");
o("Lyd på", "Lyd på", "Sound on", "Sonido sí", "Ton an", "Som sim", "Ljud på", "Lyd til", "Son oui");
o("Lyd av", "Lyd av", "Sound off", "Sonido no", "Ton aus", "Som não", "Ljud av", "Lyd fra", "Son non");
o("Klokke på", "Klokke på", "Clock on", "Reloj sí", "Uhr an", "Relógio sim", "Klocka på", "Ur til", "Horloge oui");
o("Klokke av", "Klokke av", "Clock off", "Reloj no", "Uhr aus", "Relógio não", "Klocka av", "Ur fra", "Horloge non");
o("Kompetansemål", "Kompetansemål", "Learning goals", "Objetivos", "Lernziele", "Objetivos", "Mål", "Mål", "Objectifs");
o("Les mer", "Les meir", "Read more", "Leer más", "Mehr lesen", "Ler mais", "Läs mer", "Læs mere", "Lire la suite");
o("15 min", "15 min", "15 min", "15 min", "15 Min.", "15 min", "15 min", "15 min", "15 min");
o("30 min", "30 min", "30 min", "30 min", "30 Min.", "30 min", "30 min", "30 min", "30 min");
o("Se på hyllene.", "Sjå på hyllene.", "Look at the shelves.", "Mira los estantes.", "Sieh die Regale.", "Olha as prateleiras.", "Titta på hyllorna.", "Se på hylderne.", "Regarde les rayons.");
o("Se på skiltet.", "Sjå på skiltet.", "Look at the sign.", "Mira el cartel.", "Sieh das Schild.", "Olha a placa.", "Titta på skylten.", "Se på skiltet.", "Regarde le panneau.");
o("Gå til {sted}.", "Gå til {sted}.", "Go to {sted}.", "Ve a {sted}.", "Geh zu {sted}.", "Vai a {sted}.", "Gå till {sted}.", "Gå til {sted}.", "Va à {sted}.");
o("Det er leggetid.", "Det er leggetid.", "It is bedtime.", "Es hora de dormir.", "Es ist Schlafenszeit.", "É hora de dormir.", "Det är läggdags.", "Det er sengetid.", "C'est l'heure de dormir.");
o("Se deg rundt i byen.", "Sjå deg rundt i byen.", "Look around the town.", "Mira la ciudad.", "Sieh dich in der Stadt um.", "Olha a cidade.", "Se dig omkring i stan.", "Se dig omkring i byen.", "Regarde la ville.");
o("Ferdig.", "Ferdig.", "Done.", "Listo.", "Fertig.", "Pronto.", "Färdig.", "Færdig.", "Fini.");
o("Byggeplassen", "Byggeplassen", "Building site", "La obra", "Die Baustelle", "A obra", "Byggplatsen", "Byggepladsen", "Le chantier");
o("Her står en rønne. Du kan bo her.", "Her står ei rønne. Du kan bu her.", "Here is a cottage. You can live here.", "Aquí hay una cabaña. Puedes vivir aquí.", "Hier steht eine Hütte. Du kannst hier wohnen.", "Aqui está uma cabana. Podes morar aqui.", "Här står en stuga. Du kan bo här.", "Her står et hus. Du kan bo her.", "Voici une cabane. Tu peux vivre ici.");
o("Bygg helt til slottet.", "Bygg heilt til slottet.", "Build all the way to the castle.", "Construye hasta el castillo.", "Bau bis zum Schloss.", "Constrói até ao castelo.", "Bygg ända till slottet.", "Byg helt til slottet.", "Construis jusqu'au château.");
o("Pass på klokka. Butikken har åpningstid.", "Pass på klokka. Butikken har opningstid.", "Watch the clock. The shop has opening hours.", "Mira el reloj. La tienda tiene horario.", "Pass auf die Uhr auf. Der Laden hat Öffnungszeiten.", "Olha o relógio. A loja tem horário.", "Passa klockan. Butiken har öppettider.", "Pas på uret. Butikken har åbningstid.", "Surveille l'horloge. La boutique a des horaires.");
o("Aktivitet", "Aktivitet", "Activity", "Actividad", "Aktivität", "Atividade", "Aktivitet", "Aktivitet", "Activité");
o("Kurven er tom.", "Korga er tom.", "The basket is empty.", "La cesta está vacía.", "Der Korb ist leer.", "O cesto está vazio.", "Korgen är tom.", "Kurven er tom.", "Le panier est vide.");
o("Ingen nye bygg.", "Ingen nye bygg.", "No new buildings.", "Ningún edificio nuevo.", "Keine neuen Gebäude.", "Nenhum prédio novo.", "Inga nya hus.", "Ingen nye bygninger.", "Pas de nouveaux bâtiments.");
o("Hele timer", "Heile timar", "Whole hours", "Horas enteras", "Volle Stunden", "Horas inteiras", "Hela timmar", "Hele timer", "Heures entières");
o("Halvtime", "Halvtime", "Half hours", "Medias horas", "Halbe Stunden", "Meias horas", "Halvtimmar", "Halve timer", "Demies");
o("Kvart", "Kvart", "Quarters", "Cuartos", "Viertel", "Quartos", "Kvartar", "Kvarter", "Quarts");
o("Ukedager", "Vekedagar", "Weekdays", "Días", "Wochentage", "Dias", "Veckodagar", "Ugedage", "Jours");
o("Måneder", "Månader", "Months", "Meses", "Monate", "Meses", "Månader", "Måneder", "Mois");
o("Tid på dagen", "Tid på dagen", "Time of day", "Momento del día", "Tageszeit", "Parte do dia", "Tid på dagen", "Tid på dagen", "Moment de la journée");

o("← Byen", "← Byen", "← Town", "← Ciudad", "← Stadt", "← Cidade", "← Stan", "← Byen", "← Ville");
o("Ingen flere kjøp i dag. Vil du stille tårnuret?", "Ingen fleire kjøp i dag. Vil du stille tårnuret?", "No more shopping today. Do you want to set the tower clock?", "No hay más compras hoy. ¿Quieres poner el reloj de la torre?", "Heute kein Einkauf mehr. Willst du die Turmuhr stellen?", "Não há mais compras hoje. Queres acertar o relógio da torre?", "Inga fler köp i dag. Vill du ställa tornuret?", "Ingen flere køb i dag. Vil du stille tårnuret?", "Plus d'achats aujourd'hui. Tu veux régler l'horloge de la tour ?");
o("Still tårnuret til {ord}.", "Still tårnuret til {ord}.", "Set the tower clock to {ord}.", "Pon el reloj de la torre a las {ord}.", "Stelle die Turmuhr auf {ord}.", "Põe o relógio da torre nas {ord}.", "Ställ tornuret på {ord}.", "Stil tårnuret på {ord}.", "Règle l'horloge de la tour sur {ord}.");
o("+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min", "+ {tall} min");
o("− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min", "− {tall} min");
o("+ 1 time", "+ 1 time", "+ 1 hour", "+ 1 hora", "+ 1 Stunde", "+ 1 hora", "+ 1 timme", "+ 1 time", "+ 1 heure");
o("− 1 time", "− 1 time", "− 1 hour", "− 1 hora", "− 1 Stunde", "− 1 hora", "− 1 timme", "− 1 time", "− 1 heure");
o("Les skiltet på døra.", "Les skiltet på døra.", "Read the sign on the door.", "Lee el cartel de la puerta.", "Lies das Schild an der Tür.", "Lê a placa na porta.", "Läs skylten på dörren.", "Læs skiltet på døren.", "Lis le panneau sur la porte.");
o("Når åpner butikken?", "Når opnar butikken?", "When does the shop open?", "¿Cuándo abre la tienda?", "Wann öffnet der Laden?", "Quando abre a loja?", "När öppnar butiken?", "Hvornår åbner butikken?", "Quand ouvre la boutique ?");
o("Sammenlign skiltet med klokka.", "Samanlikn skiltet med klokka.", "Compare the sign with the clock.", "Compara el cartel con el reloj.", "Vergleiche das Schild mit der Uhr.", "Compara a placa com o relógio.", "Jämför skylten med klockan.", "Sammenlign skiltet med uret.", "Compare le panneau et l'horloge.");
o("Les åpningstidene før du går", "Les opningstidene før du går", "Read the hours before you go", "Lee el horario antes de ir", "Lies die Öffnungszeiten, bevor du gehst", "Lê o horário antes de ires", "Läs öppettiderna innan du går", "Læs åbningstiderne før du går", "Lis les horaires avant de partir");
o("Vent til {tid}. Butikken åpner.", "Vent til {tid}. Butikken opnar.", "Wait until {tid}. The shop opens.", "Espera hasta las {tid}. La tienda abre.", "Warte bis {tid}. Der Laden öffnet.", "Espera até às {tid}. A loja abre.", "Vänta till {tid}. Butiken öppnar.", "Vent til {tid}. Butikken åbner.", "Attends jusqu'à {tid}. La boutique ouvre.");
o("Les skiltet.", "Les skiltet.", "Read the sign.", "Lee el cartel.", "Lies das Schild.", "Lê a placa.", "Läs skylten.", "Læs skiltet.", "Lis le panneau.");
o("Les skiltet", "Les skiltet", "Read the sign", "Lee el cartel", "Lies das Schild", "Lê a placa", "Läs skylten", "Læs skiltet", "Lis le panneau");
o("Vi trenger en {del}.", "Vi treng ein {del}.", "We need a {del}.", "Necesitamos un {del}.", "Wir brauchen ein {del}.", "Precisamos de um {del}.", "Vi behöver en {del}.", "Vi skal bruge en {del}.", "Il nous faut un {del}.");
o("Dra {del} på plass.", "Dra {del} på plass.", "Drag the {del} into place.", "Arrastra {del}.", "Zieh {del} an den Platz.", "Arrasta {del}.", "Dra {del} på plats.", "Træk {del} på plads.", "Glisse {del} à sa place.");
o("Hva vil du bygge?", "Kva vil du byggje?", "What do you want to build?", "¿Qué quieres construir?", "Was willst du bauen?", "O que queres construir?", "Vad vill du bygga?", "Hvad vil du bygge?", "Que veux-tu construire ?");
o("Gå hjem.", "Gå heim.", "Go home.", "Ve a casa.", "Geh nach Hause.", "Vai para casa.", "Gå hem.", "Gå hjem.", "Rentre à la maison.");
o("Gå hjem", "Gå heim", "Go home", "Ve a casa", "Geh nach Hause", "Vai para casa", "Gå hem", "Gå hjem", "Rentre");
o("Middagen er klar.", "Middagen er klar.", "Dinner is ready.", "La cena está lista.", "Das Essen ist fertig.", "O jantar está pronto.", "Middagen är klar.", "Maden er klar.", "Le dîner est prêt.");
o("Møt opp.", "Møt opp.", "Show up.", "Preséntate.", "Komm hin.", "Chega.", "Kom dit.", "Mød op.", "Va au rendez-vous.");
o("Kjøp {del}", "Kjøp {del}", "Buy {del}", "Compra {del}", "Kauf {del}", "Compra {del}", "Köp {del}", "Køb {del}", "Achète {del}");
o("Sett på {del} · {min} min", "Set på {del} · {min} min", "Put on {del} · {min} min", "Pon {del} · {min} min", "Setze {del} · {min} Min", "Põe {del} · {min} min", "Sätt på {del} · {min} min", "Sæt {del} på · {min} min", "Pose {del} · {min} min");
o("Hent delen i butikken.", "Hent delen i butikken.", "Get the part at the shop.", "Busca la pieza en la tienda.", "Hol das Teil im Laden.", "Vai buscar a peça à loja.", "Hämta delen i butiken.", "Hent delen i butikken.", "Va chercher la pièce à la boutique.");
o("Gå til {sted}", "Gå til {sted}", "Go to {sted}", "Ve a {sted}", "Geh zu {sted}", "Vai a {sted}", "Gå till {sted}", "Gå til {sted}", "Va à {sted}");
o("butikken", "butikken", "the shop", "la tienda", "den Laden", "a loja", "butiken", "butikken", "la boutique");
o("tannlegen", "tannlækjaren", "the dentist", "el dentista", "den Zahnarzt", "o dentista", "tandläkaren", "tandlægen", "le dentiste");
o("svømmehallen", "symjehallen", "the pool", "la piscina", "das Schwimmbad", "a piscina", "simhallen", "svømmehallen", "la piscine");
o("torget", "torget", "the square", "la plaza", "den Platz", "a praça", "torget", "torvet", "la place");
o("stedet", "staden", "the place", "el lugar", "den Ort", "o lugar", "platsen", "stedet", "l'endroit");
o("Spis", "Et", "Eat", "Come", "Iss", "Come", "Ät", "Spis", "Mange");
o("God natt", "God natt", "Good night", "Buenas noches", "Gute Nacht", "Boa noite", "God natt", "Godnat", "Bonne nuit");
o("Dagens plan", "Dagens plan", "Today's plan", "El plan de hoy", "Der Plan für heute", "O plano de hoje", "Dagens plan", "Dagens plan", "Le programme");
o("I dag bygger du", "I dag byggjer du", "Today you build", "Hoy construyes", "Heute baust du", "Hoje constróis", "I dag bygger du", "I dag bygger du", "Aujourd'hui tu construis");
o("Riktig! Du får {vare}.", "Riktig! Du får {vare}.", "Right! You get {vare}.", "¡Bien! Recibes {vare}.", "Richtig! Du bekommst {vare}.", "Certo! Recebes {vare}.", "Rätt! Du får {vare}.", "Rigtigt! Du får {vare}.", "Juste ! Tu reçois {vare}.");
o("Riktig!", "Riktig!", "Right!", "¡Bien!", "Richtig!", "Certo!", "Rätt!", "Rigtigt!", "Juste !");
o("Gå til tomta", "Gå til tomta", "Go to the plot", "Ve al solar", "Geh zum Grundstück", "Vai ao lote", "Gå till tomten", "Gå til grunden", "Va au terrain");
o("Trykk på {del}.", "Trykk på {del}.", "Tap {del}.", "Toca {del}.", "Tippe auf {del}.", "Toca em {del}.", "Tryck på {del}.", "Tryk på {del}.", "Appuie sur {del}.");
o("Vi trenger {del}.", "Vi treng {del}.", "We need {del}.", "Necesitamos {del}.", "Wir brauchen {del}.", "Precisamos de {del}.", "Vi behöver {del}.", "Vi skal bruge {del}.", "Il nous faut {del}.");
o("Finn alle som er {navn}, som denne.", "Finn alle som er {navn}, som denne.", "Find every {navn}, like this one.", "Encuentra todos los {navn}, como este.", "Finde alle {navn}, wie diese.", "Encontra todos os {navn}, como este.", "Hitta alla {navn}, som den här.", "Find alle {navn}, som denne.", "Trouve tous les {navn}, comme celui-ci.");
o("Fargen betyr ikke noe. Se på formen.", "Fargen betyr ikkje noko. Sjå på forma.", "The colour does not matter. Look at the shape.", "El color no importa. Mira la forma.", "Die Farbe ist egal. Sieh die Form.", "A cor não importa. Olha a forma.", "Färgen spelar ingen roll. Se på formen.", "Farven betyder ikke noget. Se på formen.", "La couleur ne compte pas. Regarde la forme.");
o("Butikken er åpen. Den stenger {tid}.", "Butikken er open. Den stengjer {tid}.", "The shop is open. It closes at {tid}.", "La tienda está abierta. Cierra a las {tid}.", "Der Laden ist offen. Er schließt um {tid}.", "A loja está aberta. Fecha às {tid}.", "Butiken är öppen. Den stänger {tid}.", "Butikken er åben. Den lukker {tid}.", "La boutique est ouverte. Elle ferme à {tid}.");
o("Butikken er stengt. Den åpner {tid}.", "Butikken er stengt. Den opnar {tid}.", "The shop is closed. It opens at {tid}.", "La tienda está cerrada. Abre a las {tid}.", "Der Laden hat zu. Er öffnet um {tid}.", "A loja está fechada. Abre às {tid}.", "Butiken är stängd. Den öppnar {tid}.", "Butikken er lukket. Den åbner {tid}.", "La boutique est fermée. Elle ouvre à {tid}.");
o("Bynivå {nivaa}. Du bygger {bygg}.", "Bynivå {nivaa}. Du byggjer {bygg}.", "Town level {nivaa}. You are building {bygg}.", "Nivel {nivaa}. Construyes {bygg}.", "Stadtstufe {nivaa}. Du baust {bygg}.", "Nível {nivaa}. Estás a construir {bygg}.", "Stadsnivå {nivaa}. Du bygger {bygg}.", "Byniveau {nivaa}. Du bygger {bygg}.", "Niveau {nivaa}. Tu construis {bygg}.");
o("Bynivå {nivaa}.", "Bynivå {nivaa}.", "Town level {nivaa}.", "Nivel {nivaa}.", "Stadtstufe {nivaa}.", "Nível {nivaa}.", "Stadsnivå {nivaa}.", "Byniveau {nivaa}.", "Niveau {nivaa}.");
o("Byplanen", "Byplanen", "The town plan", "El plano", "Der Stadtplan", "O plano", "Stadsplanen", "Byplanen", "Le plan");
o("Kurven", "Korga", "Basket", "Cesta", "Korb", "Cesto", "Korgen", "Kurven", "Panier");
o("Mynter", "Myntar", "Coins", "Monedas", "Münzen", "Moedas", "Mynt", "Mønter", "Pièces");
o("Familien er sulten.", "Familien er svolten.", "The family is hungry.", "La familia tiene hambre.", "Die Familie ist hungrig.", "A família tem fome.", "Familjen är hungrig.", "Familien er sulten.", "La famille a faim.");
o("Middagen er over.", "Middagen er over.", "Dinner is over.", "La cena ya pasó.", "Das Essen ist vorbei.", "O jantar já passou.", "Middagen är över.", "Maden er overstået.", "Le dîner est passé.");
o("Vi spiser.", "Vi et.", "We are eating.", "Comemos.", "Wir essen.", "Estamos a comer.", "Vi äter.", "Vi spiser.", "Nous mangeons.");
o("time minus", "time minus", "hour minus", "hora menos", "Stunde minus", "hora menos", "timme minus", "time minus", "heure moins");
o("Finn alle {navn}.", "Finn alle {navn}.", "Find all the {navn}.", "Encuentra todos los {navn}.", "Finde alle {navn}.", "Encontra todos os {navn}.", "Hitta alla {navn}.", "Find alle {navn}.", "Trouve tous les {navn}.");
o("Kule = rund som en ball.", "Kule = rund som ein ball.", "A sphere is round like a ball.", "Esfera = redonda como una pelota.", "Kugel = rund wie ein Ball.", "Esfera = redonda como uma bola.", "Klot = runt som en boll.", "Kugle = rund som en bold.", "Sphère = ronde comme une balle.");
o("Vent til {tid} · {grunn}", "Vent til {tid} · {grunn}", "Wait until {tid} · {grunn}", "Espera hasta {tid} · {grunn}", "Warte bis {tid} · {grunn}", "Espera até {tid} · {grunn}", "Vänta till {tid} · {grunn}", "Vent til {tid} · {grunn}", "Attends jusqu'à {tid} · {grunn}");
o("Sett på {del}", "Set på {del}", "Put on {del}", "Pon {del}", "Setze {del}", "Põe {del}", "Sätt på {del}", "Sæt {del} på", "Pose {del}");
o("{del} er {klar}.", "{del} er {klar}.", "{del} is ready.", "{del} está listo.", "{del} ist bereit.", "{del} está pronto.", "{del} är klar.", "{del} er klar.", "{del} est prêt.");
o("{del} er {klar}. Gå til tomta.", "{del} er {klar}. Gå til tomta.", "{del} is ready. Go to the plot.", "{del} está listo. Ve al solar.", "{del} ist bereit. Geh zum Grundstück.", "{del} está pronto. Vai ao lote.", "{del} är klar. Gå till tomten.", "{del} er klar. Gå til grunden.", "{del} est prêt. Va au terrain.");
o("Gå hjem. {navn} starter kl. {tid}.", "Gå heim. {navn} startar kl. {tid}.", "Go home. {navn} starts at {tid}.", "Ve a casa. {navn} empieza a las {tid}.", "Geh nach Hause. {navn} beginnt um {tid}.", "Vai para casa. {navn} começa às {tid}.", "Gå hem. {navn} börjar kl. {tid}.", "Gå hjem. {navn} starter kl. {tid}.", "Rentre. {navn} commence à {tid}.");
o("Vi går kl. {tid}, så er vi {sted} {start}.", "Vi går kl. {tid}, så er vi {sted} {start}.", "We leave at {tid}, and we are {sted} at {start}.", "Salimos a las {tid}, y estamos {sted} a las {start}.", "Wir gehen um {tid}, dann sind wir {sted} um {start}.", "Saímos às {tid}, e estamos {sted} às {start}.", "Vi går kl. {tid}, så är vi {sted} {start}.", "Vi går kl. {tid}, så er vi {sted} {start}.", "Nous partons à {tid}, et nous sommes {sted} à {start}.");
o("på torget", "på torget", "at the square", "en la plaza", "auf dem Platz", "na praça", "på torget", "på torvet", "sur la place");
o("hos tannlegen", "hos tannlækjaren", "at the dentist", "en el dentista", "beim Zahnarzt", "no dentista", "hos tandläkaren", "hos tandlægen", "chez le dentiste");
o("i butikken", "i butikken", "at the shop", "en la tienda", "im Laden", "na loja", "i butiken", "i butikken", "à la boutique");
o("i svømmehallen", "i symjehallen", "at the pool", "en la piscina", "im Schwimmbad", "na piscina", "i simhallen", "i svømmehallen", "à la piscine");
o("i barnehagen", "i barnehagen", "at the kindergarten", "en la guardería", "im Kindergarten", "no jardim", "på förskolan", "i børnehaven", "à la maternelle");
o("på tomta", "på tomta", "at the plot", "en el solar", "auf dem Grundstück", "no lote", "på tomten", "på grunden", "sur le terrain");
o("på stedet", "på staden", "there", "allí", "dort", "lá", "där", "der", "là");
o("hjemme", "heime", "at home", "en casa", "zu Hause", "em casa", "hemma", "hjemme", "à la maison");
o("Butikken er stengt. I morgen kjøper vi {del}. Vi venter til kl. {tid}.", "Butikken er stengt. I morgon kjøper vi {del}. Vi ventar til kl. {tid}.", "The shop is closed. Tomorrow we buy {del}. We wait until {tid}.", "La tienda está cerrada. Mañana compramos {del}. Esperamos hasta las {tid}.", "Der Laden hat zu. Morgen kaufen wir {del}. Wir warten bis {tid}.", "A loja está fechada. Amanhã compramos {del}. Esperamos até às {tid}.", "Butiken är stängd. I morgon köper vi {del}. Vi väntar till kl. {tid}.", "Butikken er lukket. I morgen køber vi {del}. Vi venter til kl. {tid}.", "La boutique est fermée. Demain nous achetons {del}. Nous attendons jusqu'à {tid}.");
o("Du rakk alt, og de fleste svarene var riktige med en gang.", "Du rakk alt, og dei fleste svara var rette med ein gong.", "You made everything, and most answers were right the first time.", "Llegaste a todo, y la mayoría de las respuestas fueron correctas a la primera.", "Du hast alles geschafft, und die meisten Antworten waren gleich richtig.", "Chegaste a tudo, e a maioria das respostas estava certa à primeira.", "Du hann allt, och de flesta svaren var rätt på första försöket.", "Du nåede alt, og de fleste svar var rigtige med det samme.", "Tu as tout eu, et la plupart des réponses étaient justes du premier coup.");
o("Ingen stjerne i dag, fordi vi ikke rakk alle avtalene.", "Inga stjerne i dag, fordi vi ikkje rakk alle avtalane.", "No star today, because we missed an appointment.", "Sin estrella hoy, porque faltó una cita.", "Kein Stern heute, weil ein Termin fehlte.", "Sem estrela hoje, porque faltou um compromisso.", "Ingen stjärna i dag, eftersom vi missade en tid.", "Ingen stjerne i dag, fordi vi ikke nåede alle aftaler.", "Pas d'étoile aujourd'hui, parce qu'un rendez-vous a manqué.");
o("Ingen stjerne i dag, fordi for mange svar var feil på første forsøk.", "Inga stjerne i dag, fordi for mange svar var feil på første forsøk.", "No star today, because too many first answers were wrong.", "Sin estrella hoy, porque demasiadas primeras respuestas fueron incorrectas.", "Kein Stern heute, weil zu viele erste Antworten falsch waren.", "Sem estrela hoje, porque demasiadas primeiras respostas estavam erradas.", "Ingen stjärna i dag, eftersom för många första svar var fel.", "Ingen stjerne i dag, fordi for mange første svar var forkerte.", "Pas d'étoile aujourd'hui, parce que trop de premières réponses étaient fausses.");
o("Det riktige er rute {rute}.", "Det rette er rute {rute}.", "The right square is {rute}.", "La casilla correcta es {rute}.", "Das richtige Feld ist {rute}.", "A casa certa é {rute}.", "Rätt ruta är {rute}.", "Den rigtige rude er {rute}.", "La bonne case est {rute}.");
o("Hva viser denne klokka?", "Kva viser denne klokka?", "What does this clock show?", "¿Qué muestra este reloj?", "Was zeigt diese Uhr?", "O que mostra este relógio?", "Vad visar den här klockan?", "Hvad viser dette ur?", "Que montre cette horloge ?");
o("formiddag", "formiddag", "morning", "mañana", "Vormittag", "manhã", "förmiddag", "formiddag", "matinée");
o("ettermiddag", "ettermiddag", "afternoon", "tarde", "Nachmittag", "tarde", "eftermiddag", "eftermiddag", "après-midi");
o("kveld", "kveld", "evening", "noche", "Abend", "noite", "kväll", "aften", "soir");
o("Slottsball! Byen feirer.", "Slottsball! Byen feirar.", "A castle ball! The town is celebrating.", "¡Baile en el castillo! La ciudad celebra.", "Schlossball! Die Stadt feiert.", "Baile no castelo! A cidade festeja.", "Slottsbal! Staden firar.", "Slottsbal! Byen fejrer.", "Bal au château ! La ville fête.");
o("Ja, start en ny by", "Ja, start ein ny by", "Yes, start a new town", "Sí, empieza una ciudad nueva", "Ja, starte eine neue Stadt", "Sim, começa uma cidade nova", "Ja, starta en ny stad", "Ja, start en ny by", "Oui, commence une nouvelle ville");
o("Dette sletter byen.", "Dette slettar byen.", "This deletes the town.", "Esto borra la ciudad.", "Das löscht die Stadt.", "Isto apaga a cidade.", "Det här raderar staden.", "Dette sletter byen.", "Cela efface la ville.");
o("{del} finnes i butikken. Gå til butikken.", "{del} finst i butikken. Gå til butikken.", "{del} is in the shop. Go to the shop.", "{del} está en la tienda. Ve a la tienda.", "{del} gibt es im Laden. Geh zum Laden.", "{del} está na loja. Vai à loja.", "{del} finns i butiken. Gå till butiken.", "{del} findes i butikken. Gå til butikken.", "{del} est à la boutique. Va à la boutique.");
o("{navn} er nå.", "{navn} er no.", "{navn} is now.", "{navn} es ahora.", "{navn} ist jetzt.", "{navn} é agora.", "{navn} är nu.", "{navn} er nu.", "{navn} est maintenant.");
o("{navn} venter! Gå hjem nå.", "{navn} ventar! Gå heim no.", "{navn} is waiting! Go home now.", "¡{navn} espera! Ve a casa ahora.", "{navn} wartet! Geh jetzt nach Hause.", "{navn} espera! Vai para casa agora.", "{navn} väntar! Gå hem nu.", "{navn} venter! Gå hjem nu.", "{navn} attend ! Rentre maintenant.");
o("{navn} venter. Gå dit nå.", "{navn} ventar. Gå dit no.", "{navn} is waiting. Go there now.", "{navn} espera. Ve ahora.", "{navn} wartet. Geh jetzt hin.", "{navn} espera. Vai agora.", "{navn} väntar. Gå dit nu.", "{navn} venter. Gå derhen nu.", "{navn} attend. Vas-y maintenant.");
o("{navn} starter kl. {tid}. Vi venter her.", "{navn} startar kl. {tid}. Vi ventar her.", "{navn} starts at {tid}. We wait here.", "{navn} empieza a las {tid}. Esperamos aquí.", "{navn} beginnt um {tid}. Wir warten hier.", "{navn} começa às {tid}. Esperamos aqui.", "{navn} börjar kl. {tid}. Vi väntar här.", "{navn} starter kl. {tid}. Vi venter her.", "{navn} commence à {tid}. Nous attendons ici.");
o("Gå til {sted}. {navn} starter kl. {tid}.", "Gå til {sted}. {navn} startar kl. {tid}.", "Go to {sted}. {navn} starts at {tid}.", "Ve a {sted}. {navn} empieza a las {tid}.", "Geh zu {sted}. {navn} beginnt um {tid}.", "Vai a {sted}. {navn} começa às {tid}.", "Gå till {sted}. {navn} börjar kl. {tid}.", "Gå til {sted}. {navn} starter kl. {tid}.", "Va à {sted}. {navn} commence à {tid}.");
o("Butikken åpner kl. {tid}.", "Butikken opnar kl. {tid}.", "The shop opens at {tid}.", "La tienda abre a las {tid}.", "Der Laden öffnet um {tid}.", "A loja abre às {tid}.", "Butiken öppnar kl. {tid}.", "Butikken åbner kl. {tid}.", "La boutique ouvre à {tid}.");
o("butikken åpner", "butikken opnar", "the shop opens", "la tienda abre", "der Laden öffnet", "a loja abre", "butiken öppnar", "butikken åbner", "la boutique ouvre");
o("Butikken er stengt. Åpner mandag kl. {tid}.", "Butikken er stengt. Opnar måndag kl. {tid}.", "The shop is closed. It opens Monday at {tid}.", "La tienda está cerrada. Abre el lunes a las {tid}.", "Der Laden hat zu. Er öffnet am Montag um {tid}.", "A loja está fechada. Abre na segunda às {tid}.", "Butiken är stängd. Öppnar måndag kl. {tid}.", "Butikken er lukket. Åbner mandag kl. {tid}.", "La boutique est fermée. Elle ouvre lundi à {tid}.");
o("Butikken er stengt. Den åpner i morgen kl. {tid}.", "Butikken er stengt. Den opnar i morgon kl. {tid}.", "The shop is closed. It opens tomorrow at {tid}.", "La tienda está cerrada. Abre mañana a las {tid}.", "Der Laden hat zu. Er öffnet morgen um {tid}.", "A loja está fechada. Abre amanhã às {tid}.", "Butiken är stängd. Den öppnar i morgon kl. {tid}.", "Butikken er lukket. Den åbner i morgen kl. {tid}.", "La boutique est fermée. Elle ouvre demain à {tid}.");
o("Stengt nå. Åpner mandag kl. 14:00.", "Stengt no. Opnar måndag kl. 14:00.", "Closed now. Opens Monday at 14:00.", "Cerrada ahora. Abre el lunes a las 14:00.", "Jetzt zu. Öffnet Montag um 14:00.", "Fechada agora. Abre na segunda às 14:00.", "Stängt nu. Öppnar måndag kl. 14:00.", "Lukket nu. Åbner mandag kl. 14:00.", "Fermé maintenant. Ouvre lundi à 14:00.");
o("Stengt nå. Åpner i morgen kl. 14:00.", "Stengt no. Opnar i morgon kl. 14:00.", "Closed now. Opens tomorrow at 14:00.", "Cerrada ahora. Abre mañana a las 14:00.", "Jetzt zu. Öffnet morgen um 14:00.", "Fechada agora. Abre amanhã às 14:00.", "Stängt nu. Öppnar i morgon kl. 14:00.", "Lukket nu. Åbner i morgen kl. 14:00.", "Fermé maintenant. Ouvre demain à 14:00.");
o("Snart leggetid.", "Snart leggetid.", "Bedtime soon.", "Pronto a dormir.", "Bald Schlafenszeit.", "Quase hora de deitar.", "Snart läggdags.", "Snart sengetid.", "Bientôt l'heure de dormir.");
o("En time til leggetid.", "Ein time til leggetid.", "One hour until bedtime.", "Una hora para dormir.", "Eine Stunde bis zur Schlafenszeit.", "Uma hora até deitar.", "En timme till läggdags.", "En time til sengetid.", "Une heure avant de dormir.");
o("Legg deg", "Legg deg", "Go to bed", "Acuéstate", "Leg dich hin", "Deita-te", "Lägg dig", "Læg dig", "Va te coucher");
o("barnehagen", "barnehagen", "the kindergarten", "la guardería", "den Kindergarten", "o jardim", "förskolan", "børnehaven", "la maternelle");
o("tomta", "tomta", "the plot", "el solar", "das Grundstück", "o lote", "tomten", "grunden", "le terrain");
o("Barnehagen", "Barnehagen", "Kindergarten", "Guardería", "Kindergarten", "Jardim", "Förskola", "Børnehave", "Maternelle");
o("{bygg} trenger {mengde}.", "{bygg} treng {mengde}.", "{bygg} needs {mengde}.", "{bygg} necesita {mengde}.", "{bygg} braucht {mengde}.", "{bygg} precisa de {mengde}.", "{bygg} behöver {mengde}.", "{bygg} har brug for {mengde}.", "{bygg} a besoin de {mengde}.");
o("har", "har", "have", "tiene", "hat", "tem", "har", "har", "a");
o(" – vi kom for sent", " – vi kom for seint", " – we were late", " – llegamos tarde", " – wir kamen zu spät", " – chegámos tarde", " – vi kom för sent", " – vi kom for sent", " – nous étions en retard");
o("Stjerne: du rakk alt!", "Stjerne: du rakk alt!", "Star: you made it all!", "Estrella: ¡llegaste a todo!", "Stern: du hast alles geschafft!", "Estrela: chegaste a tudo!", "Stjärna: du hann allt!", "Stjerne: du nåede det hele!", "Étoile : tu as tout eu !");
o("Ingen stjerne i dag.", "Inga stjerne i dag.", "No star today.", "Ninguna estrella hoy.", "Kein Stern heute.", "Nenhuma estrela hoje.", "Ingen stjärna i dag.", "Ingen stjerne i dag.", "Pas d'étoile aujourd'hui.");
o("Ny form i dag:", "Ny form i dag:", "New shape today:", "Forma nueva hoy:", "Neue Form heute:", "Forma nova hoje:", "Ny form i dag:", "Ny form i dag:", "Nouvelle forme :");
o("Gjør lekser", "Gjer lekser", "Do homework", "Haz los deberes", "Mach die Hausaufgaben", "Faz os deveres", "Gör läxorna", "Lav lektier", "Fais les devoirs");
o("Gå tur med hunden", "Gå tur med hunden", "Walk the dog", "Pasea al perro", "Geh mit dem Hund", "Passeia o cão", "Gå ut med hunden", "Gå tur med hunden", "Promène le chien");
o("Hent lillesøster", "Hent lillesyster", "Fetch little sister", "Busca a la hermana", "Hol die kleine Schwester", "Vai buscar a irmã", "Hämta lillasyster", "Hent lillesøster", "Va chercher la petite sœur");
o("Feir bursdagen", "Feir bursdagen", "Celebrate the birthday", "Celebra el cumpleaños", "Feiere den Geburtstag", "Celebra o aniversário", "Fira födelsedagen", "Fejr fødselsdagen", "Fête l'anniversaire");
o("Gå inn til tannlegen", "Gå inn til tannlækjaren", "Go in to the dentist", "Entra al dentista", "Geh zum Zahnarzt hinein", "Entra no dentista", "Gå in till tandläkaren", "Gå ind til tandlægen", "Entre chez le dentiste");
o("Svøm", "Sym", "Swim", "Nada", "Schwimm", "Nada", "Simma", "Svøm", "Nage");
o("Dans", "Dans", "Dance", "Baila", "Tanz", "Dança", "Dansa", "Dans", "Danse");
o("Gå på ski", "Gå på ski", "Go skiing", "Esquía", "Fahr Ski", "Esquia", "Åk skidor", "Stå på ski", "Fais du ski");
o("Gå på skøyter", "Gå på skøyter", "Go skating", "Patina", "Lauf Schlittschuh", "Patinar", "Åk skridskor", "Løb på skøjter", "Fais du patin");
o("Dra på speider", "Dra på speidar", "Go to scouts", "Ve a los scouts", "Geh zum Pfadfinden", "Vai aos escuteiros", "Gå på scout", "Gå til spejder", "Va aux scouts");
o("Spill sjakk", "Spel sjakk", "Play chess", "Juega al ajedrez", "Spiel Schach", "Joga xadrez", "Spela schack", "Spil skak", "Joue aux échecs");
o("Spill fotball", "Spel fotball", "Play football", "Juega al fútbol", "Spiel Fußball", "Joga futebol", "Spela fotboll", "Spil fodbold", "Joue au foot");
o("Spill håndball", "Spel handball", "Play handball", "Juega al balonmano", "Spiel Handball", "Joga andebol", "Spela handboll", "Spil håndbold", "Joue au hand");
o("Turn", "Turn", "Do gymnastics", "Haz gimnasia", "Turne", "Faz ginástica", "Gymnastisera", "Lav gymnastik", "Fais de la gym");
o("Spill i korpset", "Spel i korpset", "Play in the band", "Toca en la banda", "Spiel in der Kapelle", "Toca na banda", "Spela i korpset", "Spil i korpset", "Joue dans l'harmonie");
o("Syng", "Syng", "Sing", "Canta", "Sing", "Canta", "Sjung", "Syng", "Chante");
o("Øv", "Øv", "Practise", "Practica", "Übe", "Pratica", "Öva", "Øv", "Répète");
o("Les", "Les", "Read", "Lee", "Lies", "Lê", "Läs", "Læs", "Lis");
o("Besøk", "Besøk", "Visit", "Visita", "Besuche", "Visita", "Besök", "Besøg", "Rends visite");
o("Gjør det", "Gjer det", "Do it", "Hazlo", "Mach es", "Faz isso", "Gör det", "Gør det", "Fais-le");
o("Leksene tar {min} min. Når er du ferdig?", "Leksene tek {min} min. Når er du ferdig?", "Homework takes {min} min. When are you done?", "Los deberes tardan {min} min. ¿Cuándo terminas?", "Die Hausaufgaben dauern {min} Min. Wann bist du fertig?", "Os deveres levam {min} min. Quando acabas?", "Läxorna tar {min} min. När är du klar?", "Lektierne tager {min} min. Hvornår er du færdig?", "Les devoirs durent {min} min. Quand as-tu fini ?");
o("Turen tar {min} min. Når er dere hjemme?", "Turen tek {min} min. Når er de heime?", "The walk takes {min} min. When are you home?", "El paseo tarda {min} min. ¿Cuándo estáis en casa?", "Der Spaziergang dauert {min} Min. Wann seid ihr zu Hause?", "O passeio leva {min} min. Quando estão em casa?", "Promenaden tar {min} min. När är ni hemma?", "Turen tager {min} min. Hvornår er I hjemme?", "La promenade dure {min} min. Quand êtes-vous à la maison ?");
o("Hentingen tar {min} min. Når er dere hjemme?", "Hentinga tek {min} min. Når er de heime?", "The pickup takes {min} min. When are you home?", "La recogida tarda {min} min. ¿Cuándo estáis en casa?", "Das Abholen dauert {min} Min. Wann seid ihr zu Hause?", "A busca leva {min} min. Quando estão em casa?", "Hämtningen tar {min} min. När är ni hemma?", "Hentningen tager {min} min. Hvornår er I hjemme?", "La récupération dure {min} min. Quand êtes-vous à la maison ?");
o("Timen hos tannlegen tar {min} min. Når er den ferdig?", "Timen hos tannlækjaren tek {min} min. Når er han ferdig?", "The dentist takes {min} min. When is it done?", "El dentista tarda {min} min. ¿Cuándo termina?", "Der Zahnarzt dauert {min} Min. Wann ist es vorbei?", "O dentista leva {min} min. Quando acaba?", "Tandläkaren tar {min} min. När är den klar?", "Tandlægen tager {min} min. Hvornår er den færdig?", "Le dentiste dure {min} min. Quand est-ce fini ?");
o("Svømmingen tar {min} min. Når er dere ferdig?", "Symjinga tek {min} min. Når er de ferdige?", "Swimming takes {min} min. When are you done?", "La natación tarda {min} min. ¿Cuándo termináis?", "Das Schwimmen dauert {min} Min. Wann seid ihr fertig?", "A natação leva {min} min. Quando acabam?", "Simningen tar {min} min. När är ni klara?", "Svømningen tager {min} min. Hvornår er I færdige?", "La natation dure {min} min. Quand avez-vous fini ?");
o("Bursdagen varer {min} min. Når er den ferdig?", "Fødselsdagen varer {min} min. Når er han ferdig?", "The party lasts {min} min. When is it done?", "La fiesta dura {min} min. ¿Cuándo termina?", "Der Geburtstag dauert {min} Min. Wann ist er vorbei?", "A festa dura {min} min. Quando acaba?", "Födelsedagen varar {min} min. När är den klar?", "Fødselsdagen varer {min} min. Hvornår er den færdig?", "L'anniversaire dure {min} min. Quand est-ce fini ?");
o("Middagen tar {min} min. Når er dere ferdige?", "Middagen tek {min} min. Når er de ferdige?", "Dinner takes {min} min. When are you done?", "La cena tarda {min} min. ¿Cuándo termináis?", "Das Essen dauert {min} Min. Wann seid ihr fertig?", "O jantar leva {min} min. Quando acabam?", "Middagen tar {min} min. När är ni klara?", "Maden tager {min} min. Hvornår er I færdige?", "Le dîner dure {min} min. Quand avez-vous fini ?");
o("{navn} tar {min} min. Når er du ferdig?", "{navn} tek {min} min. Når er du ferdig?", "{navn} takes {min} min. When are you done?", "{navn} tarda {min} min. ¿Cuándo terminas?", "{navn} dauert {min} Min. Wann bist du fertig?", "{navn} leva {min} min. Quando acabas?", "{navn} tar {min} min. När är du klar?", "{navn} tager {min} min. Hvornår er du færdig?", "{navn} dure {min} min. Quand as-tu fini ?");
o("time pluss", "time pluss", "hour plus", "hora más", "Stunde plus", "hora mais", "timme plus", "time plus", "heure plus");
o("Gå ut", "Gå ut", "Leave", "Salir", "Raus", "Sair", "Gå ut", "Gå ud", "Sors");
o("3 hjørner", "3 hjørne", "3 corners", "3 esquinas", "3 Ecken", "3 cantos", "3 hörn", "3 hjørner", "3 coins");
o("4 hjørner", "4 hjørne", "4 corners", "4 esquinas", "4 Ecken", "4 cantos", "4 hörn", "4 hjørner", "4 coins");
o("Kan trille", "Kan trille", "Can roll", "Puede rodar", "Kann rollen", "Pode rolar", "Kan rulla", "Kan trille", "Peut rouler");
o("Kan ikke trille", "Kan ikkje trille", "Cannot roll", "No puede rodar", "Kann nicht rollen", "Não pode rolar", "Kan inte rulla", "Kan ikke trille", "Ne peut pas rouler");
o("Hjørner", "Hjørne", "Corners", "Esquinas", "Ecken", "Cantos", "Hörn", "Hjørner", "Coins");
o("Se etter hjørner. Har sirkelen noen hjørner?", "Sjå etter hjørne. Har sirkelen nokon hjørne?", "Look for corners. Does the circle have any?", "Busca esquinas. ¿El círculo tiene alguna?", "Such Ecken. Hat der Kreis welche?", "Procura cantos. O círculo tem algum?", "Leta efter hörn. Har cirkeln några?", "Se efter hjørner. Har cirklen nogen?", "Cherche des coins. Le cercle en a-t-il ?");
o("Se etter hjørner. En trekant har tre.", "Sjå etter hjørne. Ein trekant har tre.", "Look for corners. A triangle has three.", "Busca esquinas. Un triángulo tiene tres.", "Such Ecken. Ein Dreieck hat drei.", "Procura cantos. Um triângulo tem três.", "Leta efter hörn. En triangel har tre.", "Se efter hjørner. En trekant har tre.", "Cherche des coins. Un triangle en a trois.");
o("Se om formen kan trille.", "Sjå om forma kan trille.", "See if the shape can roll.", "Mira si la forma puede rodar.", "Schau, ob die Form rollen kann.", "Vê se a forma pode rolar.", "Se om formen kan rulla.", "Se om formen kan trille.", "Regarde si la forme peut rouler.");
o("Runde former har ingen hjørner.", "Runde former har ingen hjørne.", "Round shapes have no corners.", "Las formas redondas no tienen esquinas.", "Runde Formen haben keine Ecken.", "Formas redondas não têm cantos.", "Runda former har inga hörn.", "Runde former har ingen hjørner.", "Les formes rondes n'ont pas de coins.");
o("Tre hjørner er en trekant. Fire hjørner er et kvadrat eller et rektangel.", "Tre hjørne er ein trekant. Fire hjørne er eit kvadrat eller eit rektangel.", "Three corners is a triangle. Four corners is a square or a rectangle.", "Tres esquinas es un triángulo. Cuatro es un cuadrado o un rectángulo.", "Drei Ecken sind ein Dreieck. Vier Ecken sind ein Quadrat oder ein Rechteck.", "Três cantos são um triângulo. Quatro são um quadrado ou um retângulo.", "Tre hörn är en triangel. Fyra hörn är en kvadrat eller en rektangel.", "Tre hjørner er en trekant. Fire hjørner er et kvadrat eller et rektangel.", "Trois coins, c'est un triangle. Quatre, un carré ou un rectangle.");
o("Kule, sylinder og kjegle kan trille. Kuben kan ikke.", "Kule, sylinder og kjegle kan trille. Kuben kan ikkje.", "A sphere, a cylinder and a cone can roll. A cube cannot.", "La esfera, el cilindro y el cono ruedan. El cubo no.", "Kugel, Zylinder und Kegel können rollen. Der Würfel nicht.", "Esfera, cilindro e cone podem rolar. O cubo não.", "Kula, cylinder och kon kan rulla. Kuben kan inte.", "Kugle, cylinder og kegle kan trille. Kuben kan ikke.", "La sphère, le cylindre et le cône roulent. Le cube non.");

o("Hund", "Hund", "Dog", "Perro", "Hund", "Cão", "Hund", "Hund", "Chien");
o("Katt", "Katt", "Cat", "Gato", "Katze", "Gato", "Katt", "Kat", "Chat");
o("Kanin", "Kanin", "Rabbit", "Conejo", "Kaninchen", "Coelho", "Kanin", "Kanin", "Lapin");
o("Oppdrag", "Oppdrag", "Quest", "Misión", "Auftrag", "Missão", "Uppdrag", "Opgave", "Mission");
o("Naboen spør.", "Naboen spør.", "The neighbour asks.", "El vecino pregunta.", "Der Nachbar fragt.", "O vizinho pergunta.", "Grannen frågar.", "Naboen spørger.", "Le voisin demande.");
o("Riktig! Naboen er glad.", "Riktig! Naboen er glad.", "Right! The neighbour is happy.", "¡Bien! El vecino está contento.", "Richtig! Der Nachbar freut sich.", "Certo! O vizinho está contente.", "Rätt! Grannen är glad.", "Rigtigt! Naboen er glad.", "Juste ! Le voisin est content.");
o("Noe ligger i kassa. Det har ingen hjørner, og det kan trille.", "Noko ligg i kassa. Det har ingen hjørne, og det kan trille.", "Something is in the box. It has no corners, and it can roll.", "Hay algo en la caja. No tiene esquinas y puede rodar.", "In der Kiste liegt etwas. Es hat keine Ecken und kann rollen.", "Há algo na caixa. Não tem cantos e pode rolar.", "Något ligger i lådan. Det har inga hörn och kan rulla.", "Noget ligger i kassen. Det har ingen hjørner, og det kan trille.", "Il y a quelque chose dans la boîte. Ça n'a pas de coins, et ça peut rouler.");
o("Kumlokket i gata er rundt. Finn alle sirklene.", "Kumlokket i gata er rundt. Finn alle sirklane.", "The cover in the street is round. Find all the circles.", "La tapa de la calle es redonda. Encuentra todos los círculos.", "Der Deckel in der Straße ist rund. Finde alle Kreise.", "A tampa da rua é redonda. Encontra todos os círculos.", "Locket i gatan är runt. Hitta alla cirklar.", "Dækslet i gaden er rundt. Find alle cirklerne.", "La plaque dans la rue est ronde. Trouve tous les cercles.");
o("Se hvor lang tid veien tar.", "Sjå kor lang tid vegen tek.", "See how long the walk takes.", "Mira cuánto tarda el camino.", "Schau, wie lange der Weg dauert.", "Vê quanto tempo o caminho leva.", "Se hur lång tid vägen tar.", "Se hvor lang tid vejen tager.", "Regarde combien de temps le chemin prend.");
o("Se hva som gjentar seg.", "Sjå kva som gjentar seg.", "See what repeats.", "Mira qué se repite.", "Schau, was sich wiederholt.", "Vê o que se repete.", "Se vad som upprepas.", "Se hvad der gentager sig.", "Regarde ce qui se répète.");
o("Du rekker fram.", "Du rekk fram.", "You will get there.", "Llegas a tiempo.", "Du schaffst es.", "Chegas a tempo.", "Du hinner fram.", "Du når frem.", "Tu arrives à temps.");
o("Du rekker ikke fram.", "Du rekk ikkje fram.", "You will not get there.", "No llegas a tiempo.", "Du schaffst es nicht.", "Não chegas a tempo.", "Du hinner inte fram.", "Du når ikke frem.", "Tu n'arrives pas à temps.");
o("Neste form er {form}.", "Neste form er {form}.", "The next shape is {form}.", "La siguiente forma es {form}.", "Die nächste Form ist {form}.", "A próxima forma é {form}.", "Nästa form är {form}.", "Den næste form er {form}.", "La forme suivante est {form}.");
o("Se etter {form}.", "Sjå etter {form}.", "Look for {form}.", "Busca {form}.", "Suche nach {form}.", "Procura {form}.", "Leta efter {form}.", "Se efter {form}.", "Cherche {form}.");
o("Fredagsfest på torget.", "Fredagsfest på torget.", "Friday party on the square.", "Fiesta del viernes en la plaza.", "Freitagsfest auf dem Platz.", "Festa de sexta na praça.", "Fredagsfest på torget.", "Fredagsfest på torvet.", "Fête du vendredi sur la place.");
o("{tall} hjørner", "{tal} hjørne", "{tall} corners", "{tall} esquinas", "{tall} Ecken", "{tall} cantos", "{tall} hörn", "{tall} hjørner", "{tall} coins");
o("Ingen hjørner", "Ingen hjørne", "No corners", "Sin esquinas", "Keine Ecken", "Sem cantos", "Inga hörn", "Ingen hjørner", "Pas de coins");
o("Kan trille", "Kan trille", "Can roll", "Puede rodar", "Kann rollen", "Pode rolar", "Kan rulla", "Kan trille", "Peut rouler");

// Gjennomgang 9: nye tekster til barnet og den voksne.
o("Løs oppgaven for å få {del}.", "Løys oppgåva for å få {del}.", "Solve the task to get {del}.", "Resuelve la tarea para conseguir {del}.", "Löse die Aufgabe, dann bekommst du {del}.", "Resolve a tarefa para ganhar {del}.", "Lös uppgiften för att få {del}.", "Løs opgaven for at få {del}.", "Résous la tâche pour avoir {del}.");
o("{del} er {form}.", "{del} er {form}.", "{del} is a {form}.", "{del} es un {form}.", "{del} ist ein {form}.", "{del} é um {form}.", "{del} är en {form}.", "{del} er en {form}.", "{del} est un {form}.");
o("{del} ligger i hylla med {flertall}.", "{del} ligg i hylla med {flertall}.", "{del} is on the {flertall} shelf.", "{del} está en el estante de {flertall}.", "{del} liegt im Regal mit {flertall}.", "{del} está na prateleira de {flertall}.", "{del} ligger på hyllan med {flertall}.", "{del} ligger på hylden med {flertall}.", "{del} est sur l'étagère des {flertall}.");
o("Vi prøver et nytt oppdrag i morgen.", "Vi prøver eit nytt oppdrag i morgon.", "We will try a new task tomorrow.", "Mañana probamos otra misión.", "Morgen versuchen wir einen neuen Auftrag.", "Amanhã tentamos outra missão.", "Vi provar ett nytt uppdrag i morgon.", "Vi prøver en ny opgave i morgen.", "Demain, on essaie une nouvelle mission.");
o("Du får {n} mynter.", "Du får {n} myntar.", "You get {n} coins.", "Recibes {n} monedas.", "Du bekommst {n} Münzen.", "Ganhas {n} moedas.", "Du får {n} mynt.", "Du får {n} mønter.", "Tu gagnes {n} pièces.");
o("Du har {n} mynter. {pynt} koster {pris}.", "Du har {n} myntar. {pynt} kostar {pris}.", "You have {n} coins. {pynt} costs {pris}.", "Tienes {n} monedas. {pynt} cuesta {pris}.", "Du hast {n} Münzen. {pynt} kostet {pris}.", "Tens {n} moedas. {pynt} custa {pris}.", "Du har {n} mynt. {pynt} kostar {pris}.", "Du har {n} mønter. {pynt} koster {pris}.", "Tu as {n} pièces. {pynt} coûte {pris}.");
o("Der er det ikke plass.", "Der er det ikkje plass.", "There is no room there.", "Ahí no hay sitio.", "Dort ist kein Platz.", "Ali não há espaço.", "Där finns det ingen plats.", "Der er ikke plads.", "Il n'y a pas de place là.");
o("Naboen trenger hjelp før kl. {tid}. Du får 2 mynter.", "Naboen treng hjelp før kl. {tid}. Du får 2 myntar.", "The neighbor needs help before {tid}. You get 2 coins.", "El vecino necesita ayuda antes de las {tid}. Recibes 2 monedas.", "Der Nachbar braucht vor {tid} Hilfe. Du bekommst 2 Münzen.", "O vizinho precisa de ajuda antes das {tid}. Ganhas 2 moedas.", "Grannen behöver hjälp före {tid}. Du får 2 mynt.", "Naboen har brug for hjælp før kl. {tid}. Du får 2 mønter.", "Le voisin a besoin d'aide avant {tid}. Tu gagnes 2 pièces.");
o("Vi har gjort alt vi rakk i dag. Vi venter hjemme til leggetid.", "Vi har gjort alt vi rakk i dag. Vi ventar heime til leggetid.", "We did all we could today. We wait at home until bedtime.", "Hoy hicimos todo lo que pudimos. Esperamos en casa hasta la hora de dormir.", "Heute haben wir alles geschafft. Wir warten zu Hause bis zur Schlafenszeit.", "Hoje fizemos tudo o que deu. Esperamos em casa até à hora de dormir.", "Vi har gjort allt vi hann i dag. Vi väntar hemma till läggdags.", "Vi har gjort alt, vi nåede i dag. Vi venter hjemme til sengetid.", "On a fait tout ce qu'on pouvait aujourd'hui. On attend à la maison jusqu'au coucher.");
o("{neste} kan vi begynne på i morgen. Vi venter hjemme til leggetid.", "{neste} kan vi byrje på i morgon. Vi ventar heime til leggetid.", "We can start {neste} tomorrow. We wait at home until bedtime.", "Mañana podemos empezar {neste}. Esperamos en casa hasta la hora de dormir.", "Mit {neste} können wir morgen anfangen. Wir warten zu Hause bis zur Schlafenszeit.", "Amanhã podemos começar {neste}. Esperamos em casa até à hora de dormir.", "{neste} kan vi börja på i morgon. Vi väntar hemma till läggdags.", "{neste} kan vi begynde på i morgen. Vi venter hjemme til sengetid.", "On pourra commencer {neste} demain. On attend à la maison jusqu'au coucher.");
o("{ferdig} er ferdig! Vil du begynne på {neste} også? Det trenger {deler}.", "{ferdig} er ferdig! Vil du byrje på {neste} også? Det treng {deler}.", "{ferdig} is done! Do you want to start {neste} too? It needs {deler}.", "¡{ferdig} está listo! ¿Quieres empezar {neste} también? Necesita {deler}.", "{ferdig} ist fertig! Willst du auch {neste} anfangen? Es braucht {deler}.", "{ferdig} está pronto! Queres começar {neste} também? Precisa de {deler}.", "{ferdig} är klar! Vill du börja på {neste} också? Den behöver {deler}.", "{ferdig} er færdig! Vil du også begynde på {neste}? Det skal bruge {deler}.", "{ferdig} est fini ! Tu veux commencer {neste} aussi ? Il faut {deler}.");
o("{bygg} trenger {del}.", "{bygg} treng {del}.", "{bygg} needs {del}.", "{bygg} necesita {del}.", "{bygg} braucht {del}.", "{bygg} precisa de {del}.", "{bygg} behöver {del}.", "{bygg} skal bruge {del}.", "Il faut {del} pour {bygg}.");
o("{bygg} trenger {del}. Gå til butikken.", "{bygg} treng {del}. Gå til butikken.", "{bygg} needs {del}. Go to the shop.", "{bygg} necesita {del}. Ve a la tienda.", "{bygg} braucht {del}. Geh zum Laden.", "{bygg} precisa de {del}. Vai à loja.", "{bygg} behöver {del}. Gå till butiken.", "{bygg} skal bruge {del}. Gå til butikken.", "Il faut {del} pour {bygg}. Va au magasin.");
o("{bygg} trenger {del}. Butikken åpner kl. {tid}. Gå dit og les skiltet.", "{bygg} treng {del}. Butikken opnar kl. {tid}. Gå dit og les skiltet.", "{bygg} needs {del}. The shop opens at {tid}. Go there and read the sign.", "{bygg} necesita {del}. La tienda abre a las {tid}. Ve y lee el cartel.", "{bygg} braucht {del}. Der Laden öffnet um {tid}. Geh hin und lies das Schild.", "{bygg} precisa de {del}. A loja abre às {tid}. Vai lá e lê a placa.", "{bygg} behöver {del}. Butiken öppnar {tid}. Gå dit och läs skylten.", "{bygg} skal bruge {del}. Butikken åbner kl. {tid}. Gå derhen og læs skiltet.", "Il faut {del} pour {bygg}. Le magasin ouvre à {tid}. Vas-y et lis le panneau.");
o("Du rakk alt", "Du rakk alt", "You made it to everything", "Llegaste a todo", "Du hast alles geschafft", "Chegaste a tudo", "Du hann allt", "Du nåede det hele", "Tu as tout fait à temps");
o("Du rakk ikke alt", "Du rakk ikkje alt", "You did not make it to everything", "No llegaste a todo", "Du hast nicht alles geschafft", "Não chegaste a tudo", "Du hann inte allt", "Du nåede ikke det hele", "Tu n'as pas tout fait à temps");
o("Ingen oppgaver i dag", "Ingen oppgåver i dag", "No tasks today", "Hoy no hubo tareas", "Heute keine Aufgaben", "Hoje não houve tarefas", "Inga uppgifter i dag", "Ingen opgaver i dag", "Pas de tâches aujourd'hui");
o("{a} av {b} riktige på første forsøk", "{a} av {b} rette på første forsøk", "{a} of {b} right on the first try", "{a} de {b} bien a la primera", "{a} von {b} beim ersten Versuch richtig", "{a} de {b} certas à primeira", "{a} av {b} rätt på första försöket", "{a} af {b} rigtige i første forsøg", "{a} sur {b} justes du premier coup");
o("Oppdraget var riktig på første forsøk", "Oppdraget var rett på første forsøk", "The task was right on the first try", "La misión salió bien a la primera", "Der Auftrag war beim ersten Versuch richtig", "A missão ficou certa à primeira", "Uppdraget var rätt på första försöket", "Opgaven var rigtig i første forsøg", "La mission était juste du premier coup");
o("Oppdraget ble gjort, men ikke på første forsøk.", "Oppdraget vart gjort, men ikkje på første forsøk.", "The task was done, but not on the first try.", "La misión se hizo, pero no a la primera.", "Der Auftrag wurde erledigt, aber nicht beim ersten Versuch.", "A missão foi feita, mas não à primeira.", "Uppdraget blev gjort, men inte på första försöket.", "Opgaven blev løst, men ikke i første forsøg.", "La mission a été faite, mais pas du premier coup.");
o("Oppdraget ble ikke gjort", "Oppdraget vart ikkje gjort", "The task was not done", "La misión no se hizo", "Der Auftrag wurde nicht erledigt", "A missão não foi feita", "Uppdraget blev inte gjort", "Opgaven blev ikke løst", "La mission n'a pas été faite");
o("Prøv igjen.", "Prøv igjen.", "Try again.", "Inténtalo otra vez.", "Versuch es noch einmal.", "Tenta outra vez.", "Försök igen.", "Prøv igen.", "Essaie encore.");
o("Lille viser", "Vesle visaren", "Short hand", "Aguja corta", "Kleiner Zeiger", "Ponteiro pequeno", "Lilla visaren", "Lille viser", "Petite aiguille");
o("Store viser", "Store visaren", "Long hand", "Aguja larga", "Großer Zeiger", "Ponteiro grande", "Stora visaren", "Store viser", "Grande aiguille");
o("{n} minutter", "{n} minutt", "{n} minutes", "{n} minutos", "{n} Minuten", "{n} minutos", "{n} minuter", "{n} minutter", "{n} minutes");
o("Minus {trinn}", "Minus {trinn}", "Minus {trinn}", "Menos {trinn}", "Minus {trinn}", "Menos {trinn}", "Minus {trinn}", "Minus {trinn}", "Moins {trinn}");
o("Pluss {trinn}", "Pluss {trinn}", "Plus {trinn}", "Más {trinn}", "Plus {trinn}", "Mais {trinn}", "Plus {trinn}", "Plus {trinn}", "Plus {trinn}");
o("Tårnuret går riktig.", "Tårnuret går rett.", "The tower clock is right.", "El reloj de la torre va bien.", "Die Turmuhr geht richtig.", "O relógio da torre está certo.", "Tornuret går rätt.", "Tårnuret går rigtigt.", "L'horloge de la tour est à l'heure.");
o("I morgen begynner {navn} klokka {ord}. Still tårnuret.", "I morgon byrjar {navn} klokka {ord}. Still tårnuret.", "Tomorrow {navn} starts at {ord}. Set the tower clock.", "Mañana {navn} empieza a {ord}. Pon el reloj de la torre.", "Morgen beginnt {navn} um {ord}. Stell die Turmuhr.", "Amanhã {navn} começa às {ord}. Acerta o relógio da torre.", "I morgon börjar {navn} klockan {ord}. Ställ tornuret.", "I morgen begynder {navn} klokken {ord}. Stil tårnuret.", "Demain, {navn} commence à {ord}. Règle l'horloge de la tour.");
o("I morgen åpner butikken klokka {ord}. Still tårnuret.", "I morgon opnar butikken klokka {ord}. Still tårnuret.", "Tomorrow the shop opens at {ord}. Set the tower clock.", "Mañana la tienda abre a {ord}. Pon el reloj de la torre.", "Morgen öffnet der Laden um {ord}. Stell die Turmuhr.", "Amanhã a loja abre às {ord}. Acerta o relógio da torre.", "I morgon öppnar butiken klockan {ord}. Ställ tornuret.", "I morgen åbner butikken klokken {ord}. Stil tårnuret.", "Demain, le magasin ouvre à {ord}. Règle l'horloge de la tour.");
o("I morgen er leggetid klokka {ord}. Still tårnuret.", "I morgon er leggetid klokka {ord}. Still tårnuret.", "Tomorrow bedtime is at {ord}. Set the tower clock.", "Mañana la hora de dormir es a {ord}. Pon el reloj de la torre.", "Morgen ist Schlafenszeit um {ord}. Stell die Turmuhr.", "Amanhã a hora de dormir é às {ord}. Acerta o relógio da torre.", "I morgon är det läggdags klockan {ord}. Ställ tornuret.", "I morgen er det sengetid klokken {ord}. Stil tårnuret.", "Demain, le coucher est à {ord}. Règle l'horloge de la tour.");
o("Still tårnuret til klokka {ord}.", "Still tårnuret til klokka {ord}.", "Set the tower clock to {ord}.", "Pon el reloj de la torre a {ord}.", "Stell die Turmuhr auf {ord}.", "Acerta o relógio da torre para {ord}.", "Ställ tornuret på {ord}.", "Stil tårnuret på {ord}.", "Règle l'horloge de la tour sur {ord}.");
o("I morgen henter vi lillesøster klokka {ord}. Still tårnuret.", "I morgon hentar vi lillesyster klokka {ord}. Still tårnuret.", "Tomorrow we pick up little sister at {ord}. Set the tower clock.", "Mañana buscamos a la hermana a {ord}. Pon el reloj de la torre.", "Morgen holen wir die kleine Schwester um {ord} ab. Stell die Turmuhr.", "Amanhã vamos buscar a irmã às {ord}. Acerta o relógio da torre.", "I morgon hämtar vi lillasyster klockan {ord}. Ställ tornuret.", "I morgen henter vi lillesøster klokken {ord}. Stil tårnuret.", "Demain, on va chercher la petite sœur à {ord}. Règle l'horloge de la tour.");
o("I morgen lufter vi hunden klokka {ord}. Still tårnuret.", "I morgon luftar vi hunden klokka {ord}. Still tårnuret.", "Tomorrow we walk the dog at {ord}. Set the tower clock.", "Mañana paseamos al perro a {ord}. Pon el reloj de la torre.", "Morgen führen wir den Hund um {ord} aus. Stell die Turmuhr.", "Amanhã passeamos o cão às {ord}. Acerta o relógio da torre.", "I morgon rastar vi hunden klockan {ord}. Ställ tornuret.", "I morgen lufter vi hunden klokken {ord}. Stil tårnuret.", "Demain, on promène le chien à {ord}. Règle l'horloge de la tour.");
o("I morgen gjør vi lekser klokka {ord}. Still tårnuret.", "I morgon gjer vi lekser klokka {ord}. Still tårnuret.", "Tomorrow we do homework at {ord}. Set the tower clock.", "Mañana hacemos los deberes a {ord}. Pon el reloj de la torre.", "Morgen machen wir um {ord} Hausaufgaben. Stell die Turmuhr.", "Amanhã fazemos os trabalhos de casa às {ord}. Acerta o relógio da torre.", "I morgon gör vi läxor klockan {ord}. Ställ tornuret.", "I morgen laver vi lektier klokken {ord}. Stil tårnuret.", "Demain, on fait les devoirs à {ord}. Règle l'horloge de la tour.");
o("I morgen spiser vi middag klokka {ord}. Still tårnuret.", "I morgon et vi middag klokka {ord}. Still tårnuret.", "Tomorrow we eat dinner at {ord}. Set the tower clock.", "Mañana cenamos a {ord}. Pon el reloj de la torre.", "Morgen essen wir um {ord} zu Abend. Stell die Turmuhr.", "Amanhã jantamos às {ord}. Acerta o relógio da torre.", "I morgon äter vi middag klockan {ord}. Ställ tornuret.", "I morgen spiser vi aftensmad klokken {ord}. Stil tårnuret.", "Demain, on dîne à {ord}. Règle l'horloge de la tour.");
o("I morgen skal vi til tannlegen klokka {ord}. Still tårnuret.", "I morgon skal vi til tannlækjaren klokka {ord}. Still tårnuret.", "Tomorrow we go to the dentist at {ord}. Set the tower clock.", "Mañana vamos al dentista a {ord}. Pon el reloj de la torre.", "Morgen gehen wir um {ord} zum Zahnarzt. Stell die Turmuhr.", "Amanhã vamos ao dentista às {ord}. Acerta o relógio da torre.", "I morgon ska vi till tandläkaren klockan {ord}. Ställ tornuret.", "I morgen skal vi til tandlæge klokken {ord}. Stil tårnuret.", "Demain, on va chez le dentiste à {ord}. Règle l'horloge de la tour.");
o("Kaka skal stekes i {varighet}. Den kom inn klokka {inn}. Når tar vi den ut?", "Kaka skal stekast i {varighet}. Ho kom inn klokka {inn}. Når tek vi ho ut?", "The cake bakes for {varighet}. It went in at {inn}. When do we take it out?", "El pastel se hornea {varighet}. Entró a {inn}. ¿Cuándo lo sacamos?", "Der Kuchen backt {varighet}. Er kam um {inn} hinein. Wann holen wir ihn raus?", "O bolo coze {varighet}. Entrou às {inn}. Quando o tiramos?", "Kakan ska gräddas i {varighet}. Den åkte in klockan {inn}. När tar vi ut den?", "Kagen skal bage i {varighet}. Den kom ind klokken {inn}. Hvornår tager vi den ud?", "Le gâteau cuit {varighet}. Il est entré à {inn}. Quand le sortons-nous ?");
o("en halvtime", "ein halvtime", "half an hour", "media hora", "eine halbe Stunde", "meia hora", "en halvtimme", "en halv time", "une demi-heure");
o("tre kvarter", "tre kvarter", "three quarters of an hour", "tres cuartos de hora", "eine Dreiviertelstunde", "três quartos de hora", "tre kvart", "tre kvarter", "trois quarts d'heure");
o("en time", "ein time", "an hour", "una hora", "eine Stunde", "uma hora", "en timme", "en time", "une heure");
o("Den kan trille i alle retninger. Hvilken form er det?", "Han kan trille i alle retningar. Kva for form er det?", "It can roll in every direction. Which shape is it?", "Puede rodar en todas direcciones. ¿Qué forma es?", "Sie kann in alle Richtungen rollen. Welche Form ist das?", "Pode rolar para todos os lados. Que forma é?", "Den kan rulla åt alla håll. Vilken form är det?", "Den kan trille i alle retninger. Hvilken form er det?", "Elle peut rouler dans tous les sens. Quelle forme est-ce ?");
o("Den har ingen hjørner og ingen flate sider.", "Han har ingen hjørne og ingen flate sider.", "It has no corners and no flat sides.", "No tiene esquinas ni caras planas.", "Sie hat keine Ecken und keine flachen Seiten.", "Não tem cantos nem lados planos.", "Den har inga hörn och inga platta sidor.", "Den har ingen hjørner og ingen flade sider.", "Elle n'a ni coins ni faces plates.");
o("Den er rund som en ball.", "Han er rund som ein ball.", "It is round like a ball.", "Es redonda como una pelota.", "Sie ist rund wie ein Ball.", "É redonda como uma bola.", "Den är rund som en boll.", "Den er rund som en bold.", "Elle est ronde comme une balle.");
o("Du bruker {varighet}. Rekker du det før kl. {tid}?", "Du brukar {varighet}. Rekk du det før kl. {tid}?", "It takes {varighet}. Will you make it before {tid}?", "Tardas {varighet}. ¿Llegas antes de las {tid}?", "Du brauchst {varighet}. Schaffst du es vor {tid}?", "Demoras {varighet}. Consegues antes das {tid}?", "Det tar {varighet}. Hinner du före {tid}?", "Du bruger {varighet}. Når du det før kl. {tid}?", "Il te faut {varighet}. Tu y arrives avant {tid} ?");
o("Du bruker {min} minutter. Rekker du det før kl. {tid}?", "Du brukar {min} minutt. Rekk du det før kl. {tid}?", "It takes {min} minutes. Will you make it before {tid}?", "Tardas {min} minutos. ¿Llegas antes de las {tid}?", "Du brauchst {min} Minuten. Schaffst du es vor {tid}?", "Demoras {min} minutos. Consegues antes das {tid}?", "Det tar {min} minuter. Hinner du före {tid}?", "Du bruger {min} minutter. Når du det før kl. {tid}?", "Il te faut {min} minutes. Tu y arrives avant {tid} ?");
o("Butikk", "Butikk", "Shop", "Tienda", "Laden", "Loja", "Butik", "Butik", "Magasin");
o("Hjem", "Heim", "Home", "Casa", "Zuhause", "Casa", "Hem", "Hjem", "Maison");
o("Pyntebu", "Pyntebu", "Decor shop", "Tienda de adornos", "Schmuckladen", "Loja de enfeites", "Pyntbod", "Pyntebod", "Boutique déco");
o("Tårnet", "Tårnet", "Tower", "Torre", "Turm", "Torre", "Tornet", "Tårnet", "Tour");
o("Tannlege", "Tannlækjar", "Dentist", "Dentista", "Zahnarzt", "Dentista", "Tandläkare", "Tandlæge", "Dentiste");
o("Svømmehall", "Symjehall", "Pool", "Piscina", "Schwimmbad", "Piscina", "Simhall", "Svømmehal", "Piscine");
o("Barnehage", "Barnehage", "Kindergarten", "Guardería", "Kindergarten", "Jardim de infância", "Förskola", "Børnehave", "Crèche");
o("Fargen betyr ikke noe. Se på formen.", "Fargen betyr ikkje noko. Sjå på forma.", "The color does not matter. Look at the shape.", "El color no importa. Mira la forma.", "Die Farbe ist egal. Schau auf die Form.", "A cor não importa. Olha para a forma.", "Färgen spelar ingen roll. Titta på formen.", "Farven betyder ikke noget. Se på formen.", "La couleur ne compte pas. Regarde la forme.");
o("Alle formene ligger i kassene.", "Alle formene ligg i kassane.", "All the shapes are in the boxes.", "Todas las formas están en las cajas.", "Alle Formen liegen in den Kisten.", "Todas as formas estão nas caixas.", "Alla former ligger i lådorna.", "Alle figurerne ligger i kasserne.", "Toutes les formes sont dans les boîtes.");
o("Åpningstider", "Opningstider", "Opening hours", "Horario", "Öffnungszeiten", "Horário", "Öppettider", "Åbningstider", "Horaires");
o("Hvilken tid viser klokka?", "Kva for tid viser klokka?", "What time does the clock show?", "¿Qué hora marca el reloj?", "Welche Zeit zeigt die Uhr?", "Que horas mostra o relógio?", "Vilken tid visar klockan?", "Hvilken tid viser uret?", "Quelle heure indique l'horloge ?");
o("Åpne voksensiden", "Opne vaksensida", "Open the adult page", "Abrir la página para adultos", "Seite für Erwachsene öffnen", "Abrir a página dos adultos", "Öppna vuxensidan", "Åbn siden for voksne", "Ouvrir la page adulte");
o("For voksne. Løs regnestykket for å åpne.", "For vaksne. Løys reknestykket for å opne.", "For adults. Solve the sum to open.", "Para adultos. Resuelve la cuenta para abrir.", "Für Erwachsene. Löse die Rechnung zum Öffnen.", "Para adultos. Resolve a conta para abrir.", "För vuxna. Lös talet för att öppna.", "For voksne. Løs regnestykket for at åbne.", "Pour les adultes. Résous le calcul pour ouvrir.");
o("Feil svar. Prøv dette:", "Feil svar. Prøv dette:", "Wrong answer. Try this one:", "Respuesta incorrecta. Prueba esta:", "Falsche Antwort. Versuch diese:", "Resposta errada. Tenta esta:", "Fel svar. Prova det här:", "Forkert svar. Prøv dette:", "Mauvaise réponse. Essaie celui-ci :");
o("← Tilbake til spillet", "← Tilbake til spelet", "← Back to the game", "← Volver al juego", "← Zurück zum Spiel", "← Voltar ao jogo", "← Tillbaka till spelet", "← Tilbage til spillet", "← Retour au jeu");

fyllSteg(o);
