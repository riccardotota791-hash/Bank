import { AppRegistry } from 'react-native';
import { registerRootComponent } from 'expo';
import { RNAndroidNotificationListenerHeadlessJsName } from 'react-native-android-notification-listener';

import App from './App';
import { importFromBankNotification } from './src/services/notificationImportService';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// Task headless invocato dal sistema Android ogni volta che arriva una
// notifica (da qualsiasi app), a patto che l'utente abbia concesso il
// permesso "Accesso alle notifiche" da Impostazioni → Importa da notifiche.
// Riconosce solo le notifiche di pagamento IsyBank: tutto il resto viene
// ignorato senza essere salvato da nessuna parte.
const handleIncomingNotification = async ({ notification }) => {
  try {
    const parsed = typeof notification === 'string' ? JSON.parse(notification) : notification;
    await importFromBankNotification(parsed);
  } catch (e) {
    // Il servizio di sistema non deve mai andare in crash per un errore di parsing.
  }
};

AppRegistry.registerHeadlessTask(RNAndroidNotificationListenerHeadlessJsName, () => handleIncomingNotification);
