import { getDb, DEFAULT_SETTINGS } from './database';

export async function getAllSettings() {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) settings[row.key] = row.value;
  return normalizeSettings(settings);
}

export async function setSetting(key, value) {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, String(value)]
  );
}

export async function setSettings(obj) {
  const db = await getDb();
  for (const [key, value] of Object.entries(obj)) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, String(value)]
    );
  }
}

function normalizeSettings(raw) {
  return {
    payday: Number(raw.payday),
    savingsTargetPct: Number(raw.savings_target_pct),
    investmentReturnRate: Number(raw.investment_return_rate),
    notificationsEnabled: raw.notifications_enabled === 'true',
    weeklyReminderEnabled: raw.weekly_reminder_enabled === 'true',
    weeklyReminderWeekday: Number(raw.weekly_reminder_weekday),
    weeklyReminderHour: Number(raw.weekly_reminder_hour),
    budgetAlertEnabled: raw.budget_alert_enabled === 'true',
    budgetAlertThresholdPct: Number(raw.budget_alert_threshold_pct),
    monthlySummaryEnabled: raw.monthly_summary_enabled === 'true',
    gmailConnected: raw.gmail_connected === 'true',
    onboardingDone: raw.onboarding_done === 'true',
    raw,
  };
}
