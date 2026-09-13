# Risparmio Buffett 🌱

App mobile React Native (Expo) per la gestione totale delle finanze personali,
ispirata alla disciplina di risparmio e investimento "alla Buffett": paga
prima te stesso, tieni le spese sotto controllo, investi la differenza e
lascia lavorare l'interesse composto.

**Contesto**: pensata per chi vive con i genitori e non ha spese di
affitto/mutuo/bollette di casa — nessun calcolo o categoria include mai
questa voce, e la soglia di risparmio consigliata è ricalibrata più alta
(35–50% invece del classico 20%).

## Funzionalità

- Registro entrate/uscite/risparmi con categorie personalizzabili (nessuna
  voce di casa)
- Risparmio mensile automatico, confronto col mese scorso, totale annuo
- Storico mese per mese
- Motore di consigli "alla Buffett": obiettivo di risparmio dinamico,
  rilevamento categorie fuori media, proiezioni a interesse composto
- Punteggio di salute finanziaria 0–100 (risparmio, costanza, controllo spese)
- Simulatore what-if con interesse composto
- Grafici: andamento mensile, torta per categoria, proiezione patrimoniale
  1/5/10/20 anni
- Notifiche locali: promemoria settimanale, alert budget categoria,
  riepilogo di fine mese
- Importazione automatica da Gmail (opzionale, OAuth) con conferma a swipe;
  inserimento manuale sempre disponibile come fallback
- Storage locale con SQLite — nessun account, nessun server, tutto sul
  dispositivo
- Tab **Notizie**: rassegna quotidiana su finanza mondiale, intelligenza
  artificiale e Italia da fonti RSS pubbliche (nessuna chiave API richiesta),
  con cache locale e aggiornamento manuale/pull-to-refresh

## Stack tecnico

- Expo SDK 57 (React Native 0.86, React 19)
- React Navigation (bottom tabs + native stack)
- `expo-sqlite` per la persistenza locale
- `react-native-chart-kit` + `react-native-svg` per i grafici
- `expo-notifications` per i promemoria locali
- `expo-auth-session` per l'OAuth Gmail opzionale

## Come avviarla su un dispositivo reale con Expo Go

1. Installa le dipendenze:
   ```bash
   cd mobile-app
   npm install
   ```
2. Avvia il server di sviluppo:
   ```bash
   npx expo start
   ```
3. Apri l'app **Expo Go** su iOS o Android e scansiona il QR code mostrato
   nel terminale (o nel browser). L'app si carica direttamente sul telefono,
   nessuna build nativa richiesta.
4. Alla prima apertura il database SQLite viene creato con le categorie di
   default (nessuna voce di casa) e le impostazioni predefinite (soglia di
   risparmio 40%, rendimento atteso 6%).

## Generare un vero APK (senza Expo Go)

L'app è già configurata per essere compilata come APK installabile, tramite
un workflow GitHub Actions incluso nel repo
(`.github/workflows/build-android-apk.yml`). Serve un account Expo gratuito
(usato solo per gestire le credenziali/il keystore tramite **EAS**, non per
la build vera e propria).

Setup (una tantum):

