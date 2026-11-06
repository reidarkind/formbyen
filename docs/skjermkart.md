# Skjermkart

Bykartet er hjem for alt. Fra et sted kommer barnet tilbake med **← Byen**. Det koster ikke tid. Figuren står da utenfor stedet.

```
Forside ──(første gang)──► Intro ──► Dagens plan
   ▲                                     │
   │                                     ▼
 Kveld ◄── «Legg deg» ──────────── BYKARTET
                                   │  ▲
              trykk på sted ───────┘  └─── «← Byen»
                    │
     ┌──────────┬───┴──────┬───────────┬──────────┐
  Butikken   Hjemme   Byggeplass   Avtalested   Torget
     │
  Oppgave (over stedet, lukkes etter svar)
```

Ark fra toppfeltet: kurven, dagens plan, pause. Byplanen åpnes fra kartet.

## Regler

- Maks ett sted fra kartet, pluss ett ark over. Aldri flere nivåer.
- Ark har lukkeknapp, bortsett fra oppgaven, som lukkes av svaret.
- Barnet er inne til det trykker «← Byen» eller «Gå til …». Kjøp, svar, bygg og avtaler skjer inne. Scenen lukkes ikke av seg selv.
- Gåing vises alltid på kartet. Knappen nederst er en snarvei til samme tur.
- Ett gult trykk om gangen. Knappen og hjelperen kommer fra samme neste steg. Hjelperen sier hvorfor, ikke en annen ordre.
- «Sett på [del]» er gul bare når neste steg er å bygge. Ellers viser scenen delen, og den gule knappen er turen som haster.
- Den gamle byskjermen, den gamle byggeskjermen og det frie tårnuret er ikke en del av denne veien.
- **Scroll heller enn klipp.** Hver skjerm har tre soner: fast topp, en midtsone og fast bunn. Midten skaleres med `clamp()` og containerenheter, og hvis innholdet likevel er for langt, scroller midtsonen med en synlig skygge øverst og nederst. Knappen ut står alltid i bunnsonen. `overflow: hidden` er bare lov på dekor, og ingenting skjules med `display: none` fordi skjermen er lav. Dagsplanen lukkes med «Lukk» i bunnen, og den kan ikke åpnes mens en oppgave pågår. Hjelperen er skjult mens en oppgave eller en feilmelding vises.
- I oppgaver står «Ferdig», «Tøm», sorteringskassene og knappen på forklaringskortet («Prøv igjen» / «Fortsett») i bunnsonen. Tekst i svarknapper brytes, den klippes aldri.
- Kartet viser alltid hele byen, med butikk, torg, tårn, pyntebu og alle avtalesteder. Hvert sted har en trykkflate på minst 44 × 44 px, og navneskiltet kan også trykkes.
- Ett bygg om dagen. Når det er ferdig, kan barnet selv velge å begynne på det neste. «Ja, gå til butikken» er gul. «Nei, ikke i dag» er nøytral. Hjelperen sier navnet på bygget.
- Innstillinger har figur, kjæledyr og knappen «Åpne voksensiden». Nivå, språk og lyd ligger bak låsen.
- Låsen viser «For voksne. Løs regnestykket for å åpne.» Feil svar gir «Feil svar. Prøv dette:» og et nytt regnestykke. Låsen lukkes når den voksne går ut, og etter fem minutter uten aktivitet.
- Voksensiden har «← Tilbake til spillet» øverst, som går dit den voksne kom fra. Seksjonene er et trekkspill, og bare én er åpen: Oversikt (to linjer i klartekst), Mestring i detalj (Ikke øvd, Øver eller Sikker med «8 av 10», og kompetansemålene), Nivå og språk, Faste avtaler (alle ukedager, halvtimer 12–20), Ta vare på byen og Om appen.
- «Sikker» betyr minst 8 av de 10 siste svarene riktige, over minst to dager. Ferdigheter spillet ikke øver på, vises ikke.
- «Hent by fra fil» viser hva fila inneholder og må bekreftes med «Erstatt». En fil uten versjon eller by endrer ikke byen. «Start på nytt» har to steg: «Dette sletter hele byen på denne telefonen.» med «Avbryt» og «Slett byen».
- Klokkeleken åpnes med ett trykk når det er minst 30 minutter igjen og ingenting annet å gjøre, fra tårnet på kartet eller fra menyen når byen er ferdig. Tidene kommer fra morgendagens plan, som lages når dagen starter, og hver setning gir mening («I morgen henter vi lillesøster klokka tre.»). Klokka er minst 160 px, viseren kan dras, og på utfordrende finnes ±5 og ±30 minutter. «Riktig!» og «Prøv igjen» vises i 1,5 sekunder. Bare én runde om dagen gir mynter. Uten aktiv dag går «Ferdig» og «Tilbake» til menyen.
- Ved butikken sier hjelperen «Les skiltet på døra.» Skiltet er et bilde med åpningstidene, pausen og en stor klokke som viser nå. Scenen sier ikke om butikken er åpen før skiltet er lest. Er den stengt, spør spillet «Når åpner butikken?» og ber barnet vente til den åpner. Barnet sendes ikke til en stengt butikk bare for å øve. Hjemmefra kan det lese tidene på kortet «Les åpningstidene før du går».
- Ett butikkbesøk er en runde: 3 oppgaver i 1. klasse, 4 i 2. klasse og 5 på utfordrende. Prikker viser hvor langt runden er kommet. Bare den første oppgaven gir delen. De andre gir en mynt når svaret er riktig på første forsøk. «Gå ut» beholder delene som allerede er kjøpt. To feil på rad avslutter resten av runden.
- Dagen slutter med «Legg deg» hjemme. «Snart leggetid» vises bare det siste halvtimet. Før det kan barnet øve i klokkeleken.
- Når slottet er ferdig, sier forsiden «Byen er ferdig!» og tilbyr spill, pynt, klokkeleken, dagboka og innstillinger. Ny by ligger bak voksenlåsen og må bekreftes.
- Kvelden viser 0, 1 eller 2 stjerner: én for å rekke alle avtaler, og én for at minst 80 prosent av svarene var riktige på første forsøk. Et frivillig oppdrag på kartet kan gi en tredje stjerne. Hjelperen ber aldri om oppdraget.
- Fotoalbumet har et kort for hver form, og pynten som er satt ut. Ukjente former er bare en skygge. På fredag, når minst fem dager den uka har en stjerne, står det «Fredagsfest på torget.»
- Pyntebuen er et hus med navneskilt på kartet når brønnen er ferdig. Pynten koster 2–5 mynter. Barnet velger en ting og setter den på en ledig rute, aldri oppå et bygg. Har barnet for få mynter, står det for eksempel «Du har 3 mynter. Benken koster 5.»
- Klokketårnet på kartet viser feil tid. Tårnuret sammenligner med armbåndsuret og nevner morgendagens avtale. Kvelden kan sortere dagens hendelser. «God natt» er alltid synlig.

