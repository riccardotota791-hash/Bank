// Motore di calcolo finanziario: regole "paga prima te stesso", capitalizzazione
// composta, confronti mese su mese. Nessun calcolo include mai spese di casa.

export function computeSavingsRate(income, expense) {
  if (!income || income <= 0) return 0;
  const saved = income - expense;
  return (saved / income) * 100;
}

export function compareValues(current, previous) {
  const diffValue = current - previous;
  let diffPct = 0;
  if (previous !== 0) {
    diffPct = (diffValue / Math.abs(previous)) * 100;
  } else if (current !== 0) {
    diffPct = 100;
  }
  const trend = diffValue > 0.005 ? 'up' : diffValue < -0.005 ? 'down' : 'flat';
  return { diffValue, diffPct, trend };
}

/**
 * Valore futuro di una somma unica investita a interesse composto annuo.
 */
export function futureValueLumpSum(principal, annualRatePct, years) {
  const r = annualRatePct / 100;
  return principal * Math.pow(1 + r, years);
}

/**
 * Valore futuro di versamenti mensili costanti con capitalizzazione composta
 * (interessi accreditati mensilmente, tasso annuo convertito in mensile).
 */
export function futureValueMonthlySeries(monthlyAmount, annualRatePct, years) {
  const n = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  if (n <= 0) return 0;
  if (r === 0) return monthlyAmount * n;
  return monthlyAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

/**
 * Proietta il patrimonio futuro dato un risparmio mensile costante,
 * partendo eventualmente da un capitale già accumulato.
 */
export function projectWealth(monthlyAmount, annualRatePct, yearsList = [1, 5, 10, 20], startingCapital = 0) {
  return yearsList.map((years) => {
    const futureFromContributions = futureValueMonthlySeries(monthlyAmount, annualRatePct, years);
    const futureFromCapital = futureValueLumpSum(startingCapital, annualRatePct, years);
    const futureValue = futureFromContributions + futureFromCapital;
    const contributed = monthlyAmount * years * 12 + startingCapital;
    const interestEarned = futureValue - contributed;
    return { years, futureValue, contributed, interestEarned };
  });
}

/**
 * Soglia di risparmio consigliata: dato che non ci sono spese di casa,
 * il target standard 50/30/20 viene ricalibrato più in alto (35-50%).
 * Se il tasso di risparmio storico medio è già alto, alza leggermente
 * ulteriormente l'asticella (principio della disciplina crescente).
 */
export function recommendedSavingsTarget(baseTargetPct, historicalAvgRate) {
  let target = baseTargetPct;
  if (Number.isFinite(historicalAvgRate) && historicalAvgRate > baseTargetPct + 10) {
    target = Math.min(50, baseTargetPct + 5);
  }
  return Math.max(35, Math.min(50, target));
}

export function reinvestmentRate(savingTransactionsTotal, computedMonthlySavings) {
  if (!computedMonthlySavings || computedMonthlySavings <= 0) return 0;
  return Math.min(100, (savingTransactionsTotal / computedMonthlySavings) * 100);
}

/**
 * Deviazione standard campionaria, usata per la "costanza" del risparmio.
 */
export function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}
