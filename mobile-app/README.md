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

## Collegamento Gmail (opzionale)

Il modulo si attiva da **Impostazioni → Collega Gmail**. Richiede un tuo
Google OAuth Client ID (gratuito su console.cloud.google.com, con la Gmail
API abilitata) — nessuna credenziale è inclusa nell'app. Nota: il flusso
OAuth con redirect personalizzato funziona in modo affidabile solo in una
development build (`expo-dev-client`) o in una build standalone; dentro
Expo Go potrebbe non completarsi per via delle limitazioni sui redirect URI
dei client OAuth "installed app". Tutto il resto dell'app, incluso
l'inserimento manuale rapido, funziona sempre perfettamente in Expo Go.

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
