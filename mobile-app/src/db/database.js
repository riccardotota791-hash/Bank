import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../constants/categories';

const DB_NAME = 'finance.db';
let dbInstance = null;

export async function getDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export const DEFAULT_SETTINGS = {
  savings_target_pct: '40',
  investment_return_rate: '6',
  notifications_enabled: 'true',
  weekly_reminder_enabled: 'true',
  weekly_reminder_weekday: '1', // 1 = lunedì
  weekly_reminder_hour: '19',
  budget_alert_enabled: 'true',
  budget_alert_threshold_pct: '85',
  monthly_summary_enabled: 'true',
  gmail_connected: 'false',
  onboarding_done: 'false',
};

export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense','saving')),
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      monthly_budget REAL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income','expense','saving')),
      category_id INTEGER,
      note TEXT,
      date TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS pending_import (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      suggested_type TEXT NOT NULL,
      suggested_category_id INTEGER,
      merchant TEXT,
      raw_snippet TEXT,
      date TEXT NOT NULL,
      gmail_message_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
  `);

  await seedDefaultCategories(db);
  await seedDefaultSettings(db);
  await migrateExpenseCategories(db);
}

// Vecchio nome -> nuovo nome per le categorie di uscita rinominate.
const EXPENSE_CATEGORY_RENAMES = {
  'Cibo e spesa': 'Spesa alimentare',
  Svago: 'Svago e tempo libero',
  Salute: 'Salute e benessere',
  Formazione: 'Istruzione e crescita personale',
};

/**
 * Aggiorna le categorie di uscita di installazioni esistenti al nuovo set
 * (rinomina quelle equivalenti mantenendo lo storico, unisce "Imprevisti" in
 * "Altro", aggiunge le categorie mancanti). Idempotente: su un'installazione
 * già aggiornata o nuova non fa nulla.
 */
async function migrateExpenseCategories(db) {
  for (const [oldName, newName] of Object.entries(EXPENSE_CATEGORY_RENAMES)) {
    const oldCat = await db.getFirstAsync('SELECT id FROM categories WHERE name = ? AND type = ?', [oldName, 'expense']);
    if (!oldCat) continue;
    const newCat = await db.getFirstAsync('SELECT id FROM categories WHERE name = ? AND type = ?', [newName, 'expense']);
    if (newCat) {
      await db.runAsync('UPDATE transactions SET category_id = ? WHERE category_id = ?', [newCat.id, oldCat.id]);
      await db.runAsync('DELETE FROM categories WHERE id = ?', [oldCat.id]);
    } else {
      await db.runAsync('UPDATE categories SET name = ? WHERE id = ?', [newName, oldCat.id]);
    }
  }

  const imprevisti = await db.getFirstAsync('SELECT id FROM categories WHERE name = ? AND type = ?', ['Imprevisti', 'expense']);
  if (imprevisti) {
    const altroDefault = DEFAULT_CATEGORIES.find((c) => c.name === 'Altro' && c.type === 'expense');
    let altro = await db.getFirstAsync('SELECT id FROM categories WHERE name = ? AND type = ?', ['Altro', 'expense']);
    if (!altro) {
      const result = await db.runAsync(
        'INSERT INTO categories (name, type, icon, color, is_default, monthly_budget) VALUES (?, ?, ?, ?, 1, ?)',
        [altroDefault.name, altroDefault.type, altroDefault.icon, altroDefault.color, altroDefault.monthly_budget]
      );
      altro = { id: result.lastInsertRowId };
    }
    await db.runAsync('UPDATE transactions SET category_id = ? WHERE category_id = ?', [altro.id, imprevisti.id]);
    await db.runAsync('DELETE FROM categories WHERE id = ?', [imprevisti.id]);
  }

  const existingExpenseNames = new Set(
    (await db.getAllAsync('SELECT name FROM categories WHERE type = ?', ['expense'])).map((r) => r.name)
  );
  for (const cat of DEFAULT_CATEGORIES.filter((c) => c.type === 'expense')) {
    if (!existingExpenseNames.has(cat.name)) {
      await db.runAsync(
        'INSERT INTO categories (name, type, icon, color, is_default, monthly_budget) VALUES (?, ?, ?, ?, 1, ?)',
        [cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget]
      );
    }
  }
}

async function seedDefaultCategories(db) {
  const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM categories');
  if (row && row.count > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (name, type, icon, color, is_default, monthly_budget) VALUES (?, ?, ?, ?, 1, ?)',
      [cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget]
    );
  }
}

async function seedDefaultSettings(db) {
  const rows = await db.getAllAsync('SELECT key FROM settings');
  const existing = new Set(rows.map((r) => r.key));
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!existing.has(key)) {
      await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  }
}

export async function resetAllData() {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM pending_import;
    DELETE FROM categories;
    DELETE FROM settings;
  `);
  await seedDefaultCategories(db);
  await seedDefaultSettings(db);
}
