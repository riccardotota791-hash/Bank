import { getCategoriesByType } from '../db/categoriesRepo';
import { addPendingImport, findSimilarPendingImports } from '../db/pendingImportRepo';
import { findSimilarTransactions } from '../db/transactionsRepo';
import { parseIsyBankPaymentNotification } from '../utils/notificationParser';
import { guessCategoryName } from '../utils/categoryGuess';
import { shortHash } from '../utils/importParsing';
import { logNotificationDebugEvent } from './notificationDebugLog';

/**
 * Riceve la notifica grezza intercettata sul telefono (già come oggetto, non
 * più stringa JSON), la riconosce se è un pagamento IsyBank e — se non
 * corrisponde a un movimento già presente — crea una proposta "da
 * confermare" identica a quelle generate da Gmail/Excel: mai inserita in
 * automatico senza lo swipe di conferma dell'utente.
 *
 * Ogni esito (incluse le eccezioni) viene anche registrato in un log
 * diagnostico persistente: il task headless che chiama questa funzione gira
 * in background e non deve mai crashare, quindi normalmente ogni errore
 * verrebbe silenziato senza lasciare traccia — rendendo impossibile capire
 * se una notifica non importata sia dovuta a un bug, a un duplicato, a un
 * formato non riconosciuto o al sistema operativo che non ha proprio
 * avviato il servizio in background.
 */
// Il telefono riceve notifiche da decine di app diverse: per non riempire il
// log diagnostico (che tiene solo le ultime voci) con rumore irrilevante
// (WhatsApp, Instagram, ecc.), registriamo un esito "non riconosciuta" solo
// per notifiche che assomigliano comunque a un pagamento — così il log resta
// utile per capire se è la regex a fallire, non solo che il telefono riceve
// notifiche in generale.
function looksLikePayment(notification) {
  const raw = `${notification?.text || ''} ${notification?.bigText || ''}`.toLowerCase();
  return raw.includes('pagat') || raw.includes('€');
}

export async function importFromBankNotification(notification) {
  try {
    const parsed = parseIsyBankPaymentNotification(notification);
    if (!parsed) {
      if (looksLikePayment(notification)) {
        await logNotificationDebugEvent('non_riconosciuta', notification?.app || notification?.title || '');
      }
      return null;
    }

    const alreadyPresent = await findSimilarTransactions({ date: parsed.date, amount: parsed.amount });
    const alreadyPending = await findSimilarPendingImports({ date: parsed.date, amount: parsed.amount });
    if (alreadyPresent.length > 0 || alreadyPending.length > 0) {
      await logNotificationDebugEvent('duplicato_ignorato', `${parsed.amount}€ ${parsed.date} ${parsed.note}`);
      return null;
    }

    const expenseCategories = await getCategoriesByType('expense');
    const guessedName = guessCategoryName(parsed.note);
    const categoryId =
      expenseCategories.find((c) => c.name === guessedName)?.id ??
      expenseCategories.find((c) => c.name === 'Altro')?.id ??
      expenseCategories[0]?.id ??
      null;

    const externalId = `isybank:${parsed.date}:${parsed.amount.toFixed(2)}:${parsed.time}:${shortHash(parsed.note)}`;

    const id = await addPendingImport({
      amount: parsed.amount,
      suggested_type: 'expense',
      suggested_category_id: categoryId,
      merchant: parsed.note,
      raw_snippet: `Carta *${parsed.cardLast4} · ${parsed.time}`,
      date: parsed.date,
      gmail_message_id: externalId,
    });

    await logNotificationDebugEvent('importata', `${parsed.amount}€ ${parsed.date} ${parsed.note}`);
    return id;
  } catch (e) {
    await logNotificationDebugEvent('errore', e?.message || String(e));
    return null;
  }
}
