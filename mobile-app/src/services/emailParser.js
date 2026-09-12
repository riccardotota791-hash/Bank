// Parser euristico di ricevute/notifiche bancarie via email. Best-effort:
// ogni suggerimento va sempre confermato con lo swipe dall'utente.
import { guessCategoryName, guessType } from '../utils/categoryGuess';

export function extractAmount(text) {
  const match = text.match(/(?:€|EUR)\s?([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)|([\d]{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s?(?:€|EUR)/i);
  if (!match) return null;
  const raw = match[1] || match[2];
  return parseItalianNumber(raw);
}

function parseItalianNumber(raw) {
  let normalized = raw;
  const lastComma = raw.lastIndexOf(',');
  const lastDot = raw.lastIndexOf('.');
  if (lastComma > lastDot) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    normalized = raw.replace(/,/g, '');
  }
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

export function extractMerchant(text, fallbackSender) {
  const patterns = [/presso\s+([A-Za-z0-9\s&.'-]{2,30})/i, /\bat\s+([A-Za-z0-9\s&.'-]{2,30})/i, /\bda\s+([A-Za-z0-9\s&.'-]{2,30})/i];
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) return m[1].trim().split(/[.\n]/)[0];
  }
  return fallbackSender || 'Movimento rilevato';
}

export function parseEmailToTransaction({ snippet, subject, sender, date, messageId }) {
  const text = `${subject || ''} ${snippet || ''}`;
  const amount = extractAmount(text);
  if (!amount || amount <= 0) return null;
  return {
    amount,
    suggested_type: guessType(text),
    categoryName: guessCategoryName(text),
    merchant: extractMerchant(text, sender),
    raw_snippet: snippet?.slice(0, 200) || '',
    date,
    gmail_message_id: messageId,
  };
}
