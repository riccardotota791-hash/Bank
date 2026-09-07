# Uplink Routine

App mobile nativa (React Native + Expo) per monitorare la routine settimanale:
CCNA, sala pesi, cardio, camminata, acqua, pillole, inglese e lettura. Tema
scuro ispirato ai pannelli di stato del networking, dati salvati solo in
locale con AsyncStorage, notifiche push locali come promemoria giornaliero
(con orario dedicato e separato per le Pillole).

Oltre al tracciamento base: stato a tre livelli per ogni modulo (non
iniziato / in corso / fatto), template di giornata selezionabili a mano,
achievement sbloccabili, mappa di calore mensile, statistiche di
completamento globale, insight statistici tra abitudini, sincronizzazione
opzionale dal sensore passi del telefono, feedback aptico + celebrazione
animata al 100%, e uno scaffold di widget per la schermata Home Android. I
dettagli e i limiti noti di ciascuna funzionalità sono nella sezione
[Funzionalità avanzate](#funzionalità-avanzate) più sotto.

## Struttura del progetto

```
routine-tracker/
  App.tsx                     # entry point (provider + navigazione)
  index.ts                    # registerRootComponent + registrazione widget task handler
  app.json                    # config Expo (icone, splash, permessi Android, plugin)
  eas.json                    # profili di build EAS (development/preview/production)
  src/
    data/                     # tipi, regole della routine, storage AsyncStorage, statistiche, achievement
    hooks/                    # RoutineStore.tsx (stato globale) + usePedometer.ts (sensore passi)
    notifications/            # scheduling promemoria locali (expo-notifications)
    screens/                  # Oggi, Settimana, Statistiche, Impostazioni
    components/                # pannelli/LED/progress bar/heatmap/badge in stile "status panel"
    widgets/                  # widget schermata Home Android (react-native-android-widget)
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

## Funzionalità avanzate

**Stato a tre livelli.** Ogni modulo (tranne l'acqua, vedi sotto) ha due
chip: "IN CORSO" e "FATTO", indipendenti — toccare quello già attivo lo
riporta a "non iniziato". Un modulo "in corso" conta come 0.5 nel calcolo
della percentuale di completamento (invece di 0 o 1), sia nella schermata
Oggi che nello storico/heatmap/grafico.

**Acqua a contatore.** Niente chip: i pulsanti "+250ml"/"+500ml" accumulano
i millilitri del giorno, lo stato (non iniziato/in corso/fatto) è calcolato
automaticamente rispetto all'obiettivo di 2 litri. Il tasto di reset azzera
il totale del giorno.

**Template di giornata.** Nella schermata Oggi, sopra i moduli, puoi
scegliere "Lavoro / Studio / Libero / Riposo" invece di seguire la regola
automatica per giorno della settimana: la scelta è salvata sulla singola
data e sovrascrive quale set di moduli è previsto (il CCNA resta comunque
nascosto dopo la fine corso, in qualunque template). "Automatico" torna
alla regola standard.

**Achievement (Tab Statistiche).** Badge sbloccabili in base allo storico
salvato (passi totali, lezioni CCNA, streak di lettura, sessioni di sala
pesi, giorni di idratazione, pagine lette). Sono ricalcolati ad ogni
apertura della tab, nessuno stato separato da mantenere.

**Mappa di calore (Tab Settimana).** Calendario mensile navigabile
(frecce ← →, non si può andare oltre il mese corrente) con l'intensità del
verde-acqua proporzionale alla % di completamento di ogni giorno.

**Statistiche globali e insight (Tab Statistiche).** Due indicatori di
"tasso di disciplina" (mese corrente / sempre) e, quando ci sono abbastanza
dati (minimo ~8 giorni comparabili), 1-3 card di correlazione statistica
tra coppie di moduli (es. "quando completi Lettura hai +30% di probabilità
di completare anche CCNA lo stesso giorno"). È una correlazione descrittiva
sui tuoi dati storici, non un modello predittivo/IA e non implica causalità.

**Sensore passi (best-effort).** Nella schermata Oggi, sopra il modulo
Camminata, compare una card di sincronizzazione se il telefono espone un
sensore passi (richiede il permesso "riconoscimento attività" su Android).
Limite noto della libreria (`expo-sensors`): su iOS si legge il totale
passi reale di oggi; **su Android si leggono solo i passi accumulati da
quando la schermata è aperta** (nessuno storico giornaliero disponibile via
questa API), quindi vanno aggiunti manualmente al totale con il pulsante
dedicato. Se il sensore non è disponibile o il permesso viene negato, il
campo numerico manuale (già presente) resta il modo principale per
registrare i passi.

**Feedback aptico e celebrazione.** Ogni chip di stato/pulsante acqua fa
vibrare leggermente il telefono (`expo-haptics`); quando i moduli previsti
di oggi raggiungono il 100% parte una vibrazione di conferma più un
bagliore neon + sparkle stilizzati attorno all'header (puramente
decorativo, si autodistrugge in ~2 secondi).

**Widget schermata Home (Android) — sperimentale, non verificato su
dispositivo reale.** È stato aggiunto un vero widget nativo
(`react-native-android-widget`, non solo codice scritto a mano): mostra la
% di completamento di oggi e due azioni rapide ("+250ml acqua",
"+1000 passi") che aggiornano gli stessi dati dell'app anche a widget
chiuso. La generazione del codice nativo Android (provider, manifest,
permessi) è stata verificata eseguendo `npx expo prebuild` in questo
ambiente — il file `android/app/.../widget/RoutineWidget.java` e il
receiver nel manifest vengono creati correttamente — ma **il comportamento
a schermo (rendering reale, tap sui pulsanti) non è stato testato su un
telefono o emulatore**, perché questo ambiente di sviluppo non ne ha uno
disponibile. Per verificarlo prima di affidarti al widget in produzione:
```bash
eas build -p android --profile development
```
installa quella build (include il dev client), aggiungi il widget dalla
schermata Home del telefono e controlla che si aggiorni. Se qualcosa non
va, il resto dell'app non ne risente: il widget è isolato e protetto da
try/catch, un suo malfunzionamento non blocca l'avvio dell'app. **Non è
disponibile una versione iOS**: `react-native-android-widget` è specifico
per Android; un widget iOS richiederebbe un'estensione WidgetKit in Swift
e un Mac con Xcode, fuori dallo scope di questa sessione.

## Note tecniche

- **Notifiche**: vengono ripianificate automaticamente (una per ogni giorno
  della settimana, ripetuta, più quella giornaliera delle Pillole) ogni
  volta che apri l'app o cambi un orario nelle Impostazioni, così il
  contenuto resta sempre coerente con la routine effettiva (es. il modulo
  CCNA sparisce dal promemoria dopo metà novembre 2026 o al completamento
  delle 30 lezioni). Il promemoria Pillole ha un orario indipendente da
  quello degli altri moduli, modificabile con lo stesso TimePicker nativo.
- **Regola del lunedì**: ogni modulo in `ACTIVITY_DEFS` (in
  `src/data/schedule.ts`) elenca i propri giorni attivi; CCNA, sala pesi,
  cardio e inglese semplicemente non includono il lunedì, mentre camminata,
  acqua, pillole e lettura sono attivi tutti i giorni lunedì incluso.
  `getScheduledActivities` filtra su questi elenchi (o sul template scelto a
  mano per quella data, se diverso da "Automatico"), quindi tutte le
  schermate (Oggi, Settimana, Statistiche) restano coerenti automaticamente.
- **Dati**: tutto è salvato con `@react-native-async-storage/async-storage`
  sotto chiavi `@uplink-routine/*` — record giornalieri (stato/valore per
  modulo, nota del diario, template scelto), progresso CCNA e impostazioni.
  Disinstallare l'app cancella i dati (non c'è backup cloud, come richiesto).