## Tekst i butikken

- Når oppgaven handler om delen, sier teksten det: «Døra er et rektangel. Tegn et rektangel.» eller «Sylinderen ligger i hylla med sylindere. Finn alle sylindrene.» Minst halvparten av formoppgavene i butikken handler om delen.
- Når oppgaven handler om noe annet (klokke, mønster, sortering eller en romform som læres), står en liten grå linje øverst: «Løs oppgaven for å få sylinderen.» Oppgaven er overskriften. «Vi trenger …» står aldri foran en oppgave om noe annet.
- Forklaringer som «Kule = rund som en ball» er en liten hjelpelinje, ikke en del av oppgaven.
- Måling, kart og kalender kommer som en øvingsoppgave i runden: ukeplan og kalender i 1. klasse, lengde og masse fra 2. klasse, areal, koordinater og likevekt på utfordrende. Skålvekta har sekken på den ene siden og lodd på den andre, med kilo som tekst under bildet. Planken måles i klosser eller med en linjal i centimeter. Ukeplanen viser hvilken dag avtalen er.
- Klokkeslett i ord har alltid «klokka» foran. Deler og bygg bøyes: «et rødt tak», «jord», «3 planker», «Vanntårnet». Rå id-er vises aldri.

## Skjermtest

`npm run test:skjerm` går gjennom alle skjermer og alle oppgavemaler, med forklaringskortet etter ett og to feil, i Chromium og WebKit med mobilprofilene iPhone 13, iPhone 8, iPhone SE (320 × 568) og liggende iPhone 13 (844 × 390). Testen feiler hvis noe er klippet, ligger utenfor skjermen, er dekket, er mindre enn 44 px, eller hvis skjermen mangler en vei ut. Skjermbildene lastes opp som artefakter i CI. Kjør `npx playwright install chromium webkit` hvis nettleserne mangler lokalt.
