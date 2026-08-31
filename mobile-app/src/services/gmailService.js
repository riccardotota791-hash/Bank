import * as AuthSession from 'expo-auth-session';
import { getTokens, saveTokens, clearTokens, getClientId } from './tokenStorage';
import { listMessageIds, getMessage, parseEmailDate } from './gmailApi';
import { parseEmailToTransaction } from './emailParser';
import { GOOGLE_DISCOVERY, GMAIL_SEARCH_QUERY } from '../constants/googleConfig';
import { addPendingImport } from '../db/pendingImportRepo';
import { addTransaction } from '../db/transactionsRepo';
import { resolvePendingImport } from '../db/pendingImportRepo';
import { getAllCategories } from '../db/categoriesRepo';
import { setSetting } from '../db/settingsRepo';

async function getValidAccessToken() {
  const tokens = await getTokens();
  if (!tokens) return null;

  const isExpired = tokens.expiresAt && Date.now() > tokens.expiresAt - 60_000;
  if (!isExpired) return tokens.accessToken;

  if (!tokens.refreshToken) return null;
  const clientId = await getClientId();
  if (!clientId) return null;

  try {
    const refreshed = await AuthSession.refreshAsync({ clientId, refreshToken: tokens.refreshToken }, GOOGLE_DISCOVERY);
    const next = {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken || tokens.refreshToken,
      expiresAt: Date.now() + (refreshed.expiresIn || 3600) * 1000,
    };
    await saveTokens(next);
    return next.accessToken;
  } catch (e) {
    console.warn('Impossibile rinnovare il token Gmail', e);
    return null;
  }
}

/**
 * Sincronizza le email recenti che sembrano ricevute/notifiche bancarie e
 * crea righe "da confermare" (mai transazioni dirette): l'utente conferma
 * sempre con uno swipe prima che diventino movimenti reali.
 */
export async function syncGmail() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) throw new Error('Gmail non connesso o token scaduto.');

  const categories = await getAllCategories();
  const findCategoryId = (name, type) => categories.find((c) => c.name === name && c.type === type)?.id
    ?? categories.find((c) => c.type === type)?.id
    ?? null;

  const messageRefs = await listMessageIds(accessToken, GMAIL_SEARCH_QUERY, 20);
  let imported = 0;

  for (const ref of messageRefs) {
    const msg = await getMessage(accessToken, ref.id);
    const parsed = parseEmailToTransaction({
      snippet: msg.snippet,
      subject: msg.subject,
      sender: msg.sender,
      date: parseEmailDate(msg.dateHeader),
      messageId: msg.id,
    });
    if (!parsed) continue;

    const categoryId = findCategoryId(parsed.categoryName, parsed.suggested_type === 'income' ? 'income' : 'expense');
    const result = await addPendingImport({
      amount: parsed.amount,
      suggested_type: parsed.suggested_type,
      suggested_category_id: categoryId,
      merchant: parsed.merchant,
      raw_snippet: parsed.raw_snippet,
      date: parsed.date,
      gmail_message_id: parsed.gmail_message_id,
    });
    if (result) imported += 1;
  }

  return imported;
}

export async function confirmImport(pendingItem) {
  await addTransaction({
    amount: pendingItem.amount,
    type: pendingItem.suggested_type,
    category_id: pendingItem.suggested_category_id,
    note: pendingItem.merchant,
    date: pendingItem.date,
    source: 'gmail',
  });
  await resolvePendingImport(pendingItem.id, 'confirmed');
}

export async function rejectImport(pendingItem) {
  await resolvePendingImport(pendingItem.id, 'rejected');
}

export async function disconnectGmail() {
  await clearTokens();
  await setSetting('gmail_connected', 'false');
}

export async function completeGmailConnection(tokenResponse) {
  await saveTokens({
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken,
    expiresAt: Date.now() + (tokenResponse.expiresIn || 3600) * 1000,
  });
  await setSetting('gmail_connected', 'true');
}
