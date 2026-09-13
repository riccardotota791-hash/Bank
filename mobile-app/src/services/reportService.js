import {
  getTotalsForRange,
  getCategoryTotalsForRange,
  getCategoryAverageOverRanges,
  getYearTotals,
  getAvailableMonths,
  getAllExpenseTransactions,
} from '../db/transactionsRepo';
import { getCategoriesByType } from '../db/categoriesRepo';
import { getAllSettings } from '../db/settingsRepo';
import { computeSavingsRate, compareValues, recommendedSavingsTarget, reinvestmentRate, average } from '../engine/calculations';
import { computeTargetSavings, detectOverspending, buildAdviceMessages } from '../engine/advice';
import { computeHealthScore } from '../engine/healthScore';
import { detectRecurringSubscriptions } from '../utils/recurringDetection';
import { shiftMonthKey, getFinancialPeriodRange } from '../utils/formatters';

function monthKeysBack(monthKey, n) {
  const keys = [];
  for (let i = n; i >= 1; i--) keys.push(shiftMonthKey(monthKey, -i));
  return keys;
}

/**
 * Ultime `maxMonths` chiavi di mesi finanziari che hanno almeno un
 * movimento registrato, fino a monthKey incluso, in ordine cronologico.
 * Evita di "diluire" medie e grafici con mesi fantasma senza dati.
 */
async function recentAvailableMonthKeys(monthKey, payday, maxMonths) {
  const allMonths = await getAvailableMonths(payday);
  const upTo = allMonths.filter((key) => key <= monthKey);
  return upTo.slice(0, maxMonths).reverse();
}

export async function getMonthlyReport(monthKey) {
  const settings = await getAllSettings();
  const payday = settings.payday;
  const range = getFinancialPeriodRange(monthKey, payday);
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const prevRange = getFinancialPeriodRange(prevMonthKey, payday);

  const [totals, prevTotals, expenseCategories] = await Promise.all([
    getTotalsForRange(range),
    getTotalsForRange(prevRange),
    getCategoryTotalsForRange(range, 'expense'),
  ]);

  const historyKeys = monthKeysBack(monthKey, 6);
  const historyRanges = historyKeys.map((key) => getFinancialPeriodRange(key, payday));
  const historyTotals = [];
  for (const r of historyRanges) historyTotals.push(await getTotalsForRange(r));
  const historyRates = historyTotals
    .filter((t) => t.income > 0)
    .map((t) => computeSavingsRate(t.income, t.expense));
  const historicalAvgRate = average(historyRates);

  const categoryStatsWithAverage = [];
  for (const cat of expenseCategories) {
    const avg = await getCategoryAverageOverRanges(cat.category_id, historyRanges);
    categoryStatsWithAverage.push({
      categoryId: cat.category_id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      budget: cat.monthly_budget,
      current: cat.total,
      average: avg,
    });
  }

  const savingsRatePct = computeSavingsRate(totals.income, totals.expense);
  const targetPct = recommendedSavingsTarget(settings.savingsTargetPct, historicalAvgRate);
  const targetSavings = computeTargetSavings(totals.income, targetPct);
  const overspendings = detectOverspending(categoryStatsWithAverage);
  const adviceMessages = buildAdviceMessages({
    income: totals.income,
    actualSavings: totals.net,
    targetSavings,
    targetPct,
    overspendings,
    annualRate: settings.investmentReturnRate,
  });

  const comparison = compareValues(totals.net, prevTotals.net);

  const last6MonthsRates = [...historyRates];
  if (totals.income > 0) last6MonthsRates.push(savingsRatePct);

  const overBudgetCategories = categoryStatsWithAverage.filter((c) => c.budget && c.current > c.budget);

  const { score, breakdown } = computeHealthScore({
    savingsRatePct,
    targetPct,
    last6MonthsRates,
    overspendCategoriesCount: overspendings.length,
    totalExpenseCategories: Math.max(1, expenseCategories.length),
  });

  const reinvestPct = reinvestmentRate(totals.saving, Math.max(0, totals.net));

  return {
    monthKey,
    range,
    settings,
    totals,
    prevTotals,
    comparison,
    savingsRatePct,
    targetPct,
    targetSavings,
    categoryStats: categoryStatsWithAverage,
    overspendings,
    overBudgetCategories,
    adviceMessages,
    healthScore: score,
    healthBreakdown: breakdown,
    reinvestPct,
    historicalAvgRate,
  };
}

