import { getDb } from './database';

export async function addPendingImport({ amount, suggested_type, suggested_category_id, merchant, raw_snippet, date, gmail_message_id }) {
  const db = await getDb();
  try {
    const result = await db.runAsync(
      `INSERT INTO pending_import (amount, suggested_type, suggested_category_id, merchant, raw_snippet, date, gmail_message_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [amount, suggested_type, suggested_category_id, merchant, raw_snippet, date, gmail_message_id, new Date().toISOString()]
    );
    return result.lastInsertRowId;
  } catch (e) {
    // gmail_message_id già importato: ignora duplicato
    return null;
  }
}

export async function getPendingImports() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT p.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM pending_import p LEFT JOIN categories c ON c.id = p.suggested_category_id
     WHERE p.status = 'pending' ORDER BY p.date DESC`
  );
}

export async function resolvePendingImport(id, status) {
  const db = await getDb();
  await db.runAsync('UPDATE pending_import SET status = ? WHERE id = ?', [status, id]);
}

export async function countPendingImports() {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT COUNT(*) as count FROM pending_import WHERE status = 'pending'");
  return row?.count || 0;
}
