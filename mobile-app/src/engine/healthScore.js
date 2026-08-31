import { average, standardDeviation } from './calculations';

/**
 * Indice di salute finanziaria mensile (0-100), ispirato alla disciplina
 * "alla Buffett": premia tasso di risparmio, costanza nel tempo e controllo
 * delle spese superflue. Nessuna componente riguarda mai spese di casa.
 *
 * Pesi: 50% tasso di risparmio vs obiettivo, 25% costanza, 25% controllo spese.
 */
export function computeHealthScore({ savingsRatePct, targetPct, last6MonthsRates, overspendCategoriesCount, totalExpenseCategories }) {
  const savingsScore = clamp((savingsRatePct / Math.max(1, targetPct)) * 100, 0, 100);

  let consistencyScore = 50;
  if (last6MonthsRates && last6MonthsRates.length >= 2) {
    const mean = average(last6MonthsRates);
    const std = standardDeviation(last6MonthsRates);
    const cv = std / Math.max(5, Math.abs(mean));
    consistencyScore = clamp(100 - cv * 100, 0, 100);
  }

  let overspendScore = 100;
  if (totalExpenseCategories > 0) {
    overspendScore = clamp(100 - (overspendCategoriesCount / totalExpenseCategories) * 100, 0, 100);
  }

  const score = savingsScore * 0.5 + consistencyScore * 0.25 + overspendScore * 0.25;

  return {
    score: Math.round(clamp(score, 0, 100)),
    breakdown: {
      savingsScore: Math.round(savingsScore),
      consistencyScore: Math.round(consistencyScore),
      overspendScore: Math.round(overspendScore),
    },
  };
}

export function healthLabel(score) {
  if (score >= 85) return { label: 'Eccellente', color: '#1E8E5A' };
  if (score >= 70) return { label: 'Buono', color: '#4C9F70' };
  if (score >= 50) return { label: 'Da migliorare', color: '#C9A227' };
  return { label: 'A rischio', color: '#D6483F' };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
