import { getMonthlyTotals, getCategoryTotalsForMonth, getCategoryAverageOverMonths, getYearTotals, getAvailableMonths } from '../db/transactionsRepo';
import { getAllSettings } from '../db/settingsRepo';
import { computeSavingsRate, compareValues, recommendedSavingsTarget, reinvestmentRate, average } from '../engine/calculations';
import { computeTargetSavings, detectOverspending, buildAdviceMessages } from '../engine/advice';
import { computeHealthScore } from '../engine/healthScore';
import { shiftMonthKey } from '../utils/formatters';

function monthKeysBack(monthKey, n) {
  const keys = [];
  for (let i = n; i >= 1; i--) keys.push(shiftMonthKey(monthKey, -i));
  return keys;
}

export async function getMonthlyReport(monthKey) {
  const settings = await getAllSettings();
  const prevMonthKey = shiftMonthKey(monthKey, -1);

  const [totals, prevTotals, expenseCategories] = await Promise.all([
    getMonthlyTotals(monthKey),
    getMonthlyTotals(prevMonthKey),
    getCategoryTotalsForMonth(monthKey, 'expense'),
  ]);

  const historyKeys = monthKeysBack(monthKey, 6);
  const historyTotals = [];
  for (const key of historyKeys) historyTotals.push(await getMonthlyTotals(key));
  const historyRates = historyTotals
    .filter((t) => t.income > 0)
    .map((t) => computeSavingsRate(t.income, t.expense));
  const historicalAvgRate = average(historyRates);

  const categoryStatsWithAverage = [];
  for (const cat of expenseCategories) {
    const avg = await getCategoryAverageOverMonths(cat.category_id, historyKeys);
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

export async function getYearlyTrend(year, upToMonthKey) {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    if (key > upToMonthKey) break;
    months.push(key);
  }
  const results = [];
  for (const key of months) {
    const totals = await getMonthlyTotals(key);
    results.push({ monthKey: key, ...totals, rate: computeSavingsRate(totals.income, totals.expense) });
  }
  return results;
}

export async function getYearSummary(year) {
  return getYearTotals(year);
}

export async function getCategoryPieData(monthKey, type = 'expense') {
  const rows = await getCategoryTotalsForMonth(monthKey, type);
  return rows.filter((r) => r.total > 0);
}

/**
 * Base dati per il grafico di proiezione patrimoniale: risparmio mensile
 * medio recente (ciò che verrebbe investito con costanza ogni mese) e
 * capitale già accumulato finora (base di partenza della capitalizzazione).
 */
export async function getProjectionBasis(monthKey) {
  const keys = [...monthKeysBack(monthKey, 5), monthKey];
  const nets = [];
  for (const key of keys) nets.push((await getMonthlyTotals(key)).net);
  const avgMonthly = Math.max(0, average(nets));

  const allMonths = await getAvailableMonths();
  let startingCapital = 0;
  for (const key of allMonths) startingCapital += (await getMonthlyTotals(key)).net;

  return { avgMonthly, startingCapital: Math.max(0, startingCapital) };
}
