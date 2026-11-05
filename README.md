# Formbyen

Mobil PWA for 1. og 2. klasse. Barnet bygger en by og øver på former og klokka. Riktige svar gir deler. Ingenting som er bygget, forsvinner.

## Bruk

Publiseres med GitHub Actions til GitHub Pages. Barnet åpner siden og legger den til hjemskjermen.

- Android: nettleseren kan vise «Installer app»
- iPhone: Safari, Del, Legg til på Hjem-skjerm

Etter første besøk kan byen spilles uten nett. Det finnes ingen konto og ingen sky. Byen ligger i `formbyen-v1` på telefonen. Voksensiden kan eksportere den som `formbyen-by.json`.

Utvikling:

```powershell
npm install
npm test
npm run dev
```

Appen åpnes på `http://localhost:5173/formbyen/`.

Bygg:

```powershell
npm run build
npm run preview
```

## Meny

Ny ettermiddag, dagbok, innstillinger, installer, om appen og en voksenside bak et gangestykke. Bokmål, nynorsk, engelsk, spansk, tysk, portugisisk, svensk, dansk og fransk. Klokkeordene følger landet. Hjemskjerm-navnet er Formbyen.

Nivåene er 1. klasse, 2. klasse, utfordrende og blandet. Lyd er av til noen slår den på.
