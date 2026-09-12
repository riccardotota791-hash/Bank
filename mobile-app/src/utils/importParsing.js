// Parsing "tollerante" di celle eterogenee di fogli Excel/CSV esportati da
// app bancarie: nessuna dipendenza esterna così è testabile in isolamento.

const MONTHS_3LETTER = { gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, ott: 10, nov: 11, dic: 12 };

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Converte un valore di cella eterogeneo (Date, numero seriale Excel, stringa) in "YYYY-MM-DD". */
export function parseDateValue(raw) {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return toISO(raw);
  }
  if (typeof raw === 'number' && isFinite(raw)) {
    // Numero seriale Excel (giorni dal 1899-12-30)
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return toISO(d);
    return null;
  }
  if (typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;

  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  m = s.toLowerCase().match(/^(\d{1,2})\s*([a-z]{3})[a-z]*\s*(\d{4})/);
  if (m && MONTHS_3LETTER[m[2]]) {
    return `${m[3]}-${String(MONTHS_3LETTER[m[2]]).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  return null;
}

/** Converte un valore di cella eterogeneo in un numero (virgola decimale, €, migliaia, parentesi negative). Null se non è un importo. */
export function parseAmountValue(raw) {
  if (typeof raw === 'number' && isFinite(raw)) return raw;
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (!s) return null;
  const parenthesized = /^\(.*\)$/.test(s);
  s = s.replace(/[€\s()]/g, '');
  if (s === '' || s === '-') return null;

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  } else if (hasComma) {
    s = s.replace(',', '.');
  }

  const n = Number(s);
  if (!isFinite(n) || isNaN(n)) return null;
  return parenthesized ? -Math.abs(n) : n;
}

/** Vero se la riga sembra un'intestazione (nessuna cella è un numero o un importo riconoscibile). */
export function looksLikeHeaderRow(row) {
  return row.every((cell) => {
    if (cell instanceof Date) return false;
    if (typeof cell === 'number') return false;
    return parseAmountValue(cell) === null;
  });
}

/** Hash breve e stabile di una stringa, per costruire ID sintetici di dedup. */
export function shortHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
