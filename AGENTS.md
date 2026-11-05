# AGENTS.md

Formbyen er et norsk byggespill om former og klokka for 1. og 2. klasse. Det er en Vite + TypeScript PWA som publiseres til GitHub Pages.

## Kommandoer

- npm install
- npm test
- npm run dev
- npm run build
- npm run preview
- npm run ikon — lager ikonene i public/

## Arkitektur

- src/typer.ts — felles typer. Endre disse først når du legger til en modus eller en innstilling.
- src/tid/ — klokkeslett, ord og visere. Ingen DOM.
- src/former/ — definisjoner av 2D- og 3D-former.
- src/tilpasning/ — mestring innen nivå.
- src/dag/ — dagsplan og aktiviteter.
- src/bygg/ — katalog og kart.
- src/oppgaver/ — maler, trekking og svar.
- src/tegning/ — dekning av fingertegning.
- src/lagring/ — localStorage, eksport og import.
- src/spill/okt.ts — turen. Skjermene kaller `utfor`.
- src/grafikk/ — SVG. Farger bare fra `stil.ts`. Se STIL.md.
- src/app.ts — skjermer.
- src/pwa/ — oppdatering og storage.persist.
- Spec: docs/superpowers/specs/2026-11-04-formbyen-design.md

## Avklarte valg

- Én by per telefon. Eksport og import flytter den. Ingen flere byer.
- Digital klokke er alltid 24 timer, også i 1. klasse. Ordene står ved siden av. «Halv tre» er 02:30 og 14:30.
- Avtalene er oppdiktet og følger en fast ukerytme. Voksensiden kan feste ekte avtaler, for eksempel korps tirsdag 18:00.
- Kompetansemålene ligger på voksensiden i appen.
- Ingen tale i v1. Lyd er av som standard. Språk: bokmål, nynorsk, engelsk, spansk, tysk, portugisisk, svensk, dansk og fransk. Digital klokke er alltid 24 timer. Klokkeordene følger landet: «halv tre» er 14:30 på norsk, svensk, dansk og tysk. «Half past two», «las dos y media», «duas e meia» og «deux heures et demie» er også 14:30. Nynorsk har samme klokkeord som bokmål. Ukedagene er ulike.

## Regler

- Tekst til barnet er bokmål eller nynorsk, korte setninger, med Æ Ø Å.
- Lagre bare på telefonen, nøkkel `formbyen-v1`. Ingen analyse, konto eller tjener.
- Logikk skal kunne testes uten DOM. `tilfeldig` skal kunne byttes ut.
- Logikkendringer trenger en Vitest som feiler først.
- Ikke bland oppgavematte inn i SVG-tegningen.
- GitHub Pages-basen er `/formbyen/`.
- Commit bare når mennesket ber om det. Push bare når mennesket ber om det.
- Ikke endre bananmatte eller storealfabet.
