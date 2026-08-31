# Uplink Routine

App mobile nativa (React Native + Expo) per monitorare la routine settimanale:
CCNA, sala pesi, cardio, camminata, acqua, pillole, inglese e lettura. Tema
scuro ispirato ai pannelli di stato del networking, dati salvati solo in
locale con AsyncStorage, notifiche push locali come promemoria giornaliero
(più un promemoria fisso alle 9:00 dedicato alle pillole).

## Struttura del progetto

```
routine-tracker/
  App.tsx                     # entry point (provider + navigazione)
  app.json                    # config Expo (icone, splash, permessi Android)
  eas.json                    # profili di build EAS (development/preview/production)
  src/
    data/                     # tipi, regole della routine, storage AsyncStorage, statistiche
    hooks/RoutineStore.tsx    # stato globale (context) letto/scritto da tutte le schermate
    notifications/            # scheduling promemoria locali (expo-notifications)
    screens/                  # Oggi, Settimana, Statistiche, Impostazioni
    components/                # pannelli/LED/progress bar in stile "status panel"
    theme/                    # palette scura + tipografia
```

Le regole della routine (giorni attivi, corso CCNA, giorno libero del lunedì)
sono centralizzate in `src/data/schedule.ts` — è l'unico file da modificare
se in futuro cambiano gli orari o la data di fine corso.

## 1. Requisiti

- Node.js 18+ e npm (già presenti se stai leggendo questo da un ambiente dev)
- Un account Expo gratuito: https://expo.dev/signup
- Un telefono Android (per l'installazione diretta dell'APK, senza Play Store)

## 2. Anteprima rapida in sviluppo (facoltativo)

Per vedere l'app durante lo sviluppo, senza generare subito un APK:

```bash
cd routine-tracker
npm install
npx expo start
```

Scansiona il QR code con l'app **Expo Go** (Android) per un'anteprima veloce.
Nota: per provare le notifiche e l'icona/splash definitivi serve comunque la
build APK descritta sotto, perché Expo Go usa l'icona e alcune impostazioni
native di Expo Go stesso.

## 3. Configurare EAS Build (una tantum)

1. Installa la CLI di EAS (globale):
   ```bash
   npm install -g eas-cli
   ```
2. Accedi con il tuo account Expo:
   ```bash
   eas login
   ```
3. Collega il progetto al tuo account Expo (crea il progetto su expo.dev e
   scrive il `projectId` reale al posto del placeholder in `app.json`):
   ```bash
   cd routine-tracker
   eas init
   ```
   Questo comando aggiorna automaticamente `extra.eas.projectId` in
   `app.json`. Non serve modificarlo a mano.

Il file `eas.json` è già pronto con tre profili:
- `preview` → genera un **file .apk** installabile direttamente (quello che
  ti serve per il sideload sul telefono);
- `development` → build di sviluppo con dev client;
- `production` → build ottimizzata (per un eventuale futuro invio al Play
  Store, non necessaria per l'installazione diretta).

## 4. Generare l'APK

Dalla cartella `routine-tracker`:

```bash
eas build -p android --profile preview
```

Cosa succede:
1. EAS chiede (la prima volta) di generare automaticamente una keystore di
   firma Android: rispondi **Yes/Generate new keystore** — EAS la gestisce
   e la conserva per te, non serve fare nulla di manuale.
2. La build parte sui server Expo (gratuiti fino a un certo numero di build
   al mese) e richiede in genere 10-20 minuti. Puoi seguire l'avanzamento nel
   terminale oppure nella dashboard: https://expo.dev/accounts/<tuo-account>/projects/uplink-routine/builds
3. Al termine, il terminale stampa un **link diretto di download** dell'APK
   (e un QR code da inquadrare direttamente con il telefono).

## 5. Scaricare e installare l'APK sul telefono (senza Play Store)

Due modi equivalenti, entrambi partono dal link/QR mostrato al passo 4:

**A) Scansionando il QR code dal terminale**
Apri la fotocamera del telefono, inquadra il QR code stampato da `eas build`:
si apre il link di download direttamente sul telefono.

**B) Dal sito expo.dev**
Vai su https://expo.dev, accedi con lo stesso account, apri
*Progetto → Builds*, apri la build completata e tocca **Download**: il link
è ottimizzato per essere aperto dal browser del telefono stesso.

Una volta scaricato il file `.apk`:

1. Se è la prima volta che installi un APK esterno, Android chiederà di
   **consentire l'installazione da questa sorgente** (es. "Chrome" o "File").
   Vai su *Impostazioni → App → Accesso speciale → Installa app sconosciute*,
   seleziona l'app che hai usato per scaricare il file (browser o gestore
   file) e attiva **Consenti da questa sorgente**.
2. Apri il file `.apk` scaricato (dalla notifica di download o dal gestore
   file) e tocca **Installa**.
3. Al primo avvio, l'app chiederà il permesso di **inviare notifiche**
   (obbligatorio su Android 13+ perché servono i promemoria): concedilo per
   ricevere i promemoria giornalieri.

L'app è ora installata come una qualunque app nativa, con la sua icona nel
launcher, e funziona **offline**: tutti i dati restano salvati sul telefono.

## 6. Aggiornare l'app dopo una modifica

Ogni volta che modifichi il codice e vuoi una nuova versione installabile:

```bash
eas build -p android --profile preview
```

Aumenta `android.versionCode` in `app.json` prima di ogni nuova build (già
impostato a `1`: incrementalo a `2`, `3`, ecc.) così Android riconosce che si
tratta di un aggiornamento e non blocca l'installazione sopra la versione
precedente.

## Note tecniche

- **Notifiche**: vengono ripianificate automaticamente (una per ogni giorno
  della settimana, ripetuta) ogni volta che apri l'app o cambi l'orario nelle
  Impostazioni, così il contenuto resta sempre coerente con la routine
  effettiva (es. il modulo CCNA sparisce dal promemoria dopo metà novembre
  2026 o al completamento delle 30 lezioni).
- **Regola del lunedì**: ogni modulo in `ACTIVITY_DEFS` (in
  `src/data/schedule.ts`) elenca i propri giorni attivi; CCNA, sala pesi,
  cardio e inglese semplicemente non includono il lunedì, mentre camminata,
  acqua e lettura sono attivi tutti i giorni lunedì incluso.
  `getScheduledActivities` filtra su questi elenchi, quindi tutte le
  schermate (Oggi, Settimana, Statistiche) restano coerenti automaticamente.
- **Dati**: tutto è salvato con `@react-native-async-storage/async-storage`
  sotto chiavi `@uplink-routine/*`. Disinstallare l'app cancella i dati (non
  c'è backup cloud, come richiesto).
