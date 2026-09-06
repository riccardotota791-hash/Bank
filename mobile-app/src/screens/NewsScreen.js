import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, EmptyState, LoadingView, Badge } from '../components/UI';
import { NEWS_CATEGORIES, getCachedNews, fetchCategoryNews } from '../services/newsService';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

const CATEGORY_ORDER = ['finance', 'ai', 'italy'];

export default function NewsScreen() {
  const [activeCategory, setActiveCategory] = useState('finance');
  const [articles, setArticles] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadCategory = useCallback(async (categoryKey, { forceRefresh = false } = {}) => {
    setError(null);
    if (!forceRefresh) {
      const cached = await getCachedNews(categoryKey);
      if (cached) {
        setArticles(cached.articles);
        setFetchedAt(cached.fetchedAt);
        setLoading(false);
      }
    }
    try {
      const fresh = await fetchCategoryNews(categoryKey);
      setArticles(fresh.articles);
      setFetchedAt(fresh.fetchedAt);
    } catch (e) {
      if (!forceRefresh) {
        const cached = await getCachedNews(categoryKey);
        if (!cached) setError(e.message || 'Impossibile scaricare le notizie.');
      } else {
        setError(e.message || 'Impossibile aggiornare le notizie.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadCategory(activeCategory);
  }, [activeCategory, loadCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategory(activeCategory, { forceRefresh: true });
  };

  const openArticle = async (url) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  };

  const sections = groupByDay(articles);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Notizie</Text>
        <Text style={styles.subtitle}>Finanza mondiale, intelligenza artificiale e Italia, aggiornate da qui in poi</Text>
      </View>

      <View style={styles.tabs}>
        {CATEGORY_ORDER.map((key) => {
          const cat = NEWS_CATEGORIES[key];
          const active = activeCategory === key;
          return (
            <Pressable key={key} style={[styles.tab, active && styles.tabActive]} onPress={() => setActiveCategory(key)}>
              <Ionicons name={cat.icon} size={16} color={active ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {fetchedAt ? (
        <Text style={styles.fetchedAt}>
          Aggiornato alle {new Date(fetchedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ) : null}

      {loading ? (
        <LoadingView label="Carico le notizie..." />
      ) : error ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={40} color={COLORS.textMuted} />}
          title="Notizie non disponibili"
          subtitle={error}
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.dayKey}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={styles.dayLabel}>{item.dayLabel}</Text>
              {item.articles.map((article, i) => (
                <ArticleCard key={`${article.link}-${i}`} article={article} onPress={() => openArticle(article.link)} />
              ))}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Ionicons name="newspaper-outline" size={40} color={COLORS.textMuted} />}
              title="Nessuna notizia trovata"
              subtitle="Riprova più tardi o scorri per aggiornare."
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

function ArticleCard({ article, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Badge text={article.source} color={COLORS.primary} />
        <Text style={styles.cardTime}>
          {new Date(article.publishedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{article.title}</Text>
      {article.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {article.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

function groupByDay(articles) {
  const today = new Date();
  const todayKey = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();

  const groups = new Map();
  for (const article of articles) {
    const d = new Date(article.publishedAt);
    const dayKey = Number.isNaN(d.getTime()) ? 'unknown' : d.toDateString();
    if (!groups.has(dayKey)) groups.set(dayKey, []);
    groups.get(dayKey).push(article);
  }

  return Array.from(groups.entries()).map(([dayKey, items]) => ({
    dayKey,
    dayLabel: dayKey === todayKey ? 'Oggi' : dayKey === yesterdayKey ? 'Ieri' : formatDayKey(dayKey),
    articles: items,
  }));
}

function formatDayKey(dayKey) {
  if (dayKey === 'unknown') return 'Data sconosciuta';
  const d = new Date(dayKey);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT.tiny,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  fetchedAt: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  listContent: {
    padding: SPACING.lg,
  },
  dayLabel: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTime: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
  cardTitle: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
