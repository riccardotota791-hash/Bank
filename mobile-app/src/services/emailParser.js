// Parser euristico di ricevute/notifiche bancarie via email. Best-effort:
// ogni suggerimento va sempre confermato con lo swipe dall'utente.

const CATEGORY_KEYWORDS = {
  'Cibo e spesa': ['esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'supermercato', 'ristorante', 'pizzeria', 'deliveroo', 'glovo', 'justeat', 'just eat', 'bar '],
  'Trasporti': ['trenitalia', 'italo', 'atm milano', 'gtt', 'atac', 'uber', 'taxi', 'benzina', 'eni', 'q8', 'autostrade', 'telepass', 'ryanair', 'easyjet'],
  'Svago': ['cinema', 'concerto', 'steam', 'playstation', 'xbox', 'ticketone', 'eventbrite'],
  'Abbonamenti': ['netflix', 'spotify', 'amazon prime', 'disney+', 'disney plus', 'youtube premium', 'apple music', 'dazn', 'nowtv', 'now tv'],
  'Salute': ['farmacia', 'parafarmacia', 'ambulatorio', 'dott.', 'dottor', 'clinica'],
  'Formazione': ['udemy', 'coursera', 'libreria', 'libro', 'corso'],
};

const INCOME_KEYWORDS = ['accredito', 'stipendio', 'bonifico ricevuto', 'hai ricevuto', 'ricevuto un pagamento', 'payment received'];

export function guessCategoryName(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return 'Altro';
}

export function guessType(text) {
  const lower = text.toLowerCase();
  return INCOME_KEYWORDS.some((k) => lower.includes(k)) ? 'income' : 'expense';
}

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
