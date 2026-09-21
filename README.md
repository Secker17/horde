# Hordejakten

En responsiv React-app for å samle og vurdere spor i Hordejakten. Appen inneholder et interaktivt kart med alle Norges 357 kommuner og 15 fylker, tre vurderingsnivåer, Firebase-basert adminpålogging og et åpent kommentarfelt for gjester.

## Kom i gang

```bash
npm install
cp .env.example .env
npm run dev
```

På Windows kan du kopiere miljøfilen med `Copy-Item .env.example .env`.

## Firebase-oppsett

1. Opprett et prosjekt i Firebase Console.
2. Aktiver både **Authentication → Email/Password** og **Authentication → Anonymous**. Opprett deretter én adminkonto med e-post og passord. Anonymous brukes automatisk for gjester og krever ingen synlig innlogging.
3. Opprett en Firestore-database.
4. Kopier web-appens Firebase-verdier inn i `.env`.
5. Finn UID-en til adminkontoen under Authentication og sett den som `VITE_ADMIN_UID`.
6. Erstatt `REPLACE_WITH_YOUR_ADMIN_UID` i `firestore.rules` med samme UID.
7. Publiser reglene med Firebase CLI: `firebase deploy --only firestore:rules`.

Kartstatus kan leses av alle, men bare den valgte admin-UID-en kan skrive. Kommentarer og antall brukere på nett oppdateres i sanntid. Gjester får en anonym Firebase-identitet, velger eget brukernavn og kan kommentere uten en vanlig konto. Administrator kan slette kommentarer og verifisere den anonyme identiteten bak et brukernavn. Når Firebase ikke er konfigurert, kjører kommentarfeltet automatisk i lokal demo-modus med `localStorage`; adminpålogging er da deaktivert.

## Bygg

```bash
npm run build
```

Kartgrunnlaget er basert på Kartverkets data under CC BY 4.0, bearbeidet av [robhop/fylker-og-kommuner](https://github.com/robhop/fylker-og-kommuner).
