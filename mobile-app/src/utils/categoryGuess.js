// Riconoscimento categoria/tipo da testo libero (descrizione, causale,
// nome esercente) tramite parole chiave. Nessuna dipendenza esterna:
// usato sia dal parser email (Gmail) sia dall'importatore Excel/CSV, così
// le due fonti restano coerenti con le categorie realmente esistenti
// nell'app (vedi src/constants/categories.js).
const CATEGORY_KEYWORDS = {
  Trasporti: [
    'trenitalia', 'italo', 'atm milano', 'gtt', 'atac', 'uber', 'taxi', 'benzina', 'carburante',
    'eni', 'q8', 'ip ', 'esso', 'autostrade', 'telepass', 'ryanair', 'easyjet', 'parcheggio',
    'parking', 'autogrill', 'bus ', 'treno', 'metro', 'ncc', 'assicurazione macchina', 'assicurazione auto',
  ],
  'Spesa alimentare': [
    'esselunga', 'coop', 'conad', 'carrefour', 'lidl', 'eurospin', 'supermercato', 'alimentari',
    'md discount', 'penny market', 'iper', 'famila', 'pam ', 'despar', 'crai', 'todis',
  ],
  'Ristoranti e bar': [
    'ristorante', 'pizzeria', 'trattoria', 'osteria', 'bar ', 'caffe', 'caffè', 'cafe',
    'deliveroo', 'glovo', 'justeat', 'just eat', 'mcdonald', 'burger king', 'kebab', 'gelateria',
    'pasticceria', 'sushi',
  ],
  'Svago e tempo libero': [
    'cinema', 'concerto', 'steam', 'playstation', 'xbox', 'nintendo', 'ticketone', 'eventbrite',
    'teatro', 'museo', 'parco divertimenti', 'discoteca', 'bowling',
  ],
  Abbonamenti: [
    'netflix', 'spotify', 'amazon prime', 'disney+', 'disney plus', 'youtube premium', 'apple music',
    'dazn', 'nowtv', 'now tv', 'infinity', 'paramount', 'abbonamento', 'icloud',
  ],
  'Salute e benessere': [
    'farmacia', 'parafarmacia', 'ambulatorio', 'dott.', 'dottor', 'clinica', 'palestra', 'gym',
    'estetista', 'parrucchiere', 'barbiere', 'fisioterap', 'dentista',
  ],
  'Shopping e abbigliamento': [
    'zara', 'h&m', 'zalando', 'decathlon', 'mediaworld', 'unieuro', 'abbigliamento', 'calzature',
    'nike', 'adidas', 'bershka', 'pull&bear', 'oysho', 'ovs',
  ],
  Vinted: ['vinted'],
  'Istruzione e crescita personale': [
    'udemy', 'coursera', 'libreria', 'libro', 'corso di', 'universita', 'università', 'master',
    'iscrizione esame',
  ],
  'Regali e donazioni': ['regalo', 'donazione', 'beneficenza', 'raccolta fondi'],
};

const INCOME_KEYWORDS = [
  'accredito', 'stipendio', 'bonifico ricevuto', 'hai ricevuto', 'ricevuto un pagamento',
  'payment received', 'bonifico a tuo favore', 'giroconto in entrata', 'rimborso',
];

export function guessCategoryName(text) {
  const lower = String(text || '').toLowerCase();
  if (!lower) return 'Altro';
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return category;
  }
  return 'Altro';
}

export function guessType(text) {
  const lower = String(text || '').toLowerCase();
  return INCOME_KEYWORDS.some((k) => lower.includes(k)) ? 'income' : 'expense';
}
