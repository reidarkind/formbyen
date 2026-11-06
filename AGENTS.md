# AGENTS.md

Formbyen er et norsk byggespill om former og klokka for 1. og 2. klasse. Det er en Vite + TypeScript PWA som publiseres til GitHub Pages.

## Kommandoer

- npm install
- npm test — Vitest, logikk og simulering
- npm run test:skjerm — Playwright: alle skjermer og oppgavemaler i Chromium og WebKit med mobilprofiler. Kjør `npx playwright install chromium webkit` hvis nettleserne mangler.
- npm run dev
- npm run build
- npm run preview
- npm run ikon — lager ikonene i public/

## Arkitektur

- src/typer.ts — felles typer. Endre disse først når du legger til en modus eller en innstilling.
- src/tid/ — klokkeslett, ord og visere. Ingen DOM.
- src/former/ — definisjoner av 2D- og 3D-former.
- src/tilpasning/ — mestring innen nivå. `oversikt.ts` lager voksensidens mestring (Ikke øvd, Øver, Sikker).
- src/dag/ — dagsplan og aktiviteter.
- src/bygg/ — katalog og kart.
- src/oppgaver/ — maler, trekking og svar.
- src/tegning/ — dekning av fingertegning.
- src/lagring/ — localStorage, eksport og import.
- src/spill/okt.ts — turen. Skjermene kaller `utfor`.
- src/spill/anbefaling.ts — neste steg: den gule knappen og hjelperens tekst.
- src/spill/taarnur.ts — tårnurets runde fra morgendagens plan.
- src/spill/testbot.ts — brukes bare av tester: følger den gule knappen gjennom en dag.
- src/grafikk/ — SVG. Farger bare fra `stil.ts`. Se STIL.md.
- src/app.ts — skjermer. `window.formbyenTest` finnes bare i utviklingsmodus, for skjermtesten.
- src/pwa/ — oppdatering og storage.persist.
- tester/ — skjermtesten (`skjerm.spec.ts`, tilstander i `tilstander.ts`) og flyt med vanlige trykk (`flyt.spec.ts`).
- Spec: docs/superpowers/specs/2026-11-04-formbyen-design.md. Skjermregler: docs/skjermkart.md.
- Gjennomgangene ligger i tmp/. Den siste gjelder ved konflikt.

## Avklarte valg

