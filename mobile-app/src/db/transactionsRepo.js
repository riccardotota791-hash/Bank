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

/**
 * Movimenti già esistenti con importo uguale (tolleranza 1 centesimo) e
 * data entro un giorno da quella indicata — candidati per il controllo
 * duplicati degli importatori (Excel/CSV, notifiche bancarie). Il tipo
 * (entrata/uscita) NON entra nel confronto: dipende dal segno o dalla
 * colonna scelta durante la mappatura del file, che può risultare diverso
 * da un import all'altro pur trattandosi dello stesso identico movimento.
 * La tolleranza di un giorno sulla data serve per lo stesso motivo: fonti
 * diverse (email, notifica push, estratto conto) possono registrare la
 * "data" di uno stesso pagamento in momenti leggermente diversi (data
 * contabile vs data valuta, fuso orario dell'header email, ecc.).
 */
export async function findSimilarTransactions({ date, amount }) {
  const db = await getDb();
  return db.getAllAsync(
    "SELECT id, note FROM transactions WHERE ABS(julianday(date) - julianday(?)) <= 1 AND ABS(amount - ?) < 0.01",
    [date, amount]
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

/**
 * Ricerca libera sull'intera cronologia (non limitata al periodo
 * finanziario corrente): testo su nota/categoria, tipo, categoria,
 * intervallo di importo e intervallo di date, tutti opzionali e
 * combinabili. Usata dalla schermata di ricerca/filtro dei movimenti.
 */
export async function searchTransactions({
  text = '',
  type = null,
  categoryId = null,
  minAmount = null,
  maxAmount = null,
  startDate = null,
  endDate = null,
  limit = 300,
} = {}) {
  const db = await getDb();
  const clauses = [];
  const params = [];

  const trimmedText = text.trim();
  if (trimmedText) {
    clauses.push('(t.note LIKE ? OR c.name LIKE ?)');
    const like = `%${trimmedText}%`;
    params.push(like, like);
  }
  if (type) {
    clauses.push('t.type = ?');
    params.push(type);
  }
  if (categoryId != null) {
    clauses.push('t.category_id = ?');
    params.push(categoryId);
  }
  if (minAmount != null) {
    clauses.push('t.amount >= ?');
    params.push(minAmount);
  }
  if (maxAmount != null) {
    clauses.push('t.amount <= ?');
    params.push(maxAmount);
  }
  if (startDate) {
    clauses.push('t.date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    clauses.push('t.date <= ?');
    params.push(endDate);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     ${where}
     ORDER BY t.date DESC, t.id DESC
     LIMIT ?`,
    [...params, limit]
  );
}

/** Tutte le uscite di sempre, per il rilevamento degli abbonamenti ricorrenti. */
export async function getAllExpenseTransactions() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense'
     ORDER BY t.date ASC`
  );
}

export async function getFirstTransactionDate() {
  const db = await getDb();
  const row = await db.getFirstAsync('SELECT MIN(date) as minDate FROM transactions');
  return row?.minDate || null;
}
