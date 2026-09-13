// Parser per le notifiche push di pagamento di IsyBank, nel formato reale:
// "Hai pagato 1,80 € con la carta *9074 il 13.09 alle ore 20:27 da BARI
// FOOD, MUNGIVACCA." Nessuna dipendenza esterna, testabile in isolamento.
import { parseAmountValue } from './importParsing.js';

const PAYMENT_PATTERN =
  /hai pagato\s+([\d.,]+)\s*€\s*con la carta\s*\*?\s*(\d+)\s+il\s+(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\s+alle ore\s+(\d{1,2}):(\d{2})\s+da\s+(.+?)\.?\s*$/i;

function resolveYear(day, month, epochMillis) {
  const now = epochMillis && Number.isFinite(epochMillis) ? new Date(epochMillis) : new Date();
  let year = now.getFullYear();
  // Se il giorno/mese dedotto risultasse più di 2 giorni nel futuro rispetto
  // a "ora", la notifica si riferisce quasi certamente all'anno precedente
  // (capita solo a cavallo di Capodanno).
  const candidate = new Date(Date.UTC(year, month - 1, day));
  const diffDays = (candidate.getTime() - now.getTime()) / 86400000;
  if (diffDays > 2) year -= 1;
  return year;
}

/**
 * @param {{text?: string, bigText?: string, time?: string|number}} notification
 * @returns {{amount: number, cardLast4: string, date: string, note: string} | null}
 */
export function parseIsyBankPaymentNotification(notification) {
  if (!notification) return null;
  const raw = (notification.bigText || notification.text || '').trim();
  if (!raw) return null;

  const match = raw.match(PAYMENT_PATTERN);
  if (!match) return null;

  const [, amountRaw, cardLast4, dayRaw, monthRaw, yearRaw, hourRaw, minuteRaw, merchantRaw] = match;

  const amount = parseAmountValue(amountRaw);
  if (!amount || amount <= 0) return null;

  const day = parseInt(dayRaw, 10);
  const month = parseInt(monthRaw, 10);
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  const epochMillis = typeof notification.time === 'string' ? parseInt(notification.time, 10) : notification.time;
  const year = yearRaw ? (yearRaw.length === 2 ? 2000 + parseInt(yearRaw, 10) : parseInt(yearRaw, 10)) : resolveYear(day, month, epochMillis);

  const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const merchant = merchantRaw.trim().replace(/\s+/g, ' ');

  return {
    amount,
    cardLast4,
    date,
    time: `${hourRaw.padStart(2, '0')}:${minuteRaw}`,
    note: merchant,
  };
}
