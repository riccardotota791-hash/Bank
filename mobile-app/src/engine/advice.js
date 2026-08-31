import { futureValueMonthlySeries } from './calculations';
import { formatEuro } from '../utils/formatters';

export const OVERSPEND_THRESHOLD_RATIO = 1.2; // 20% oltre la media storica

export function computeTargetSavings(income, targetPct) {
  return income * (targetPct / 100);
}

/**
 * Individua le categorie di spesa dove il mese corrente sfora la media
 * storica di almeno OVERSPEND_THRESHOLD_RATIO, quantificando il possibile
 * risparmio mensile se si tornasse in linea con la propria media.
 */
export function detectOverspending(categoryStatsWithAverage) {
  return categoryStatsWithAverage
    .filter((c) => c.average > 1 && c.current > c.average * OVERSPEND_THRESHOLD_RATIO)
    .map((c) => {
      const diffAmount = c.current - c.average;
      const diffPct = (diffAmount / c.average) * 100;
      return { ...c, diffAmount, diffPct };
    })
    .sort((a, b) => b.diffAmount - a.diffAmount);
}

/**
 * Genera consigli testuali diretti, concreti e in stile "alla Buffett":
 * niente vaghezza, sempre numeri e proiezione a lungo termine dell'investimento
 * della differenza risparmiata.
 */
export function buildAdviceMessages({ income, actualSavings, targetSavings, targetPct, overspendings, annualRate }) {
  const messages = [];

  if (income <= 0) {
    messages.push('Registra le tue entrate del mese per ricevere consigli personalizzati.');
    return messages;
  }

  const gap = targetSavings - actualSavings;
  if (gap > 1) {
    messages.push(
      `Questo mese sei a ${formatEuro(actualSavings)} di risparmio, sotto l'obiettivo del ${targetPct.toFixed(0)}% (${formatEuro(targetSavings)}). Mancano ${formatEuro(gap)}: prima di ogni spesa discrezionale, mettili da parte.`
    );
  } else {
    const surplus = actualSavings - targetSavings;
    messages.push(
      `Ottimo: hai risparmiato ${formatEuro(actualSavings)}, ${surplus > 1 ? `${formatEuro(surplus)} oltre` : 'in linea con'} il tuo obiettivo del ${targetPct.toFixed(0)}%. Continua così: la disciplina costante batte i colpi di fortuna.`
    );
  }

  for (const o of overspendings.slice(0, 3)) {
    const fv10 = futureValueMonthlySeries(o.diffAmount, annualRate, 10);
    messages.push(
      `Hai speso il ${o.diffPct.toFixed(0)}% in più in "${o.name}" rispetto alla tua media (${formatEuro(o.current)} vs ${formatEuro(o.average)}). Riportalo in linea e risparmi ${formatEuro(o.diffAmount)}/mese, che in 10 anni investiti al ${annualRate}% diventano ${formatEuro(fv10)}.`
    );
  }

  if (overspendings.length === 0 && gap <= 1) {
    messages.push('Nessuna categoria fuori controllo questo mese: le tue spese sono coerenti con la tua media storica.');
  }

  return messages;
}

export function buildGoalStatus(actualSavings, targetSavings) {
  if (targetSavings <= 0) return { onTrack: true, ratio: 1 };
  const ratio = actualSavings / targetSavings;
  return { onTrack: ratio >= 1, ratio: Math.max(0, ratio) };
}
