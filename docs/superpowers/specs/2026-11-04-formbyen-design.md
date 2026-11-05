# Formbyen – spilldesign og krav

Nov 4, 2026 · @Reidar Kind

## Sammendrag og visjon

Formbyen (arbeidstittel) er et byggespill for 1.–2. trinn der barnet tjener materialer ved å svare på oppgaver om former og klokka, og bygger en hel by, fra én rønne til en kongeby med slott. Spillet dekker målene om geometriske figurer og analog og digital klokke i den nye læreplanen MAT01-06, som gjelder fra 1. august 2026.

Kjerneideen er at klokka ikke er en egen oppgavetype, men selve rammen for spilldagen. Butikken har åpningstider, barnet må hjem til middag og rekke korpsøvelsen. Formene er byggeklossene: trekanttak, runde vinduer, et vanntårn formet som en sylinder, et kirkespir formet som en kjegle.

Tre prinsipper styrer designet:

- **Læring er verktøyet, ikke straffen.** Riktige svar gir materialer; feil svar gir en forklaring og et nytt forsøk, aldri tap av det som er bygget.
- **Tid i spillet går bare når barnet handler.** Ingen nedtelling i sanntid, så ingen stress for de som leser sakte.
- **Samme familie som Bananmatte og StoreAlfabet.** PWA, ingen konto, alt lagret på telefonen, mild tone, og fullt spillbart uten lyd.

Navnet er et forslag; alternativer er «Klokkebyen», «Byggeklokka» og «Rønne til slott».

## Læreplanen: hva spillet skal dekke

