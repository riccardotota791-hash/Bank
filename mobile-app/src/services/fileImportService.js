import * as XLSX from 'xlsx';
import { File } from 'expo-file-system';
import { getCategoriesByType } from '../db/categoriesRepo';
import { addPendingImport } from '../db/pendingImportRepo';
import { transactionExistsSimilar } from '../db/transactionsRepo';
import { parseDateValue, parseAmountValue, shortHash } from '../utils/importParsing';

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
 * Trasforma le righe grezze del foglio (esclusa l'intestazione) in movimenti
 * candidati usando la mappatura di colonne scelta dall'utente, poi crea una
 * proposta "da confermare" per ogni riga che non risulti già presente né tra
 * i movimenti reali né tra le proposte in sospeso.
 */
export async function importMappedRows({ rows, mapping, sourceLabel }) {
  const expenseCategories = await getCategoriesByType('expense');
  const incomeCategories = await getCategoriesByType('income');
  const defaultExpenseCategoryId = expenseCategories.find((c) => c.name === 'Altro')?.id ?? expenseCategories[0]?.id ?? null;
  const defaultIncomeCategoryId = incomeCategories.find((c) => c.name === 'Altre entrate')?.id ?? incomeCategories[0]?.id ?? null;

  let imported = 0;
  let skippedDuplicate = 0;
  let skippedInvalid = 0;

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
    const externalId = `file:${sourceLabel}:${date}:${type}:${amount.toFixed(2)}:${shortHash(description)}`;

    const alreadyReal = await transactionExistsSimilar({ date, type, amount });
    if (alreadyReal) {
      skippedDuplicate += 1;
      continue;
    }

    const categoryId = type === 'expense' ? defaultExpenseCategoryId : defaultIncomeCategoryId;
    const result = await addPendingImport({
      amount,
      suggested_type: type,
      suggested_category_id: categoryId,
      merchant: description || null,
      raw_snippet: description,
      date,
      gmail_message_id: externalId,
    });

    if (result) imported += 1;
    else skippedDuplicate += 1;
  }

  return { imported, skippedDuplicate, skippedInvalid, total: rows.length };
}