export async function getYearlyTrend(monthKey, payday = 27, maxMonths = 6) {
  const keys = await recentAvailableMonthKeys(monthKey, payday, maxMonths);
  const results = [];
  for (const key of keys) {
    const totals = await getTotalsForRange(getFinancialPeriodRange(key, payday));
    results.push({ monthKey: key, ...totals, rate: computeSavingsRate(totals.income, totals.expense) });
  }
  return results;
}

export async function getYearSummary(year) {
  return getYearTotals(year);
}

export async function getCategoryPieData(monthKey, payday = 27, type = 'expense') {
  const rows = await getCategoryTotalsForRange(getFinancialPeriodRange(monthKey, payday), type);
  return rows.filter((r) => r.total > 0);
}

/**
 * Base dati per il grafico di proiezione patrimoniale: risparmio mensile
 * medio recente (ciò che verrebbe investito con costanza ogni mese) e
 * capitale già accumulato finora (base di partenza della capitalizzazione).
 */
export async function getProjectionBasis(monthKey, payday = 27, initialSavings = 0) {
  const keysWithData = await recentAvailableMonthKeys(monthKey, payday, 6);
  const keysToAverage = keysWithData.length > 0 ? keysWithData : [monthKey];

  const nets = [];
  for (const key of keysToAverage) nets.push((await getTotalsForRange(getFinancialPeriodRange(key, payday))).net);
  const avgMonthly = Math.max(0, average(nets));

  const startingCapital = await getTotalSaved(payday, initialSavings);

  return { avgMonthly, startingCapital };
}

/**
 * Totale risparmiato "di sempre": il risparmio già accumulato prima di
 * iniziare a usare l'app (impostazione manuale) più la somma del netto di
 * ogni mese finanziario tracciato da allora — cresce da solo ogni mese man
 * mano che passano nuovi periodi.
 */
export async function getTotalSaved(payday = 27, initialSavings = 0) {
  const allMonths = await getAvailableMonths(payday);
  let total = initialSavings;
  for (const key of allMonths) total += (await getTotalsForRange(getFinancialPeriodRange(key, payday))).net;
  return Math.max(0, total);
}

/**
 * Dati per la sezione "Regole d'oro": split 50/30/20 sul reddito del
 * periodo corrente e obiettivo di fondo di emergenza (3-6 mesi di
 * bisogni primari: Trasporti + Assicurazione macchina + Spesa alimentare),
 * calcolato sulla media degli ultimi mesi finanziari disponibili (fino a 6).
 */
export async function getGoldenRulesData(monthKey, payday = 27) {
  const totals = await getTotalsForRange(getFinancialPeriodRange(monthKey, payday));

  const expenseCategories = await getCategoriesByType('expense');
  const essentialCategories = expenseCategories.filter((c) =>
    ['Trasporti', 'Assicurazione macchina', 'Spesa alimentare'].includes(c.name)
  );

  const keysWithData = await recentAvailableMonthKeys(monthKey, payday, 6);
  const ranges = (keysWithData.length > 0 ? keysWithData : [monthKey]).map((key) => getFinancialPeriodRange(key, payday));

  let avgEssentialMonthly = 0;
  for (const cat of essentialCategories) {
    avgEssentialMonthly += await getCategoryAverageOverRanges(cat.id, ranges);
  }

  return {
    income: totals.income,
    split: {
      savings: totals.income * 0.5,
      personal: totals.income * 0.3,
      essential: totals.income * 0.2,
    },
    avgEssentialMonthly,
    emergencyFundMin: avgEssentialMonthly * 3,
    emergencyFundMax: avgEssentialMonthly * 6,
  };
}

/**
 * Abbonamenti/spese ricorrenti rilevati dallo storico (Netflix, palestra,
 * assicurazioni pagate a rate fisse, ...): stessa nota (o categoria+importo
 * se la nota è vuota) che ricorre in mesi diversi con importo simile e
 * cadenza plausibilmente mensile. Nessun collegamento a servizi esterni:
 * solo pattern-matching sui movimenti già registrati.
 */
export async function getRecurringSubscriptions() {
  const expenses = await getAllExpenseTransactions();
  const items = detectRecurringSubscriptions(expenses);
  const activeMonthlyCost = items.filter((i) => i.status === 'active').reduce((sum, i) => sum + i.avgAmount, 0);
  return { items, activeMonthlyCost, activeAnnualCost: activeMonthlyCost * 12 };
}
