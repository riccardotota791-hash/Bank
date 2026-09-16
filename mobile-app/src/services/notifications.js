import { NativeModules, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getAllSettings } from '../db/settingsRepo';

const WEEKLY_REMINDER_ID = 'weekly-reminder';
const MONTHLY_SUMMARY_ID = 'monthly-summary';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Risparmio Buffett',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
  await rescheduleAllNotifications();
  await forceRebindNotificationListener();
}

/**
 * Android considera il permesso "Accesso alle notifiche" ancora concesso
 * (compare nell'elenco di sistema) anche quando il collegamento vero e
 * proprio al nostro NotificationListenerService si è interrotto — capita
 * tipicamente dopo aver installato una nuova build dell'app sopra quella
 * precedente, finché il telefono non viene riavviato. In quello stato la
 * schermata "Importa da notifiche" mostra "Attivo" ma nessuna notifica
 * arriva più al task in background. requestRebind() (via il modulo nativo)
 * è l'API pubblica pensata apposta per questo: la richiamiamo ad ogni avvio
 * dell'app, è innocua se il servizio è già collegato correttamente.
 */
async function forceRebindNotificationListener() {
  if (Platform.OS !== 'android') return;
  try {
    await NativeModules.RNAndroidNotificationListener?.forceRebind?.();
  } catch {
    // Non critico: se fallisce, l'utente può comunque riattivare a mano il
    // permesso dalla schermata "Importa da notifiche" per ottenere lo stesso effetto.
  }
}

export async function rescheduleAllNotifications() {
  const settings = await getAllSettings();
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelScheduledNotificationAsync(WEEKLY_REMINDER_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(MONTHLY_SUMMARY_ID).catch(() => {});

  if (settings.weeklyReminderEnabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_REMINDER_ID,
      content: {
        title: 'Controllo settimanale delle finanze',
        body: 'Un minuto per registrare le spese e restare fedele al tuo obiettivo di risparmio.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: mapWeekday(settings.weeklyReminderWeekday),
        hour: settings.weeklyReminderHour,
        minute: 0,
      },
    });
  }

  if (settings.monthlySummaryEnabled) {
    await Notifications.scheduleNotificationAsync({
      identifier: MONTHLY_SUMMARY_ID,
      content: {
        title: 'Riepilogo di fine mese',
        body: 'Apri l\'app per vedere il risultato rispetto al tuo obiettivo e il consiglio per il mese prossimo.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: 28,
        hour: 20,
        minute: 0,
      },
    });
  }
}

// expo-notifications usa 1=Domenica...7=Sabato, il nostro settings usa 0=Domenica...6=Sabato
function mapWeekday(weekday0to6) {
  return ((weekday0to6 % 7) + 1);
}

export async function notifyBudgetAlert(categoryName, currentAmount, budget) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Budget "${categoryName}" quasi esaurito`,
      body: `Hai speso ${currentAmount.toFixed(2)}€ su ${budget.toFixed(2)}€ disponibili questo mese.`,
    },
    trigger: null,
  });
}

export async function checkBudgetAlert({ category, monthTotalForCategory, settings }) {
  if (!settings.budgetAlertEnabled || !category?.monthly_budget) return;
  const pct = (monthTotalForCategory / category.monthly_budget) * 100;
  if (pct >= settings.budgetAlertThresholdPct) {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      await notifyBudgetAlert(category.name, monthTotalForCategory, category.monthly_budget);
    }
  }
}