1. Crea un account gratuito su [expo.dev](https://expo.dev) se non ne hai già uno.
2. Genera un access token personale su
   [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
   ("Create token").
3. Nel repository GitHub, vai su **Settings → Secrets and variables →
   Actions → New repository secret**, crea un secret chiamato `EXPO_TOKEN`
   e incolla il token generato al punto 2.

Per compilare l'APK:

1. Vai sulla tab **Actions** del repository.
2. Seleziona il workflow **"Build Android APK (EAS)"**.
3. Clicca **"Run workflow"** (oppure fai un push su `mobile-app/**` per farlo
   partire automaticamente).
4. Al termine, apri l'esecuzione completata e scarica l'artifact
   **`risparmio-buffett-apk`**: contiene il file `risparmio-buffett.apk`,
   pronto da installare su qualsiasi telefono Android (abilita "Origini
   sconosciute" se richiesto dal sistema).

La build compila **in locale sul runner di GitHub Actions** (Android SDK +
Gradle installati al volo dal workflow stesso), non sui server cloud di EAS
— questo significa che **non consuma la quota mensile di build cloud del
piano Expo gratuito** (limitata a poche build/mese) e può girare tutte le
volte che serve. Il rovescio della medaglia è che è più lenta della build
cloud, soprattutto la prima volta (20-30 minuti, poi la cache di Gradle
velocizza le esecuzioni successive).

Il profilo di build usato è `preview` (definito in `eas.json`), che genera
un `.apk` di distribuzione interna con un keystore gestito da EAS — non
serve creare o gestire certificati a mano. Per pubblicare in futuro su
Google Play, usa invece il profilo `production` (genera un `.aab`):
`eas build --platform android --profile production --local`.

## Collegamento Gmail (opzionale)

Il modulo si attiva da **Impostazioni → Collega Gmail**. Richiede un tuo
Google OAuth Client ID (gratuito su console.cloud.google.com, con la Gmail
API abilitata) — nessuna credenziale è inclusa nell'app. Nota: il flusso
OAuth con redirect personalizzato funziona in modo affidabile solo in una
development build (`expo-dev-client`) o in una build standalone; dentro
Expo Go potrebbe non completarsi per via delle limitazioni sui redirect URI
dei client OAuth "installed app". Tutto il resto dell'app, incluso
l'inserimento manuale rapido, funziona sempre perfettamente in Expo Go.

## Importazione semi-automatica da file (Excel/CSV)

Da **Impostazioni → Importa da file (Excel/CSV)** puoi scegliere il file
con l'estratto conto/elenco movimenti scaricato dall'app della tua banca
(es. IsyBank, Intesa Sanpaolo, ecc.). Non c'è un formato fisso richiesto:
dopo aver scelto il file, l'app mostra un'anteprima delle prime righe e ti
chiede di indicare quale colonna contiene la data, quale l'importo (o le
due colonne separate Entrate/Uscite), e opzionalmente quale la
descrizione e quale la categoria (se il file la indica già).

- **Duplicati**: una riga viene considerata già presente se esiste un
  movimento con stessa data, stesso importo e stesso tipo; ogni movimento
  già in archivio "copre" al massimo una riga del file, così se il file ne
  contiene più di quante ce ne sono già con quella combinazione, solo le
  righe in eccesso vengono proposte come nuove.
- **Categoria**: se mappi la colonna Categoria del file, prova prima quella;
  altrimenti (o se non trova corrispondenza) riconosce la categoria dalla
  descrizione tramite parole chiave (supermercati, ristoranti, trasporti,
  abbonamenti, farmacie, ecc.) — la stessa logica usata per l'import Gmail.
  Solo se non riconosce nulla resta "Altro", da sistemare a mano dopo.

Le operazioni riconosciute come nuove finiscono nella tab **Movimenti →
"Da confermare"**, dove le confermi/rifiuti con uno swipe (stesso
meccanismo dell'import da Gmail): nessun movimento viene inserito
automaticamente senza la tua conferma.

## Abbonamenti ricorrenti

Nella tab **Statistiche**, la sezione "Abbonamenti ricorrenti" individua da
sola le spese che si ripetono ogni mese (Netflix, Spotify, palestra,
assicurazioni a rata fissa, ...): raggruppa le uscite per nota simile (o per
categoria+importo se la nota è vuota) e considera "ricorrente" solo ciò che
compare in almeno due mesi diversi con importo simile e una cadenza
plausibilmente mensile. Mostra il totale mensile/annuo degli abbonamenti
ancora attivi, e segna come "Da verificare" quelli il cui ultimo addebito
risale a più di 45 giorni fa (probabilmente disdetti). È tutto calcolato
sui movimenti già presenti nell'app — nessun collegamento a servizi esterni.

## Struttura del progetto

```
mobile-app/
  App.js                     entry point, provider + navigazione
  src/
    constants/                tema colori, categorie di default, icone
    context/AppContext.js     stato globale (db pronto, impostazioni, refresh)
    db/                       schema SQLite e repository (categorie, movimenti,
                               impostazioni, import Gmail in sospeso)
    engine/                   motore di calcolo puro: interesse composto,
                               consigli "alla Buffett", punteggio di salute
    services/                 orchestrazione dati (report mensili/annuali),
                               notifiche locali, integrazione Gmail
    components/                UI riutilizzabile e grafici
    screens/                   le 6 schermate + modali di modifica
    navigation/                bottom tabs + stack di navigazione
```

## Personalizzazione rapida

- Soglia di risparmio consigliata e rendimento atteso: **Impostazioni**
  (sliders +/-, range 35–50% e 0–12%)
- Categorie: **Impostazioni → Gestisci categorie** (aggiungi, modifica,
  elimina, imposta budget mensile)
- Reset completo dei dati: **Impostazioni → Azzera tutti i dati**
