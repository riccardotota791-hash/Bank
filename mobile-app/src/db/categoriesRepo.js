import { getDb } from './database';

export async function getAllCategories() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM categories ORDER BY type, name');
}

export async function getCategoriesByType(type) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM categories WHERE type = ? ORDER BY name', [type]);
}

export async function getCategoryById(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function createCategory({ name, type, icon, color, monthly_budget = null }) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO categories (name, type, icon, color, is_default, monthly_budget) VALUES (?, ?, ?, ?, 0, ?)',
    [name, type, icon, color, monthly_budget]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(id, { name, icon, color, monthly_budget }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE categories SET name = ?, icon = ?, color = ?, monthly_budget = ? WHERE id = ?',
    [name, icon, color, monthly_budget, id]
  );
}

export async function deleteCategory(id) {
  const db = await getDb();
  await db.runAsync('UPDATE transactions SET category_id = NULL WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}
