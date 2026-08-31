import { getDb } from './database';

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

export async function getTransactionsByMonth(monthKey) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE substr(t.date, 1, 7) = ?
     ORDER BY t.date DESC, t.id DESC`,
    [monthKey]
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

export async function getMonthlyTotals(monthKey) {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE substr(date, 1, 7) = ? GROUP BY type`,
    [monthKey]
  );
  const totals = { income: 0, expense: 0, saving: 0 };
  for (const row of rows) totals[row.type] = row.total;
  totals.net = totals.income - totals.expense;
  return totals;
}

export async function getMonthlyTotalsRange(monthKeys) {
  const results = [];
  for (const monthKey of monthKeys) {
    const totals = await getMonthlyTotals(monthKey);
    results.push({ monthKey, ...totals });
  }
  return results;
}

export async function getCategoryTotalsForMonth(monthKey, type = 'expense') {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT c.id as category_id, c.name, c.icon, c.color, c.monthly_budget,
            COALESCE(SUM(t.amount), 0) as total
     FROM categories c
     LEFT JOIN transactions t ON t.category_id = c.id AND substr(t.date, 1, 7) = ? AND t.type = ?
     WHERE c.type = ?
     GROUP BY c.id
     ORDER BY total DESC`,
    [monthKey, type, type]
  );
}

export async function getCategoryAverageOverMonths(categoryId, monthKeys) {
  if (monthKeys.length === 0) return 0;
  const db = await getDb();
  const placeholders = monthKeys.map(() => '?').join(',');
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE category_id = ? AND substr(date, 1, 7) IN (${placeholders})`,
    [categoryId, ...monthKeys]
  );
  return (row?.total || 0) / monthKeys.length;
}

export async function getAvailableMonths() {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT DISTINCT substr(date, 1, 7) as monthKey FROM transactions ORDER BY monthKey DESC`
  );
  return rows.map((r) => r.monthKey);
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
