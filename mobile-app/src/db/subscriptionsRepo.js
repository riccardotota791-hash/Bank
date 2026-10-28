import { getDb } from './database';
import { addTransaction } from './transactionsRepo';
import { todayISODate } from '../utils/formatters';

export async function getSubscriptions() {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM subscriptions s LEFT JOIN categories c ON c.id = s.category_id
     ORDER BY s.next_due_date ASC`
  );
}

export async function getSubscriptionById(id) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT s.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM subscriptions s LEFT JOIN categories c ON c.id = s.category_id WHERE s.id = ?`,
    [id]
  );
}

export async function addSubscription({ name, categoryId, amount, frequencyMonths, nextDueDate }) {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO subscriptions (name, category_id, amount, frequency_months, next_due_date, saved_amount, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [name, categoryId, amount, frequencyMonths, nextDueDate, new Date().toISOString()]
  );
  return result.lastInsertRowId;
}

export async function updateSubscription(id, { name, categoryId, amount, frequencyMonths, nextDueDate }) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE subscriptions SET name = ?, category_id = ?, amount = ?, frequency_months = ?, next_due_date = ? WHERE id = ?',
    [name, categoryId, amount, frequencyMonths, nextDueDate, id]
  );
}

export async function deleteSubscription(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
}

export function monthlyShareOf(subscription) {
  return subscription.amount / subscription.frequency_months;
}

/**
 * Mette da parte la quota mensile per un abbonamento: registra un vero
 * movimento di risparmio (così conta nelle statistiche come soldi messi
 * via questo mese) e aggiorna il saldo accantonato. Senza categoria: in
 * subscription.category_id c'è la categoria di SPESA scelta per quando
 * arriva la bolletta (es. "Assicurazione macchina" fra le uscite), che ha
 * un id diverso dall'eventuale categoria di risparmio con lo stesso nome
 * — associarcela creerebbe un movimento di risparmio taggato con una
 * categoria di spesa, invisibile nelle statistiche di risparmio per
 * categoria perché cercano quelle di tipo "saving".
 */
export async function allocateMonthlyShare(subscription) {
  const db = await getDb();
  const share = monthlyShareOf(subscription);
  await addTransaction({
    amount: share,
    type: 'saving',
    category_id: null,
    note: `Accantonamento ${subscription.name}`,
    date: todayISODate(),
    source: 'subscription',
  });
  await db.runAsync('UPDATE subscriptions SET saved_amount = saved_amount + ? WHERE id = ?', [share, subscription.id]);
  return share;
}

/**
 * Segna l'abbonamento come pagato: registra la spesa vera e propria ma la
 * marca come "finanziata da risparmio già accantonato" (funded_by_subscription),
 * così non viene più contata nei totali del mese/categoria usati per tasso
 * di risparmio, budget e consigli — vedi i commenti in transactionsRepo.js.
 * Azzera il saldo accantonato (qualunque esso sia: può differire
 * dall'importo pagato se le quote messe da parte non coincidono esattamente)
 * e sposta avanti la prossima scadenza.
 */
export async function markSubscriptionPaid(subscription, { date } = {}) {
  const db = await getDb();
  const paidDate = date || todayISODate();
  await addTransaction({
    amount: subscription.amount,
    type: 'expense',
    category_id: subscription.category_id,
    note: subscription.name,
    date: paidDate,
    source: 'subscription',
    fundedBySubscription: true,
  });
  const nextDueDate = addMonthsToDate(subscription.next_due_date, subscription.frequency_months);
  await db.runAsync('UPDATE subscriptions SET saved_amount = 0, next_due_date = ? WHERE id = ?', [nextDueDate, subscription.id]);
}

function addMonthsToDate(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
