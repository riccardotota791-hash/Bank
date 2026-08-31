// Configurazione OAuth per il modulo Gmail (opzionale). L'app non include
// alcuna credenziale: l'utente deve creare un proprio OAuth Client ID su
// https://console.cloud.google.com (tipo "iOS" o "Android", con lo scheme
// personalizzato definito in app.json) e incollarlo nella schermata
// "Collega Gmail" delle Impostazioni.
export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const GMAIL_SEARCH_QUERY =
  '(ricevuta OR scontrino OR pagamento OR addebito OR transazione OR bonifico OR accredito OR "hai speso" OR receipt OR payment) newer_than:30d';
