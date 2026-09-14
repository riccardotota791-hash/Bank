import { getDb } from '../db/database';

const LOG_KEY = 'notification_debug_log';
const MAX_ENTRIES = 8;

/**
 * Il task headless che intercetta le notifiche bancarie gira in background
 * e non deve mai crashare, quindi ogni errore al suo interno viene
 * silenziato — ma questo rende impossibile capire perché una notifica non
 * sia stata importata (parsing fallito? duplicato? servizio mai avviato dal
 * sistema operativo? crash?). Questo log persistente su disco lo rende
 * verificabile dalla schermata Impostazioni.
 */
export async function logNotificationDebugEvent(outcome, detail = '') {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [LOG_KEY]);
    const existing = row?.value ? JSON.parse(row.value) : [];
    const entry = { at: new Date().toISOString(), outcome, detail: String(detail).slice(0, 200) };
    const next = [entry, ...existing].slice(0, MAX_ENTRIES);
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [LOG_KEY, JSON.stringify(next)]
    );
  } catch {
    // Il logging diagnostico non deve mai far fallire l'import vero e proprio.
  }
}

export async function getNotificationDebugLog() {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [LOG_KEY]);
    return row?.value ? JSON.parse(row.value) : [];
  } catch {
    return [];
  }
}
