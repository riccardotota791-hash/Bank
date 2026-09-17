// Sovrascritto dalla CI (vedi .github/workflows/build-android-apk.yml) subito
// prima di ogni build con il commit e l'orario reali, per poter verificare
// dalla schermata Impostazioni quale versione del codice gira davvero su un
// telefono — utile quando un bug sembra "già corretto" ma il dispositivo sta
// ancora usando un APK installato prima del fix.
export const BUILD_COMMIT = 'dev';
export const BUILD_TIME = 'locale';
