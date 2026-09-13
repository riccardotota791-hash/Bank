// Rilevamento di spese ricorrenti (abbonamenti, palestra, assicurazioni...)
// dallo storico movimenti. Nessuna dipendenza esterna: raggruppa le uscite
// per nota normalizzata (o categoria+importo se la nota è vuota/generica),
// poi tiene solo i gruppi che ricorrono in mesi diversi con importo simile
// e una cadenza plausibilmente mensile.

export function normalizeForGrouping(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\d+/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(dateA, dateB) {
  return Math.abs(new Date(`${dateB}T00:00:00`) - new Date(`${dateA}T00:00:00`)) / 86400000;
}

/**
 * @param {Array<{id, date, amount, type, category_id, category_name, category_icon, category_color, note}>} transactions
 * @param {{today?: string, toleranceRatio?: number, minOccurrences?: number, inactiveAfterDays?: number}} options
 * @returns {Array} gruppi rilevati come ricorrenti, dal più costoso al meno costoso
 */
export function detectRecurringSubscriptions(transactions, options = {}) {
  const {
    today = new Date().toISOString().slice(0, 10),
    toleranceRatio = 0.1,
    minOccurrences = 2,
    inactiveAfterDays = 45,
  } = options;

  const expenses = transactions.filter((t) => t.type === 'expense');
  const groups = new Map();

  for (const t of expenses) {
    const normNote = normalizeForGrouping(t.note);
    const key = normNote.length >= 3 ? `note:${normNote}` : `cat:${t.category_id}:${Math.round(t.amount)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }

  const results = [];
  for (const items of groups.values()) {
    if (items.length < minOccurrences) continue;
    const sorted = [...items].sort((a, b) => (a.date < b.date ? -1 : 1));

    const distinctMonths = new Set(sorted.map((t) => t.date.slice(0, 7)));
    if (distinctMonths.size < minOccurrences) continue;

    const amounts = sorted.map((t) => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxDeviation = Math.max(...amounts.map((a) => Math.abs(a - avgAmount)));
    if (maxDeviation > Math.max(1, avgAmount * toleranceRatio)) continue;

    const gaps = [];
    for (let i = 1; i < sorted.length; i++) gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    const looksMonthly = gaps.some((g) => g >= 20 && g <= 45);
    if (!looksMonthly) continue;

    const last = sorted[sorted.length - 1];
    const status = daysBetween(last.date, today) <= inactiveAfterDays ? 'active' : 'inactive';

    results.push({
      note: last.note || last.category_name || 'Abbonamento',
      categoryId: last.category_id,
      categoryName: last.category_name,
      categoryIcon: last.category_icon,
      categoryColor: last.category_color,
      occurrences: sorted.length,
      avgAmount,
      lastAmount: last.amount,
      lastDate: last.date,
      status,
      annualCost: avgAmount * 12,
    });
  }

  results.sort((a, b) => b.avgAmount - a.avgAmount);
  return results;
}
