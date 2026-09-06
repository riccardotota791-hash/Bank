import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseRss } from '../utils/rss';

export const NEWS_CATEGORIES = {
  finance: {
    key: 'finance',
    label: 'Finanza mondiale',
    icon: 'trending-up-outline',
    feeds: [
      { name: 'CNBC Finance', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
      { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
      { name: 'MarketWatch', url: 'https://www.marketwatch.com/rss/topstories' },
    ],
  },
  ai: {
    key: 'ai',
    label: 'Intelligenza artificiale',
    icon: 'hardware-chip-outline',
    feeds: [
      { name: 'TechCrunch AI', url: 'https://techcrunch.com/tag/artificial-intelligence/feed/' },
      { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed' },
      { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    ],
  },
  italy: {
    key: 'italy',
    label: 'Italia',
    icon: 'flag-outline',
    feeds: [
      { name: 'ANSA', url: 'https://www.ansa.it/sito/ansait_rss.xml' },
      { name: 'Repubblica', url: 'https://www.repubblica.it/rss/homepage/rss2.0.xml' },
    ],
  },
};

const CACHE_PREFIX = 'news_cache_v1_';
const FETCH_TIMEOUT_MS = 12000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function getCachedNews(categoryKey) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + categoryKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setCachedNews(categoryKey, articles) {
  const payload = { articles, fetchedAt: new Date().toISOString() };
  await AsyncStorage.setItem(CACHE_PREFIX + categoryKey, JSON.stringify(payload));
  return payload;
}

/**
 * Scarica e unisce le notizie di oggi per una categoria da più fonti RSS
 * pubbliche (nessuna chiave API richiesta), le ordina per data decrescente
 * e aggiorna la cache locale. In caso di errore di rete su singole fonti,
 * usa comunque quelle riuscite.
 */
export async function fetchCategoryNews(categoryKey) {
  const category = NEWS_CATEGORIES[categoryKey];
  if (!category) throw new Error(`Categoria notizie sconosciuta: ${categoryKey}`);

  const results = await Promise.allSettled(
    category.feeds.map(async (feed) => {
      const res = await withTimeout(fetch(feed.url), FETCH_TIMEOUT_MS);
      if (!res.ok) throw new Error(`HTTP ${res.status} da ${feed.name}`);
      const xml = await res.text();
      return parseRss(xml, feed.name);
    })
  );

  const articles = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  const failedCount = results.filter((r) => r.status === 'rejected').length;

  if (articles.length === 0 && failedCount === category.feeds.length) {
    throw new Error('Nessuna fonte raggiungibile al momento.');
  }

  const cached = await setCachedNews(categoryKey, articles);
  return { ...cached, partial: failedCount > 0 };
}
