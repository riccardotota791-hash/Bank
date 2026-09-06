import { getDb } from './database';
import { financialMonthKeyOf } from '../utils/formatters';

export async function addTransaction({ amount, type, category_id = null, note = '', date, source = 'manual' }) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO transactions (amount, type, category_id, note, date, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [amount, type, category_id, note, date, source, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(id, { amount, type, category_id, note, date }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE transactions SET amount = ?, type = ?, category_id = ?, note = ?, date = ? WHERE id = ?',
    [amount, type, category_id, note, date, id]
  );
}

export async function deleteTransaction(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getTransactionById(id) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id WHERE t.id = ?`,
    [id]
  );
}

/**
 * Le funzioni che seguono operano su un "periodo finanziario" [range.start,
 * range.end] (incluso) invece che sul mese di calendario: il periodo è
 * ancorato al giorno di accredito dello stipendio (impostazione "payday"),
 * calcolato con getFinancialPeriodRange in utils/formatters.
 */

export async function getTransactionsByRange(range) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.date >= ? AND t.date <= ?
     ORDER BY t.date DESC, t.id DESC`,
    [range.start, range.end]
  );
}

export async function getRecentTransactions(limit = 10) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     ORDER BY t.date DESC, t.id DESC LIMIT ?`,
    [limit]
  );
}

export async function getTotalsForRange(range) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE date >= ? AND date <= ? GROUP BY type`,
    [range.start, range.end]
  );
  const totals = { income: 0, expense: 0, saving: 0 };
  for (const row of rows) totals[row.type] = row.total;
  totals.net = totals.income - totals.expense;
  return totals;
}

export async function getCategoryTotalsForRange(range, type = 'expense') {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.id as category_id, c.name, c.icon, c.color, c.monthly_budget,
            COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND t.date >= ? AND t.date <= ? AND t.type = ?
     WHERE c.type = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [range.start, range.end, type, type]
  );
}

export async function getCategoryAverageOverRanges(categoryId, ranges) {
  if (ranges.length === 0) return 0;
  const db = await getDb();
  const clauses = ranges.map(() => '(date >= ? AND date <= ?)').join(' OR ');
  const params = ranges.flatMap((r) => [r.start, r.end]);
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE category_id = ? AND (${clauses})`,
    [categoryId, ...params]
  );
  return (row?.total || 0) / ranges.length;
}

/**
 * Elenco dei periodi finanziari (chiavi "YYYY-MM") che contengono almeno un
 * movimento, più recenti prima.
 */
export async function getAvailableMonths(payday = 27) {
  const db = await getDb();
  const rows = await db.getAllAsync('SELECT DISTINCT date FROM transactions');
  const keys = new Set(rows.map((r) => financialMonthKeyOf(r.date, payday)));
  return Array.from(keys).sort((a, b) => (a < b ? 1 : -1));
}

export async function getYearTotals(year) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE substr(date, 1, 4) = ? GROUP BY type`,
    [String(year)]
  );
  const totals = { income: 0, expense: 0, saving: 0 };
  for (const row of rows) totals[row.type] = row.total;
  totals.net = totals.income - totals.expense;
  return totals;
}

export async function getFirstTransactionDate() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT MIN(date) as minDate FROM transactions');
  return row?.minDate || null;
}
