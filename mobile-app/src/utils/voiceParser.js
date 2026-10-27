// Interpreta una frase pronunciata a voce tipo "Ho speso 15 euro al
// supermercato", "Ho ricevuto lo stipendio di 1500 euro" o "Ho messo da
// parte 50 euro di risparmio", e ne ricava importo, tipo (entrata/uscita/
// risparmio) e una nota ripulita da cui indovinare la categoria con la
// stessa logica già usata per Gmail/Excel. Nessun riconoscimento di numeri
// scritti a parole ("quindici euro"): si affida alla normalizzazione in
// cifre che il riconoscimento vocale di Android fa già per la stragrande
// maggioranza dei casi pratici.
import { parseAmountValue } from './importParsing';
import { guessCategoryName } from './categoryGuess';

const SAVING_KEYWORDS = [
  'risparmi', 'risparmio', 'messo da parte', 'accantonat', 'investit', 'investo',
];

const INCOME_KEYWORDS = [
  'stipendio', 'guadagnat', 'guadagno', 'ricevuto', 'incassat', 'entrata', 'entrate',
  'bonifico ricevuto', 'accredito', 'rimborso', 'regalo ricevuto', 'bonus',
];

// Frasi "di contorno" da ripulire dalla nota, in ordine dalla più lunga alla
// più corta (serve a togliere prima "ho messo da parte" e non lasciare un
// residuo "ho messo da" se si rimuovesse prima una frase più corta inclusa).
const LEADING_PHRASES = [
  'ho fatto una spesa di', 'ho messo da parte', 'messo da parte',
  'ho speso', 'ho pagato', 'ho comprato', 'ho acquistato', 'ho guadagnato',
  'ho ricevuto', 'ho incassato', 'ho risparmiato', 'ho investito',
  'spesa di', 'pagamento di', 'spendo', 'speso', 'pagato', 'guadagnato',
  'ricevuto', 'incassato', 'risparmiato', 'accantonato', 'investito',
];

const INCOME_CATEGORY_KEYWORDS = {
  Stipendio: ['stipendio'],
  'Lavoro autonomo': ['lavoro autonomo', 'fattura', 'partita iva', 'freelance'],
  'Regali e bonus': ['regalo', 'bonus', 'premio'],
};

const SAVING_CATEGORY_KEYWORDS = {
  'Investimenti (ETF/Azioni)': ['investiment', 'etf', 'azioni', 'investit'],
  'Fondo emergenza': ['fondo emergenza', 'emergenza'],
  'Assicurazione macchina': ['assicurazione macchina', 'assicurazione auto'],
};

function detectType(text) {
  const lower = text.toLowerCase();
  if (SAVING_KEYWORDS.some((k) => lower.includes(k))) return 'saving';
  if (INCOME_KEYWORDS.some((k) => lower.includes(k))) return 'income';
  return 'expense';
}

function guessCategoryNameForType(type, text) {
  if (type === 'expense') return guessCategoryName(text);
  const lower = text.toLowerCase();
  const table = type === 'income' ? INCOME_CATEGORY_KEYWORDS : SAVING_CATEGORY_KEYWORDS;
  for (const [name, keywords] of Object.entries(table)) {
    if (keywords.some((k) => lower.includes(k))) return name;
  }
  return type === 'income' ? 'Altre entrate' : 'Altro risparmio';
}

function cleanNote(text, amountMatchText) {
  let note = text.replace(amountMatchText, ' ').toLowerCase();
  for (const phrase of LEADING_PHRASES) {
    note = note.split(phrase).join(' ');
  }
  note = note
    .replace(/^[\s,.]*(di|per|al|alla|all'|in|da|del|della|dell')\b/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!note) return null;
  return note.charAt(0).toUpperCase() + note.slice(1);
}

/**
 * @param {string} transcript
 * @returns {{amount: number, type: 'expense'|'income'|'saving', note: string|null, categoryName: string} | null}
 */
export function parseVoiceTransaction(transcript) {
  const text = String(transcript || '').trim();
  if (!text) return null;

  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:euro|eur|€)/i) || text.match(/(\d+(?:[.,]\d+)?)/);
  if (!amountMatch) return null;

  const amount = parseAmountValue(amountMatch[1]);
  if (!amount || amount <= 0) return null;

  const type = detectType(text);
  const note = cleanNote(text, amountMatch[0]);
  const categoryName = guessCategoryNameForType(type, note || text);

  return { amount, type, note, categoryName };
}
