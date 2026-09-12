import * as XLSX from 'xlsx';
import { File } from 'expo-file-system';
import { getCategoriesByType } from '../db/categoriesRepo';
import { addPendingImport } from '../db/pendingImportRepo';
import { findSimilarTransactions } from '../db/transactionsRepo';
import { parseDateValue, parseAmountValue, shortHash } from '../utils/importParsing';
import { guessCategoryName } from '../utils/categoryGuess';

export { looksLikeHeaderRow } from '../utils/importParsing';

/**
 * Legge un file Excel/CSV scelto dall'utente e restituisce le righe grezze
 * (array di array) così come sono nel foglio, senza alcuna interpretazione:
 * la mappatura delle colonne la sceglie l'utente nella schermata di import.
 */
export async function readSpreadsheetRows(uri) {
  const file = new File(uri);
  let rows = null;

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, raw: true });
    rows = extractRows(workbook);
  } catch (e) {
    rows = null;
  }

  if (!rows || rows.length === 0) {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string', cellDates: true, raw: true });
    rows = extractRows(workbook);
  }

  return rows || [];
}

function extractRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '' });
}

/**
 * Sceglie la categoria più adatta per una riga importata: prova prima il
 * testo della colonna Categoria del file (se mappata), poi la descrizione,
 * riconoscendo parole chiave (supermercati, ristoranti, trasporti, ...).
 * Se nessuna corrisponde, usa una categoria generica di riserva.
 */
function resolveCategoryId(type, { categoryText, description }, categoriesByType, fallbackByName) {
  const categories = categoriesByType[type] || [];

  const byExactName = (text) => {
    if (!text) return null;
    const normalized = text.trim().toLowerCase();
    return categories.find((c) => c.name.toLowerCase() === normalized)?.id ?? null;
  };

  const byKeyword = (text) => {
    if (!text) return null;
    const guessedName = guessCategoryName(text);
    if (guessedName === 'Altro') return null;
    return categories.find((c) => c.name === guessedName)?.id ?? null;
  };

  return (
    byExactName(categoryText) ??
    byKeyword(categoryText) ??
    byKeyword(description) ??
    fallbackByName[type] ??
    null
  );
}

/**
 * Trasforma le righe grezze del foglio (esclusa l'intestazione) in movimenti
 * candidati usando la mappatura di colonne scelta dall'utente, poi crea una
 * proposta "da confermare" per ogni riga che non risulti già presente né tra
 * i movimenti reali né tra le proposte in sospeso di un import precedente.
 *
 * Il confronto duplicati si basa su data + importo + tipo: nella pratica la
 * descrizione del testo bancario ("PAGAMENTO POS ESSELUNGA...") quasi mai
 * coincide con la nota che l'utente ha scritto a mano o importato in
 * precedenza (es. "Spesa settimanale"), quindi richiedere anche la
 * somiglianza testuale fa perdere duplicati veri. Per non scartare per
 * errore due spese diverse ma con stesso importo lo stesso giorno, ogni
 * movimento reale esistente "copre" al massimo una riga del file: se il
 * file ne contiene più di quante ce ne sono già in archivio con quella
 * combinazione data+importo+tipo, le righe in eccesso sono considerate
 * nuove.
 */
export async function importMappedRows({ rows, mapping, sourceLabel }) {
  const expenseCategories = await getCategoriesByType('expense');
  const incomeCategories = await getCategoriesByType('income');
  const categoriesByType = { expense: expenseCategories, income: incomeCategories };
  const fallbackByName = {
    expense: expenseCategories.find((c) => c.name === 'Altro')?.id ?? expenseCategories[0]?.id ?? null,
    income: incomeCategories.find((c) => c.name === 'Altre entrate')?.id ?? incomeCategories[0]?.id ?? null,
  };

  let imported = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;
  const consumedMatches = new Map();

  for (const row of rows) {
    const dateRaw = row[mapping.dateCol];
    const date = parseDateValue(dateRaw);

    let amount = null;
    let type = null;
    if (mapping.mode === 'signed') {
      const value = parseAmountValue(row[mapping.amountCol]);
      if (value !== null && value !== 0) {
        type = value < 0 ? 'expense' : 'income';
        amount = Math.abs(value);
      }
    } else {
      const outValue = parseAmountValue(row[mapping.outCol]);
      const inValue = parseAmountValue(row[mapping.inCol]);
      if (outValue !== null && outValue !== 0) {
        type = 'expense';
        amount = Math.abs(outValue);
      } else if (inValue !== null && inValue !== 0) {
        type = 'income';
        amount = Math.abs(inValue);
      }
    }

    if (!date || !amount || !type) {
      skippedInvalid += 1;
      continue;
    }

    const description = mapping.descCol != null ? String(row[mapping.descCol] ?? '').trim() : '';
    const categoryText = mapping.categoryCol != null ? String(row[mapping.categoryCol] ?? '').trim() : '';
    const externalId = `file:${sourceLabel}:${date}:${type}:${amount.toFixed(2)}:${shortHash(description)}`;

    const key = `${date}|${type}|${amount.toFixed(2)}`;
    const candidates = await findSimilarTransactions({ date, type, amount });
    const alreadyConsumed = consumedMatches.get(key) || 0;
    if (alreadyConsumed < candidates.length) {
      consumedMatches.set(key, alreadyConsumed + 1);
      skippedDuplicate += 1;
      continue;
    }

    const categoryId = resolveCategoryId(type, { categoryText, description }, categoriesByType, fallbackByName);
    const result = await addPendingImport({
      amount,
      suggested_type: type,
      suggested_category_id: categoryId,
      merchant: description || categoryText || null,
      raw_snippet: description,
      date,
      gmail_message_id: externalId,
    });

    if (result) imported += 1;
    else skippedDuplicate += 1;
  }

  return { imported, skippedDuplicate, skippedInvalid, total: rows.length };
}
