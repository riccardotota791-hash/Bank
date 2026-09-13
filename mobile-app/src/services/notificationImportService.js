import { getCategoriesByType } from '../db/categoriesRepo';
import { addPendingImport } from '../db/pendingImportRepo';
import { findSimilarTransactions } from '../db/transactionsRepo';
import { parseIsyBankPaymentNotification } from '../utils/notificationParser';
import { guessCategoryName } from '../utils/categoryGuess';
import { shortHash } from '../utils/importParsing';

/**
 * Riceve la notifica grezza intercettata sul telefono (già come oggetto, non
 * più stringa JSON), la riconosce se è un pagamento IsyBank e — se non
 * corrisponde a un movimento già presente — crea una proposta "da
 * confermare" identica a quelle generate da Gmail/Excel: mai inserita in
 * automatico senza lo swipe di conferma dell'utente.
 */
export async function importFromBankNotification(notification) {
  const parsed = parseIsyBankPaymentNotification(notification);
  if (!parsed) return null;

  const alreadyPresent = await findSimilarTransactions({ date: parsed.date, type: 'expense', amount: parsed.amount });
  if (alreadyPresent.length > 0) return null;

  const expenseCategories = await getCategoriesByType('expense');
  const guessedName = guessCategoryName(parsed.note);
  const categoryId =
    expenseCategories.find((c) => c.name === guessedName)?.id ??
    expenseCategories.find((c) => c.name === 'Altro')?.id ??
    expenseCategories[0]?.id ??
    null;

  const externalId = `isybank:${parsed.date}:${parsed.amount.toFixed(2)}:${parsed.time}:${shortHash(parsed.note)}`;

  return addPendingImport({
    amount: parsed.amount,
    suggested_type: 'expense',
    suggested_category_id: categoryId,
    merchant: parsed.note,
    raw_snippet: `Carta *${parsed.cardLast4} · ${parsed.time}`,
    date: parsed.date,
    gmail_message_id: externalId,
  });
}