- Én by per telefon. Eksport og import flytter den. Import må bekreftes, og en fil uten versjon endrer ikke byen. Ingen flere byer.
- Kartet er spillet, og det viser alltid hele byen. Hjem, butikk, torg, tårn, pyntebu, tannlege og svømmehall står fast. Tårnet (E3) og pyntebua (F3) står på stien. Skilt som ville dekket hverandre, skjules (`ryddSkilt`). Hvert sted har en trykkflate på minst 44 × 44 px, og navneskiltet kan trykkes. Gange tar 15 minutter, 30 til tannlegen og svømmehallen (30 overalt i 1. klasse). Avtaler lagres som id og vises på språket som er valgt nå.
- Ett bygg om dagen. Et ekstra bygg er et valg, og det tilbys bare når butikken er åpen minst 30 minutter når barnet kommer fram. «Nei, ikke i dag» er den gule knappen.
- Morgendagens plan lages når dagen starter (`aktivDag.morgen`). Tårnuret, skiltet og «åpner i morgen» bruker den.
- Digital klokke er alltid 24 timer, også i 1. klasse. Ordene står ved siden av. «Halv tre» er 02:30 og 14:30. Når barnet stiller en analog klokke, godtas begge.
- Avtalene er oppdiktet og følger en fast ukerytme. Voksensiden kan feste ekte avtaler, for eksempel korps tirsdag 18:00. Faste avtaler slås sammen med rytmen, hoppes aldri over og gjelder fra i morgen (`faste-avtaler` i okt.ts). Bare aktiviteter som er låst opp, kan velges.
- Voksensiden ligger bak et regnestykke. Nivå, språk og lyd ligger der. Låsen lukkes når den voksne går ut og etter fem minutter. Kompetansemålene ligger på voksensiden.
- Oppgavene i butikken: minst halvparten av formoppgavene handler om delen. Ellers står «Løs oppgaven for å få …» som en liten linje over oppgaven. Måling, kart og kalender kommer per nivå: ukeplan og kalender i 1. klasse, lengde og masse fra 2. klasse, areal, koordinater og likevekt på utfordrende. Alle oppgaver som vises, går inn i én historikk (`huskOppgave`/`vis` i okt.ts). Samme type høyst tre ganger per dag og to på rad, samme mal ikke igjen innen ti oppgaver, og samme tekst og svar ikke igjen innen tre dager. Hver type har minst seks ordlyder, og malvarianten styrer tekst og innhold. Se docs/skjermkart.md.
- Når alt på nivået er bygget og et krav for neste nivå mangler (mønster, klokke på rad, klosser), blir den gule knappen «Øv på …» (`kravSomOves`).
- To feil på en oppgave sender runden videre. En mislykket butikkrunde koster tid, og et oppdrag avsluttes for dagen.
- Tempo: slottet nås på 25–35 ettermiddager i 1. klasse og 20–25 i 2. klasse når rådet følges.
- Oppdatering: «Sjekk for oppdateringer» spør serveren (`reg.update()`), og appen sjekker selv når den blir synlig (høyst hvert kvarter) og hver time. Bare «Åpne på nytt» i banneret aktiverer en ny versjon. «Om appen» viser commit og byggedato.
- Pynt står i hagene til byggene, langs stien og ved torget, aldri på en rute som kan bli tomt. Se docs/skjermkart.md.
- Klokker som stilles: trykk og dra tolkes som vinkel, og barnet velger viser (`felles/urInput.ts`).
- Tårnet åpner klokkeleken bare når det ikke er noe annet å gjøre. Hver ny runde samme dag gir nye mål, og bare den første gir mynter.
- Ingen tale i v1. Lyd er av som standard. Språk: bokmål, nynorsk, engelsk, spansk, tysk, portugisisk, svensk, dansk og fransk. Digital klokke er alltid 24 timer. Klokkeordene følger landet: «halv tre» er 14:30 på norsk, svensk, dansk og tysk. «Half past two», «las dos y media», «duas e meia» og «deux heures et demie» er også 14:30. Nynorsk har samme klokkeord som bokmål. Ukedagene er ulike.

## Regler

- Tekst til barnet er bokmål eller nynorsk, eller andre angitte språk angitt i innstillinger, korte setninger, med Æ Ø Å. Alle tekster hentes fra ordboka (`mal`/`si`). Klokkeslett i ord har «klokka» foran. Deler og bygg bøyes (`vareMedArtikkel`, `byggBestemt`). Rå id-er vises aldri.
- Tilpass så alt er synlig uten scrolling: fast topp, midtsone som skaleres (`clamp()`, `dvh`, containerenheter) eller deles opp, fast bunn med veien ut. Bare lange lister (dagboka, albumet, voksensiden) kan scrolle, med synlig skygge. Scroll er bedre enn klipp. `overflow: hidden` bare på dekor. Ingenting skjules med `display: none` på grunn av skjermhøyde. Knapper er minst 44 px.
- Skjermtesten skal være grønn i Chromium og WebKit før publisering. Nye skjermer og maler legges inn i `tester/tilstander.ts`.
- GitHub-bygget kjører i imaget `mcr.microsoft.com/playwright:v<versjon>-noble`. Når `@playwright/test` oppdateres, må versjonen i `.github/workflows/pages.yml` endres samtidig. Versjonen står uten `^`.
- Lagre bare på telefonen, nøkkel `formbyen-v1`. Ingen analyse, konto eller tjener.
- Logikk skal kunne testes uten DOM. `tilfeldig` skal kunne byttes ut.
- Logikkendringer trenger en Vitest som feiler først.
- Ikke bland oppgavematte inn i SVG-tegningen. Tall og tekst i bilder står som HTML, ikke `<text>` i SVG.
- GitHub Pages-basen er `/formbyen/`.
- Commit til main når du har gjort ferdig arbeidet og det er testet. Push etterpå.
- Ikke endre bananmatte eller storealfabet.
