import * as XLSX from 'xlsx';
import { File } from 'expo-file-system';
import { getCategoriesByType } from '../db/categoriesRepo';
import { addPendingImport, findSimilarPendingImports } from '../db/pendingImportRepo';
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
 * candidati usando la mappatura di colonne scelta dall'utente, SENZA
 * scrivere ancora nulla sul database: restituisce un elenco che la
 * schermata mostra per la revisione (categoria compresa, modificabile) e la
 * scelta riga per riga di cosa importare davvero, prima di confermare.
 *
 * Il confronto duplicati si basa su data + importo + tipo, sia contro i
 * movimenti reali già confermati sia contro le proposte "da confermare"
 * già in coda (es. arrivate da una notifica bancaria o da un import
 * precedente non ancora rivisto): senza questo secondo controllo, importare
 * due file con periodi che si sovrappongono prima di aver confermato il
 * primo batch avrebbe proposto due volte la stessa operazione. Nella
 * pratica la descrizione del testo bancario ("PAGAMENTO POS ESSELUNGA...")
 * quasi mai coincide con la nota scritta a mano, quindi il confronto non
 * considera il testo. Per non scartare per errore due spese diverse ma con
 * stesso importo lo stesso giorno, ogni movimento/proposta esistente
 * "copre" al massimo una riga del file: le righe in eccesso rispetto a
 * quante ce ne sono già con quella combinazione data+importo+tipo sono
 * considerate nuove.
 */
export async function buildImportCandidates({ rows, mapping, sourceLabel }) {
  const expenseCategories = await getCategoriesByType('expense');
  const incomeCategories = await getCategoriesByType('income');
  const categoriesByType = { expense: expenseCategories, income: incomeCategories };
  const fallbackByName = {
    expense: expenseCategories.find((c) => c.name === 'Altro')?.id ?? expenseCategories[0]?.id ?? null,
    income: incomeCategories.find((c) => c.name === 'Altre entrate')?.id ?? incomeCategories[0]?.id ?? null,
  };

  const candidates = [];
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
    const existingTx = await findSimilarTransactions({ date, type, amount });
    const existingPending = await findSimilarPendingImports({ date, type, amount });
    const totalExisting = existingTx.length + existingPending.length;
    const alreadyConsumed = consumedMatches.get(key) || 0;
    const isDuplicate = alreadyConsumed < totalExisting;
    if (isDuplicate) consumedMatches.set(key, alreadyConsumed + 1);

    const categoryId = resolveCategoryId(type, { categoryText, description }, categoriesByType, fallbackByName);

    candidates.push({
      key: `${externalId}:${candidates.length}`,
      date,
      type,
      amount,
      description,
      categoryText,
      categoryId,
      externalId,
      isDuplicate,
      include: !isDuplicate,
    });
  }

  return { candidates, skippedInvalid, categoriesByType };
}

/**
 * Scrive sul database solo le righe che l'utente ha confermato di voler
 * importare (candidate.include === true), con la categoria eventualmente
 * corretta a mano nella schermata di revisione.
 */
export async function commitImportCandidates(candidates) {
  let imported = 0;
  let skipped = 0;

  for (const c of candidates) {
    if (!c.include) {
      skipped += 1;
      continue;
    }
    const result = await addPendingImport({
      amount: c.amount,
      suggested_type: c.type,
      suggested_category_id: c.categoryId,
      merchant: c.description || c.categoryText || null,
      raw_snippet: c.description,
      date: c.date,
      gmail_message_id: c.externalId,
    });
    if (result) imported += 1;
    else skipped += 1;
  }

  return { imported, skipped };
}
