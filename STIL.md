# STIL

Formbyen tegnes med én palett. Tallene under er de samme som i `src/grafikk/stil.ts`. Ikke legg til farger, gradienter eller SVG-tekst.

## Farger

| Navn | Hex |
| --- | --- |
| Kontur | `#3B2F2A` |
| Papir | `#F7F0E3` |
| Papirskygge | `#EADFCB` |
| Gress | `#8CC47A` |
| Gress skygge | `#6FA862` |
| Vei | `#E6D3B3` |
| Vei skygge | `#D2BC96` |
| Vann | `#6BB7D6` |
| Vann skygge | `#4E9BBD` |
| Tre | `#E8B27A` |
| Tre skygge | `#CC9058` |
| Mur | `#D9CBB8` |
| Mur skygge | `#BCAB94` |
| Stein | `#B7B2A8` |
| Stein skygge | `#98928A` |
| Tak rødt | `#C8553D` |
| Tak rødt skygge | `#A8432F` |
| Tak blått | `#4F7CAC` |
| Tak blått skygge | `#3D6490` |
| Glass | `#CFE9F5` |
| Glass skygge | `#B0D6E8` |
| Vinduslys | `#FFD66B` |
| Vinduslys skygge | `#F2BE3D` |
| Gul | `#F2C14E` |
| Gul skygge | `#D9A62E` |
| Grønn | `#3E8E5E` |
| Grønn skygge | `#2F7149` |
| Rav | `#E0A43A` |
| Rav skygge | `#C4882A` |
| Himmel dag | `#BFE3F2` |
| Himmel ettermiddag | `#F2D6A8` |
| Himmel kveld | `#F2B38A` |
| Himmel skumring | `#8C6BA8` |
| Himmel natt | `#2F3A5F` |

## Mål

- Rute: 64 × 32. Isometri 2:1.
- Etasjehøyde: 48.
- Kontur: 3. Små detaljer: 2. Ur-ramme: 6, merket `data-ramme="ur"`.
- Dør: 0,4 av veggbredden, 0,75 av vegghøyden.
- Skygge er konturfarge med `fill-opacity` 0,2. Ingen filter.
- Trykkflate: minst 48 × 48.
- Kort: radius 12. Knapper: pille (radius 999).
- Skrift: Nunito, selvhostet woff2. Ingen Google Fonts.
- Klokketall er HTML, aldri `<text>` i SVG.
- Timeviser: `(time % 12) × 30 + minutt × 0,5` grader. Minuttviser: `minutt × 6`.
- 14:30 og 02:30 har samme visere. Sol og måne skiller dem. Digitalt er alltid 24 timer, `HH:MM`.

## Himmel

Dag til 17:00, ettermiddag 17–18, kveld 18–19, skumring 19–20, natt fra 20:00.