Fra høsten 2026 gjelder [MAT01-06](https://data.udir.no/kl06/v201906/laereplaner-lk20/MAT01-06.pdf?lang=nob), som erstatter MAT01-05 fra 2020. Endringen er viktig for spillet: målet etter 2. trinn nevner nå uttrykkelig «kalender og analog og digital klokke», der det før bare sto «klokke og kalender». Planen har ingen egne mål etter 1. trinn; 1. klasse jobber mot målene etter 2. trinn. Penger har ingen mål før 5. trinn.

Tabellen viser målene spillet kan bygge på, og hvordan.

| Trinn | Kompetansemål (MAT01-06, forkortet) | Slik dekker spillet det | Nivå i spillet |
| --- | --- | --- | --- |
| 2. | Beskrive tid ved hjelp av kalender og analog og digital klokke | Spilldagen, åpningstider, avtaler, visere å stille, ukeplan | 1. og 2. klasse |
| 2. | Utforske, tegne og beskrive geometriske figurer fra nærmiljøet, sortere dem etter egenskaper | Former i hus, butikk og nabolag; sorteringsoppgaver; tegne former med fingeren | 1. og 2. klasse |
| 2. | Måle lengde og masse med ikke-standardiserte og standardiserte enheter | Måle planker i klosser og cm; veie sekker på vekta i butikken | 2. klasse |
| 2. | Kjenne igjen repeterende enheter i mønstre og lage egne | Fasademønstre, gjerder, flislegging som fortsetter et mønster | 1. og 2. klasse |
| 2. | Lage og følge regler og trinnvise instruksjoner i lek og spill | Byggeoppskrifter steg for steg | 1. og 2. klasse |
| 2. | Gruppere mengder etter egenskaper | Sortere varer i butikkhyllene | 1. klasse |
| 3. | Måle arealer med ikke-standardiserte og standardiserte enheter | Telle ruter på tomter og gulv; finne en tomt med nok plass | Utfordrende |
| 3. | Navngi og plassere punkter i koordinatsystemet | Bykart med rutenett: «bygg brønnen på C3» | Utfordrende |
| 3. | Bruke tegning og konkreter for å utforske likevekt | Skålvekt i butikken | Utfordrende |
| 4. | Beskrive egenskaper ved 2D- og 3D-figurer med vinkler, kanter, hjørner og flater | Telle hjørner, kanter og flater på byggeklosser; rette vinkler | Utfordrende |
| 4. | Måle volum med ikke-standardiserte enheter | Hvor mange kuber fyller tårnet | Utfordrende (valgfritt) |

Kjerneelementene *representasjon og kommunikasjon* og *modellering og anvendelser* er spillets ryggrad: barnet veksler mellom analog visertavle, digitale tall og ord («halv tre»), og bruker klokka til å planlegge en ekte ettermiddag.

## Eksisterende apper og hullene i læreplanen

Bananmatte dekker tall og regning godt, men geometri, måling, mønster og analog klokke mangler helt. StoreAlfabet er norskfaglig. Det nye spillet bør derfor ta hele «ikke-tall»-delen av matematikken på småtrinnet.

**[Bananmatte](https://reidarkind.github.io/bananmatte/)** har 33 oppgavemoduser i tre bånd (1. klasse, 2. klasse, utfordring): tallvenner, addisjon, subtraksjon, partall/oddetall, sammenligning, likhetstegn, plassverdi, hoppetelling, dobling/halvering, avrunding og litt multiplikasjon og divisjon. Klokke finnes bare som digitale hele og halve timer (HH:00/HH:30). Grafikken er prosedyrisk Canvas 2D, lyden er syntetiske toner, og den har 8 språk.

**[StoreAlfabet](https://reidarkind.github.io/storealfabet/)** har bokstavlyd, rim, stavelser, ordbygging og bokstavtegning med fingeren (dekningsmåling mot en «spøkelsesbokstav»). Den har opplest tekst med offline Piper-stemme, SVG-figurer i bildebokstil, pseudo-3D-vei og fire nivåer.

| Område i læreplanen | Bananmatte | StoreAlfabet | Nytt spill |
| --- | --- | --- | --- |
| Tall, regning, posisjonssystem | Ja, bredt | Nei | Bare som støtte (telle materialer) |
| Likhetstegn og likevekt | Likhetstegn | Nei | Skålvekt (utfordrende) |
| Digital klokke | Hele og halve timer | Nei | Ja, til 5-minutter og 24-timers |
| Analog klokke | Nei | Nei | **Ja, hovedtema** |
| Kalender (ukedager, måneder) | Nei | Nei | **Ja** |
| 2D-figurer, sortering | Nei | Nei | **Ja, hovedtema** |
| 3D-figurer, kanter/hjørner/flater | Nei | Nei | **Ja** (utfordrende) |
| Mønster | Hoppetelling | Nei | **Ja** |
| Måling: lengde og masse | Nei | Nei | **Ja** |
| Areal | Nei | Nei | **Ja** (utfordrende) |
| Koordinatsystem | Nei | Nei | **Ja** (utfordrende) |
| Trinnvise instruksjoner | Nei | Nei | **Ja**, byggeoppskrifter |

Gjenbruk fra de eksisterende appene sparer mye arbeid: talemodulen og Piper-stemmen fra StoreAlfabet, fingertegning med dekningsmåling (nå for former), lagring med typevakter, oppdateringsflyten og Vitest-oppsettet. Ren logikk med injiserbar `tilfeldig` og norske navn følger samme mønster som i de eksisterende appene.

Statistikk har ingen kompetansemål før 5. trinn i MAT01-06, så det trenger ikke dekkes her.

## Spillopplevelsen

En spilløkt er én ettermiddag, fra skolen slutter til leggetid, og tar 8–15 minutter i virkeligheten. Barnet handler i byggevarebutikken, bygger på tomta og må passe tiden mot faste avtaler.

### Figuren og byen

Barnet styrer en byggmester (velg mellom 3–4 figurer, alle uten kjønnsmarkering i tekst) med et kjæledyr som følger. Kjæledyret er guiden som viser oppgavene med snakkebobler, piler og små animasjoner. Fra start finnes tre steder: **Hjemme**, **Byggebutikken** og **Torget** med tårnuret. Resten av byen bygger barnet selv, og nye bygg som idrettshallen, korpslokalet og musikkskolen gjør nye aktiviteter mulige.

### Spilldagen

Økta starter med dagens plan, vist som en tidslinje med små klokker. Planen er ny hver dag (se Variasjon); dette er ett eksempel:

- Skolen slutter 13:30 (analog og digital)
- Byggebutikken er åpen 14:00–17:00
- Middag hjemme 16:30
- Én avtale som varierer: fotballtrening 18:00, korpsøvelse 18:15, kor 17:45 eller celloøving 30 minutter før leggetid
- Leggetid 20:00

Klokka i spillet går bare når barnet gjør noe: å gå til butikken tar 15 minutter, en handlerunde 30 minutter, å bygge en del 15 minutter. Rammet om tid er alltid i hele, halve eller kvarte timer på lavt nivå, og i 5-minutter på utfordrende. Tårnuret på torget og et armbåndsur i hjørnet viser alltid tiden, analogt og digitalt (digitalt kan skjules på høyere nivå).

### Kjerneløkka

1. **Planlegg.** Se dagens plan. Spørsmål: «Når stenger butikken?», «Rekker du å bygge før middag?»
2. **Gå til butikken.** Ved døra: les åpningstidene og svar på om butikken er åpen nå.
3. **Handle.** Ekspeditøren gir 3–5 oppgaver om former (og på høyere nivå måling og vekt). Riktig svar gir materialer i kurven; hver oppgave er knyttet til varen, for eksempel «Finn vinduet som er en sirkel».
4. **Bygg i byen.** Velg en tomt på bykartet og bygg etter oppskrift, eller pynt og bygg fritt på hjemmet.
5. **Pass tiden.** Når en avtale nærmer seg, banker kjæledyret på klokka: «Korpsøvelsen er kvart over seks. Hvor lang tid har du igjen?» Barnet velger å bygge litt til eller gå.
6. **Dagen slutter.** Kveldslyset kommer, byen vises i solnedgang, og dagens oppsummering viser hva som er bygget og hvilke former og klokkeslett barnet har mestret.

### Konsekvenser uten straff

Kommer barnet for sent til middag, sier en forelder vennlig «Vi spiste klokka halv fem, nå er den fem», og dagen fortsetter. Er butikken stengt, står det «Åpner i morgen kl. 14» på døra, og barnet bygger med det det har. Ingenting som er bygget, kan forsvinne. Rekker barnet alle avtaler, gir det en bonus: en stjerne i dagboka og et ekstra pyntemateriale.

### Butikken

Butikken har fire hyller som speiler læringsinnholdet: **Formhylla** (vinduer, dører, takplater), **Klosshylla** (3D-klosser: kube, sylinder, kjegle, pyramide, prisme), **Planker og mål** (lengde) og **Sekker og vekt** (masse: sement, sand, grus, maling, fliselim, spiker, hagejord). Valutaen er byggemynter med små tall, fordi penger ikke er et mål på dette trinnet; det holder at barnet teller mynter til 10–20.

### Torget og avtalestedene

På torget står tårnuret der barnet kan stille viserne selv i en frilek-modus. Treningsfeltet, korpslokalet og musikkskolen er korte mellomspill (30–60 sekunder) der barnet møter opp og får se en liten animasjon, pluss en klokkeoppgave: «Øvelsen varer i en time. Når er den ferdig?» De gir ingen materialer, men stjerner i dagboka.

## Variasjon: ingen dag og ingen oppgave er lik

Dagsplaner, ukeplaner og oppgaver lages av generatorer med mange byggeklosser, og spillet husker hva barnet nylig har sett. Samme dag eller samme formulering skal ikke komme igjen på lenge.

### Dagsplan og ukeplan

| Byggekloss | Variasjon |
| --- | --- |
| Ukedag | Mandag–fredag med skole; lørdag og søndag uten skole, med andre åpningstider og stengt butikk på søndag |
| Skoleslutt | 12:00, 12:30, 13:30, 14:00, 14:15 (bare tider nivået tillater) |
| Siste skoletime | Norsk, matematikk, kroppsøving, musikk, naturfag, KRLE, kunst og håndverk, engelsk, svømming |
| SFO/AKS | Noen dager henting 15:30 eller 16:00 |
| Butikkens åpningstider | Ulike per ukedag; kortere på lørdag; av og til «stengt for varetelling» en halvtime |
| Fritidsaktiviteter | Fotball, håndball, svømming, turn, dans, ski og skøyter om vinteren, korps, kor, cello, piano, fiolin, speider, sjakk, bibliotek |
| Hjemmeavtaler | Middag 16:00–17:30, leksetid, tannlege, besøk hos besteforeldre, bursdagsselskap, hente lillesøster, lufte hunden |
| Hendelser | Varelevering kl. 15, tilbud på sirkelvinduer i en halvtime, regnbyge (bygg innendørs), naboen trenger hjelp, tårnuret har stoppet og må stilles |
| Leggetid | 19:30–20:30 |
| Årstid og kalender | Mørkt tidlig om vinteren, 17. mai, juleferie, sommerferie, bursdager i dagboka |

Regler for generatoren:

- 2–4 avtaler per dag, aldri overlappende, og minst ett reelt valg («rekker jeg én del til før svømming?»).
- Ukeplanen har en fast rytme per spiller (korps alltid tirsdag), så ukeplanoppgaver gir mening, men med små avvik: ekstraøvelse, avlyst trening, byttet dag.
- Ingen dagsplan er lik noen av de siste 7.

### Spørsmål som varierer

- **Minst 6 maler per oppgavetype** ved lansering. For «halv tre» kan det være: still klokka; «butikken åpner halv tre, vis det»; hvilken klokke viser 14:30; «klokka er 14:00, hva er den om en halvtime»; er påstanden riktig; hvilken klokke er feil.
- **Bytt retning:** analog til digital, digital til ord, ord til analog; form til navn, navn til form, egenskap til form.
- **Bytt hvem som spør:** ekspeditøren, naboen, treneren, skiltet på døra, en lapp på kjøleskapet.
- **Bytt format:** velg av 3, dra viserne, sorter, ja/nei, finn feilen, tell, tegn.
- **Bytt sammenheng for formene:** vinduer, trafikkskilt, kaker i bakeriet, ballonger, fliser, hjul.
- **Gode feilalternativer** fra typiske misforståelser: byttede visere, «halv tre» lest som 3:30, trekant med spissen ned, kvadrat som står på hjørnet.
- **Spesialoppgaver:** rundt 1 av 8 oppgaver er en overraskelse, for eksempel å finne feilen på tårnuret.
- **Anti-gjentakelse:** samme mal kommer ikke igjen innenfor 10 oppgaver, og samme klokkeslett eller form aldri to ganger på rad.

Krav til tester: 100 genererte dager skal gi minst 90 ulike planer, og hver oppgavetype skal ha minst 6 maler.

## Læringsinnhold og nivåer

Spillet har samme nivåer som Bananmatte og StoreAlfabet: **1. klasse**, **2. klasse**, **Utfordrende** (3.–4. trinn) og **Blandet**. I tillegg justerer spillet seg innenfor nivået: tre riktige på rad på en ferdighet gir neste trinn, to feil på rad gir ett trinn ned.

### Klokka

| Ferdighet | 1. klasse | 2. klasse | Utfordrende |
| --- | --- | --- | --- |
| Hele timer, analog og digital | Ja | Ja | Ja |
| Halv («halv tre» = 2:30) | Mot slutten | Ja | Ja |
| Kvart over og kvart på | Nei | Ja | Ja |
| 5-minutter («ti over», «fem på halv») | Nei | Mot slutten | Ja |
| Digital 24-timers (14:30 = halv tre) | Nei | Lesing | Lesing og skriving |
| Tidsrom («hvor lenge til?») | Hele timer | Halve og hele timer | Kvarter og 5-minutter |
| Morgen, formiddag, ettermiddag, kveld | Ja | Ja | Ja |
| Ukedager og rekkefølge | Ja | Ja | Ja |
| Måneder, dato, årstider | Nei | Ja | Ja, med kalenderoppslag |

**«Halv tre»-fella må ha egne oppgaver.** På norsk betyr «halv tre» 2:30, ikke 3:30. Spillet skal vise viserne, sifrene og ordet side om side, og forklare med «halvveis til tre» når barnet bommer. Det samme gjelder «fem på halv» og «fem over halv».

Oppgavetyper for klokka:

- **Still klokka:** dra viserne til et oppgitt tidspunkt (minuttviseren hopper til 5-minutter; timeviseren følger med riktig, ikke bare på heltall).
- **Les klokka:** velg riktig tidspunkt av 3 alternativer, i ord eller digitalt.
- **Koble:** par en analog klokke med riktig digital klokke.
- **Rekker jeg det?** Ja/nei med visning av tidslinje som forklaring.
- **Hvor lenge?** Tell timer og halvtimer på en tidslinje eller på urskiven.
- **Åpningstider:** «Er butikken åpen nå?» ut fra skiltet på døra.
- **Ukeplan (2. klasse+):** «Hvilken dag er korpsøvelsen?» i dagboka.

### Formene

| Ferdighet | 1. klasse | 2. klasse | Utfordrende |
| --- | --- | --- | --- |
| Sirkel, trekant, kvadrat, rektangel | Ja | Ja | Ja |
| Femkant, sekskant, halvsirkel, oval | Nei | Ja | Ja |
| Kjenne igjen former i hus og nabolag | Ja | Ja | Ja |
| Sortere etter egenskap (sider, hjørner, rund/ikke rund) | Én egenskap | To egenskaper | Barnet velger regelen selv |
| Telle sider og hjørner | Til 4 | Til 6 | Ja |
| 3D-navn: kule, kube, sylinder, kjegle, pyramide, prisme | Kule og kube | Alle | Alle |
| Kanter, hjørner og flater på 3D-figurer | Nei | Flater | Alle tre |
| Rette vinkler | Nei | Nei | Ja |
| Hvilke 2D-former er sidene på en 3D-figur | Nei | Ja | Ja |
| Mønster: fortsett og lag eget | Gjenta AB | AAB, ABC | Voksende mønstre |
| Tegn formen med fingeren | Sirkel, trekant, kvadrat | Alle 2D | Alle 2D |

Oppgavetyper for former:

- **Finn formen:** trykk på alle sirkler i bildet av en husfasade eller butikkhylle.
- **Hvem passer ikke inn?** Én av fire bryter regelen; barnet sier hvorfor (velg begrunnelse).
- **Sorter i kasser:** dra varer til kassen «har 3 hjørner» eller «er rund».
- **Tegn formen:** fingertegning med dekningsmåling fra StoreAlfabet, tilpasset former.
- **Tell:** sider, hjørner, kanter eller flater, med mulighet for å trykke på hver og se den lyse opp.
- **Fortsett mønsteret:** på gjerdet, flisene eller vinduskarmene.
- **Fra 3D til 2D:** «Hvilken form får du hvis du stempler med sylinderen?»

### Måling, areal og koordinater

- **Lengde (2. klasse):** mål planker i klosser først, så i centimeter med linjal. «Hvor mange klosser lang er planken?»
- **Masse (2. klasse):** sammenlign tyngre/lettere, så kilo på butikkvekta. Varene er byggematerialer: sementsekker, sandsekker, malingsspann, bøtter med fliselim, pakker med spiker og sekker med hagejord. Byggeoppskriftene oppgir mengde («Muren trenger 6 kg sement», «Taket trenger 2 spann rød maling»), og barnet må veie opp riktig mengde. Først med ikke-standardiserte enheter («Hvor mange spikerpakker veier like mye som ett malingsspann?»), så i hele kilo. Hver vare har en fast, synlig vekt i hele kilo (1–10 kg), slik at tallene passer for 2. trinn.
- **Areal (utfordrende):** tell ruter på tomter og gulv; «Hvilken tomt er stor nok til bakeriet?»
- **Koordinater (utfordrende):** bykartet og byggeplassene har rutenett med bokstaver og tall; oppgaver sier «bygg brønnen på C4» eller «sett døra på B1».
- **Likevekt (utfordrende):** skålvekta skal balansere; hvor mange småsekker veier like mye som en stor.

### Forklaringer og tilbakemelding

Hver oppgavetype har en forklaringsfunksjon som i Bananmatte. Feil svar gir alltid en visuell forklaring, ikke bare riktig svar: viserne animeres fra barnets svar til det riktige, hjørnene på formen telles opp med lys og tall. Etter forklaringen kommer en lik oppgave, så barnet får lykkes med det samme.

## Byen og byggingen

Barnet bygger en hel by i en dal. Byen starter som én rønne og vokser gjennom seks bynivåer til en kongeby med slott. Barnets eget hjem vokser underveis, og hvert nytt bygg i byen krever nye former.

### Bynivåer

| Nivå | By | Hjemmet | Nye bygg i byen | Nye former | Krav for neste nivå |
| --- | --- | --- | --- | --- | --- |
| 1 | Grend | Rønne | Brønn, gjerde, vedskjul | Kvadrat, trekant, rektangel, sirkel | 3 bygg ferdige |
| 2 | Landsby | Hytte | Bakeri, lekeplass, bro over bekken | Halvsirkel; mønster i gjerder og fliser | 6 bygg, 1 mønster fullført |
| 3 | Tettsted | Hus | Skole, idrettshall, korpslokale | Femkant, sekskant | 10 bygg, 3 klokkeoppgaver riktig på rad |
| 4 | By | Villa | Musikkskole, bibliotek, togstasjon med klokke | Kube, sylinder, kule | 15 bygg, 4 3D-former kjent igjen |
| 5 | Borgby | Borg | Kirke med spir, vanntårn, fyrtårn ved havna, ringmur | Kjegle, pyramide | 21 bygg, 5 dager med alle avtaler rukket |
| 6 | Kongeby | Slott | Park med fontene, festplass, nytt klokketårn på torget | Prisme; alle former samlet | Sluttmål: slottsball |

Tallene er startverdier som justeres etter testing med barn. Hele reisen fra grend til kongeby er rundt 30 økter.

### Bygg som åpner nye aktiviteter

Flere bygg gjør nye avtaler mulige, så dagsplanen blir rikere etter hvert som byen vokser:

- **Idrettshallen** gir fotball, håndball og turn.
- **Korpslokalet** gir korpsøvelse.
- **Musikkskolen** gir kor, cello og piano.
- **Biblioteket** gir bibliotekdag med utlånstid.
- **Togstasjonen** gir besøk hos besteforeldre, med rutetabell som nye klokkeoppgaver.

### Bykartet

- Byen ligger på et rutenett med bokstaver og tall, som utvides når nye områder åpner: dalen, bekken, åsen og havna.
- Hver tomt har en størrelse i ruter, og et bygg trenger en tomt med nok areal. På utfordrende nivå: «Bakeriet trenger 6 ruter. Hvilke tomter passer?»
- På utfordrende nivå oppgis plassering med koordinater: «Bygg brønnen på C4».
- Veier og stier legges mellom byggene, og innbyggere flytter inn når et bygg er ferdig.

### Slik bygger man

- Velg en tomt på bykartet, så åpnes byggeplassen for det bygget.
- På byggeplassen snapper delene til et rutenett i isometrisk 2,5D, så små fingre ikke trenger presisjon.
- Hvert bygg har en byggeoppskrift i 3–8 steg, som dekker målet om trinnvise instruksjoner. Hjemmet og pynt kan også bygges fritt.
- Et bygg kan stå halvferdig over flere dager, med stillas til det er ferdig.
- Angre og flytte er alltid mulig; delene går tilbake i kurven. Ingenting som er bygget, forsvinner.
- Når hjemmet oppgraderes, blir det gamle med: rønna blir uthus til hytta, og så videre.
- **Pynt** (blomster, flagg, benker, lykter, julebelysning i desember) koster få mynter og gir eierskap uten læringskrav.

### Se på byen

- Panorer, zoom og snu bykartet 90°.
- **Byen lever etter klokka:** innbyggerne går til trening og korps til avtalt tid, butikker stenger, gatelys tennes kl. 18 og vinduslys slukkes ved leggetid. Barnet kan lese tiden av det som skjer i byen.
- Tårnuret på torget og klokka på togstasjonen viser alltid tiden.
- **Fotoalbum:** et bilde av byen ved hvert nytt bynivå, lagret lokalt og mulig å dele som PNG.
- Utvalgte bygg (hjemmet, bakeriet, slottet) kan åpnes i snitt, der formene i rommet er ekstra tydelige.

## Grafikk, lyd og universell utforming

Grafikken skal se ut som en varm bildebok, i samme familie som StoreAlfabet, men med mer dybde: isometrisk 2,5D for bykartet og byggeplassene, flate SVG-illustrasjoner for butikk og oppgaveskjermer.

### Grafikk

Alle mål, farger, komponenter og akseptkrav står i seksjonen Grafikkspesifikasjon nedenfor.

### Lyd: valgfri, aldri nødvendig

- **Spillet skal kunne spilles helt uten lyd og uten stemme.** Lyden starter av, og all informasjon finnes visuelt.
- **Ingen opplesning i første versjon.** Oppgavene forklares med bilder, faste ikoner per oppgavetype (still klokka, sorter, tell, tegn) og en kort demo første gang en type dukker opp, for eksempel en hånd som drar viseren.
- Tekst er kort og står alltid med bilde eller klokke ved siden av. Klokkeslett skrives på norsk vis («halv tre», «kvart på fem»), og `tidTilOrd` testes for alle 5-minutter i døgnet.
- Lydeffekter er bare pynt: hammerslag, kassaapparat, tårnuret. Alt de signaliserer vises også visuelt; tårnurets slag vises som lysblink man kan telle.
- Appen har ingen opplesning, og ingen oppgave er avhengig av lyd.
- Ingen bakgrunnsmusikk som standard.

### Universell utforming

- **Farge alene bærer aldri informasjon.** Former skilles på form, viserne på lengde. Test med fargeblindsimulering.
- **Lesing kreves ikke** på 1. klasse: oppgavetypen vises med faste ikoner og en kort demo, og alle svaralternativer er bilder, klokker eller tall.
- **Store trykkflater** (minst 48 px) og drag som også kan gjøres med trykk-trykk (velg del, velg rute).
- **Ingen tidspress i sanntid.** Spilltiden er turbasert.
- **Mild tone:** ingen «feil!»-lyd med straff, ingen tap av byggverk, ingen rangering mot andre barn som standard (rekordliste kan slås på).
- **Språk:** bokmål først; nynorsk som valg er naturlig siden læreplanen er fastsatt på nynorsk. Klokkeuttrykkene er like på begge.

## Grafikkspesifikasjon

All grafikk lages som parametriske SVG-komponenter i kode, etter faste regler som kan måles og testes. Ingen grafikk tegnes fritt som enkeltbilder. Reglene ligger i `STIL.md` i repoet, og fargene og målene i `src/grafikk/stil.ts`, slik at AI og mennesker leser samme kilde hver gang.

### Prinsipper

- **Byggesett, ikke illustrasjoner.** Hvert bygg settes sammen av komponenter (vegg, tak, vindu, dør, tårn). En ny bygning er en ny sammensetning, ikke en ny tegning.
- **Geometrien er fasit.** Et kvadratisk vindu er et `<rect>` med like sider; en sylinder er en ellipse og et rektangel. Den samme formdefinisjonen brukes til tegning og til oppgavenes fasit.
- **Flat bildebokstil:** flate fargefelt, en tydelig kontur, to toner per flate (lys og skygge). Ingen gradienter, ingen uskarpe skygger, ingen teksturer.
- **Én referanse per kategori** godkjennes først: rønna (bygg), byggmesteren (figur), urskiven (klokke), still klokka-ikonet (ikon). Alt annet skal matche referansen.

### Palett

Kun disse fargene er lov. Hver flate har en lys tone (mot lyset) og en skyggetone (bort fra lyset).

| Rolle | Lys | Skygge | Brukes til |
| --- | --- | --- | --- |
| Kontur | #3B2F2A | – | Alle konturer, tekst, visere |
| Papir | #F7F0E3 | #EADFCB | UI-bakgrunn, kort, urskive |
| Gress | #8CC47A | #6FA862 | Bakke, parker |
| Vei og sti | #E6D3B3 | #D2BC96 | Veier, torg, tomter |
| Vann | #6BB7D6 | #4E9BBD | Bekk, havn, fontene |
| Tre (materiale) | #E8B27A | #CC9058 | Rønne, hytte, gjerder, planker |
| Mur | #D9CBB8 | #BCAB94 | Hus, villa, skole |
| Stein | #B7B2A8 | #98928A | Borg, slott, ringmur, bro |
| Tak rødt | #C8553D | #A8432F | Tak, spir |
| Tak blått | #4F7CAC | #3D6490 | Tak, spir |
| Glass dag | #CFE9F5 | #B0D6E8 | Vinduer om dagen |
| Vinduslys | #FFD66B | #F2BE3D | Vinduer fra kl. 18, lykter |
| Aksent gul | #F2C14E | #D9A62E | Former i oppgaver, flagg, markering |
| Aksent grønn | #3E8E5E | #2F7149 | Riktig svar (alltid med hake-ikon) |
| Aksent rav | #E0A43A | #C4882A | Prøv igjen (alltid med pil-ikon) |

Himmelen skifter i flate trinn etter spillklokka, aldri med gradient: dag #BFE3F2 (til 17:00), ettermiddag #F2D6A8 (17:00–18:00), kveld #F2B38A (18:00–19:00), skumring #8C6BA8 (19:00–20:00), natt #2F3A5F (fra 20:00). Fargekontrast mellom kontur og alle flater er minst 3:1.

### Mål og perspektiv

| Mål | Verdi |
| --- | --- |
| Perspektiv | Isometrisk 2:1 (dimetrisk), to synsvinkler; den andre er speilvendt |
| Rute på kartet | 64 × 32 px i basisskala |
| Etasjehøyde | 48 px |
| Kontur, bygg og figurer | 3 px |
| Kontur, detaljer (vinduskarm, takstein) | 2 px |
| Lys | Fra øvre venstre: venstre flater lys tone, høyre flater skyggetone, tak ett trinn lysere enn høyre vegg |
| Kastet skygge | Flat polygon mot nedre høyre, konturfarge med 20 % opasitet |
| Dør | 0,4 rute bred, 0,75 etasje høy |
| Vindu | 0,25–0,35 rute bredt |
| Figur (barn) | 0,8 etasje høy |
| Hjørneradius | 0 på alle geometriske former; 12 px på UI-kort, 999 px på runde knapper |
| Trykkflate | Minst 48 × 48 px |
| Skrift | Nunito (som StoreAlfabet); 800 for tall og titler, 600 for brødtekst, tabellsifre i digitale klokker |

Skala tilpasses skjermen med én faktor for hele scenen, så forholdene aldri endres.

### Klokka

- Urskive: sirkel med papirfarge, ramme 6 px i konturfarge.
- Tallene 1–12 i Nunito 800, plassert på 78 % av radius, alltid oppreist.
- 60 minuttstreker; hver femte er dobbelt så lang og tykk.
- Timeviser: 50 % av radius, 10 px bred. Minuttviser: 80 % av radius, 6 px bred. Begge i konturfarge, skilt på lengde og bredde, aldri på farge.
- Ingen sekundviser. Sentrumsknott 14 px.
- Timeviseren står alltid riktig mellom tallene (ved halv tre midt mellom 2 og 3).
- Digital klokke: «14:30» i Nunito 800 i en avrundet boks med papirfarge, samme bredde uansett klokkeslett.
- På kveld og natt får urskiven ikke kveldsfarge; den skal alltid være like lesbar.

### Komponentbibliotek

Hver komponent er en ren funksjon som tar parametere og returnerer SVG, med test for geometri og palett.

| Komponent | Parametere |
| --- | --- |
| `vegg` | bredde (ruter), etasjer, materiale |
| `tak` | type (saltak, pyramide, kjegle, flatt, kuppel), farge |
| `vindu` | form (kvadrat, rektangel, sirkel, halvsirkel, sekskant), dag/kveld |
| `dor` | form (rektangel, rektangel med halvsirkelbue), materiale |
| `taarn` | form (sylinder, kube, prisme), høyde, materiale |
| `spir` | form (kjegle, pyramide), farge |
| `mur` | lengde, med eller uten tinder |
| `trapp` | trinn, retning |
| `gjerde` | lengde, mønster (AB, AAB, ABC) |
| `fliser` | form (kvadrat, sekskant, trekant), mønster |
| `skorstein`, `bro`, `bue` | størrelse, materiale |
| Natur: `tre`, `busk`, `blomst` | variant 1–3, årstid |
| Pynt: `lykt`, `flagg`, `benk`, `fontene` | variant |

### Byggene

| Bygg | Sammensetning |
| --- | --- |
| Rønne | 1 × 1 vegg i tre, saltak, 1 rektangeldør, 1 kvadratvindu |
| Hytte | 2 × 1 vegg i tre, saltak, skorstein, sirkelvindu |
| Hus | 2 × 2 mur, 2 etasjer, saltak, 4 vinduer, trapp |
| Villa | 3 × 2 mur, 2 etasjer, veranda, halvsirkelbuer, hage |
| Borg | Steinmur med tinder, 4 sylindertårn med kjeglespir, port med bue |
| Slott | 4 × 3 stein, 3 etasjer, prismetårn, pyramidetak, festsal med kuppel |
| Brønn | Sylinder i stein, lite saltak |
| Bakeri | 2 × 1 mur, saltak, stort rektangelvindu, skilt med kringle-ikon |
| Bro | Steinbue (halvsirkel) over bekken |
| Skole | 3 × 2 mur, flatt tak, rad med kvadratvinduer, klokke over døra |
| Idrettshall | 3 × 2, flatt tak, høye rektangelvinduer |
| Korpslokale | 2 × 1 tre, saltak, sirkelvindu i gavlen |
| Musikkskole | 2 × 2 mur, sekskantvindu, halvsirkeldør |
| Bibliotek | 2 × 2 mur, søyler (sylindre), trekantgavl |
| Togstasjon | 3 × 1, saltak, stor urskive på fasaden |
| Kirke | 2 × 1 stein, høyt tårn med kjeglespir, buede vinduer |
| Vanntårn | Sylinder på søyler, kuppeltak |
| Fyrtårn | Høy sylinder, sirkelvindu, kjegletak, lys om kvelden |
| Klokketårn på torget | Kube på prisme, urskive på to sider, pyramidetak |

### Figurer

- Proporsjoner: hodet er en tredjedel av høyden, enkel kropp, votter i stedet for fingre.
- Ansikt: to prikkøyne, liten bue som munn, ingen nese. Uttrykk byttes bare via munnen (glad, overrasket).
- Byggmester i 4 varianter, kjæledyr i 3 (hund, katt, kanin), innbyggere satt sammen av parametere: hudtone (6), hår (6), klesfarge fra paletten.
- To retninger (ned-venstre, ned-høyre, speilvendt). Gange vises med en liten hopp-bevegelse og vippende ben via transform, ikke tegnede rammer.

### Ikoner for oppgavetyper

Siden spillet virker uten lyd, er ikonene barnets språk. Alle tegnes på et 24 × 24 rutenett med 2 px kontur og avrundede linjeender.

| Ikon | Motiv |
| --- | --- |
| Still klokka | Urskive med hånd som drar viseren |
| Les klokka | Urskive med øye |
| Koble | To klokker med strek mellom |
| Sorter | To kasser med pil |
| Tell | Finger over tre prikker |
| Tegn | Blyant over strek |
| Velg | Tre ruter, én markert |
| Finn feilen | Forstørrelsesglass |
| Ja/nei | Hake og kryss side om side |
| Mål | Linjal |
| Vei | Skålvekt |

### Ikke gjør

- Ingen gradienter, uskarpe skygger, glans, teksturer eller fotorealisme.
- Ingen farger utenfor paletten, og ingen svart #000.
- Ingen tekst inni grafikk; all tekst ligger i UI-laget.
- Ingen nesten-former: et kvadrat har like sider, rette vinkler og skarpe hjørner.
- Ingen trekanter som alltid står med spissen opp; generatoren roterer og varierer typen.
- Ingen figurer med fingre, tenner eller detaljerte øyne.
- Ingen kjente figurer eller merkevarer.

### Arbeidsflyt og akseptkrav

1. `STIL.md` og `src/grafikk/stil.ts` skrives før første komponent, og AGENTS.md peker til dem.
2. Referansene (rønne, byggmester, urskive, ett ikon) lages og godkjennes før alt annet.
3. En galleriside, `dev/galleri.html`, viser alle komponenter, bygg, figurer og ikoner i alle varianter, i dagslys og kveld, ved siden av referansene.
4. Hver ny eller endret komponent rendres i galleriet og sammenlignes med referansen som skjermbilde før den godtas.

Automatiske tester (Vitest):

- [ ] Alle `fill`- og `stroke`-verdier i generert SVG finnes i paletten.
- [ ] Konturbredder er 2 eller 3 px i basisskala.
- [ ] Geometriske former er presise: kvadrater har like sider og rette vinkler, regulære mangekanter har like sider.
- [ ] Klokka: timeviserens vinkel er riktig for alle 288 5-minutter.
- [ ] Ingen `linearGradient`, `radialGradient`, `filter` eller `<text>` i spillgrafikk.
- [ ] Visuelle regresjonstester (skjermbilder av galleriet) feiler ved utilsiktede endringer.

## Tekniske krav og personvern

Samme oppskrift som StoreAlfabet: Vite + TypeScript som PWA på GitHub Pages, ingen server, ingen konto.

### Plattform

- PWA med `vite-plugin-pwa`, `registerType: "prompt"`, `base` `/formbyen/`, fungerer helt offline etter første besøk.
- Mål: iPhone og iPad med Safari først (primær testplattform), deretter Android Chrome.
- Ytelse: 60 fps på bykartet med 25 bygg og 1 000 deler på en iPhone fra 2020; første lasting under 3 MB uten Piper-stemmen.

### Moduler

| Modul | Ansvar | Gjenbruk |
| --- | --- | --- |
| `tid/` | Spillklokke, tid til ord («halv tre»), tidsrom, åpningstider | Ny |
| `former/` | Formdefinisjoner med egenskaper (sider, hjørner, kanter, flater, rette vinkler) | Ny |
| `oppgaver/` | Generatorer per oppgavetype, bank, `sjekkSvar`, forklaringer | Mønster fra begge apper |
| `tilpasning/` | Mestring per ferdighet, opp og ned i vanskelighet | Ny |
| `bygg/` | Bykart, tomter, rutenett, plassering, krav per bynivå, oppskrifter | Ny |
| `tegning/` | Fingertegning med dekningsmåling | StoreAlfabet |
| `tale/` | Ikke med: appen har ingen tale | StoreAlfabet |
| `lagring/` | localStorage med versjon, typevakter og migrering | StoreAlfabet |
| `pwa/` | Oppdatering og vedvarende lagring | StoreAlfabet |

### Krav til logikk og testing

- All spillogikk er ren og testbar uten DOM, med injiserbar `tilfeldig`, slik som i Bananmatte og StoreAlfabet. Vitest.
- `tidTilOrd` testes for alle 288 5-minutter i døgnet, både 12- og 24-timers.
- Formdefinisjonene er én kilde: tegnefunksjon, oppgavegenerator og fasit leser samme egenskaper, så bildet og svaret aldri kan være uenige.
- Hver oppgavegenerator testes for at riktig svar alltid er blant alternativene, og at alternativene er ulike.

### Lagring og personvern

- Nøkkel `formbyen-v1` i localStorage: innstillinger, byen (bygg, tomter og deler med posisjon), mynter, mestring per ferdighet, dagbok og fotoalbum (små PNG-er; vurder IndexedDB hvis albumet blir stort).
- Ingen sporing, ingen analyse, ingen nettverkskall etter installasjon.
- **Eksport og import** av lagringen som fil, så et barn kan flytte byen til et nytt nettbrett.

### Voksensiden

En enkel side bak et regnestykke for voksne viser mestring per kompetansemål (bare lokalt), gir mulighet til å velge nivå, slå av tidsrom-oppgaver og velge hvilke avtaler barnet har (for eksempel ekte dager for korpsøvelsen). Ingen data forlater enheten.

## Leveranse: hele appen i én versjon

Appen leveres komplett, uten faser. Alt i dette dokumentet er med i første versjon:

- Alle fire nivåer (1. klasse, 2. klasse, utfordrende, blandet) med tilpasning innenfor nivået.
- Spilldag med turbasert klokke, varierte dags- og ukeplaner, avtaler, hendelser, årstider og høytider.
- Byggebutikken med alle fire hyller: former, 3D-klosser, planker og mål, sekker og vekt.
- Hele byen med seks bynivåer fra grend til kongeby, alle bygg, bykart med nye områder, byggeoppskrifter, pynt, en by som lever etter klokka, fotoalbum og innsyn i rom.
- Alle oppgavetyper for klokke, kalender, 2D- og 3D-former, mønster, lengde, masse, areal, koordinater og likevekt, med minst 6 maler per type og visuelle forklaringer.
- Fingertegning av former.
- Ikonstyrt brukerflate som virker helt uten lyd; ingen opplesning.
- Bokmål og nynorsk.
- Voksensiden, eksport og import av lagring, og full offline-støtte som PWA.

### Akseptkriterier

- [ ] Et barn i 1. klasse kan spille en hel økt med lyden av og uten å kunne lese.
- [ ] Klokka vises analogt og digitalt overalt der tid nevnes.
- [ ] Ingen oppgave kan ha et bilde som motsier fasit (formtester og klokketester grønne).
- [ ] Ingen dagsplan gjentas innenfor 7 dager, og ingen oppgavemal innenfor 10 oppgaver.
- [ ] Ingenting som er bygget kan gå tapt, heller ikke ved oppdatering av appen.
- [ ] Fungerer offline på iPhone etter første besøk.
- [ ] Testet med minst 3 barn i målgruppen, og justert tallene for bynivåene.

### Åpne spørsmål

- Skal avtalene kunne settes til barnets ekte uke (korps tirsdag 18:00), eller alltid være oppdiktet?
- Skal digital klokke vises som 14:30 (24-timers) eller 2:30 på 1. klasse? Forslag: 24-timers, fordi telefoner og skoletimeplaner viser det.
- Én by per enhet, eller flere byer (flere barn på samme nettbrett)?
- Skal en lærerveiledning med kobling til kompetansemålene ligge i appen eller på myapps-siden?

### Kilder

- [Læreplan i matematikk 1.–10. trinn, MAT01-06](https://data.udir.no/kl06/v201906/laereplaner-lk20/MAT01-06.pdf?lang=nob) (gjelder fra 1.8.2026)
- [Gyldighet og innføring, MAT01-06](https://www.udir.no/lk20/mat01-06/gyldighet-og-innfoering?lang=eng)
- [Utgått plan MAT01-05](https://data.udir.no/kl06/v201906/laereplaner-lk20/MAT01-05.pdf)
- [Utdanningsnytt: Regning får større plass fra høsten 2026](https://www.utdanningsnytt.no/laereplaner-matematikk/regning-far-storre-plass-i-matematikkfaget-fra-hosten-av/489901)
- [Reidar Kinds hobbyapper](https://reidarkind.github.io/myapps/), kildekoden til [Bananmatte](https://github.com/reidarkind/bananmatte) og [StoreAlfabet](https://github.com/reidarkind/storealfabet)
