import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  ACTIVITY_DEFS,
  getScheduledActivities,
  PILLS_REMINDER_HOUR,
  PILLS_REMINDER_MINUTE,
} from '../data/schedule';
import { getCcnaProgress, getSettings } from '../data/storage';
import { DayKey } from '../data/types';
import { addDays, DAY_LABELS, startOfWeek, toExpoWeekday } from '../utils/date';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('routine-reminders', {
    name: 'Promemoria Routine',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150, 100, 150],
    lightColor: '#2de3c9',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function buildReminderBody(dayKey: DayKey, referenceDate: Date, ccnaCompleted: number): string {
  const scheduled = getScheduledActivities(referenceDate, ccnaCompleted);
  if (scheduled.length === 0) return 'Nessun modulo attivo oggi.';
  const labels = scheduled.map((key) => ACTIVITY_DEFS[key].shortLabel);
  return `Moduli attivi: ${labels.join(' · ')}`;
}

/**
 * Ricrea tutti i promemoria settimanali ripetuti in base all'orario impostato
 * e allo stato attuale della routine (es. corso CCNA concluso). Va richiamata
 * ad ogni avvio dell'app e ogni volta che cambiano le impostazioni o i progressi CCNA.
 */
export async function rescheduleReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await ensureAndroidChannel();

  const ccnaCompleted = await getCcnaProgress();
  const monday = startOfWeek(new Date());
  const orderedDays: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  for (let i = 0; i < orderedDays.length; i++) {
    const dayKey = orderedDays[i];
    const referenceDate = addDays(monday, i);
    const body = buildReminderBody(dayKey, referenceDate, ccnaCompleted);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📡 UPLINK — Routine di ${DAY_LABELS[dayKey]}`,
        body,
        data: { dayKey },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: toExpoWeekday(dayKey),
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
      },
    });
  }

  // Promemoria "Pillole": fisso alle 9:00, tutti i giorni, indipendente
  // dall'orario configurabile degli altri moduli.
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 UPLINK — Pillole',
      body: 'Promemoria: modulo Pillole di oggi.',
      data: { activity: 'pills' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: PILLS_REMINDER_HOUR,
      minute: PILLS_REMINDER_MINUTE,
    },
  });
}

export async function sendTestNotification(): Promise<void> {
  const granted = await requestNotificationPermission();
  if (!granted) return;
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📡 UPLINK — Test',
      body: 'Notifica di prova: il canale promemoria funziona correttamente.',
    },
    trigger: null,
  });
}
