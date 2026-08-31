import { Platform } from 'react-native';
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
