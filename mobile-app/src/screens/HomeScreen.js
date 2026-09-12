import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, LoadingView } from '../components/UI';
import SummaryCard from '../components/SummaryCard';
import HealthGauge from '../components/HealthGauge';
import AdviceCard from '../components/AdviceCard';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../context/AppContext';
import { getMonthlyReport, getTotalSaved } from '../services/reportService';
import { getRecentTransactions, getYearTotals } from '../db/transactionsRepo';
import { COLORS, SPACING, FONT, RADIUS } from '../constants/theme';
import { formatEuro, currentFinancialMonthKey } from '../utils/formatters';

export default function HomeScreen({ navigation }) {
  const { dataVersion, settings } = useApp();
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState([]);
  const [yearTotals, setYearTotals] = useState({ net: 0 });
  const [totalSaved, setTotalSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const payday = settings?.payday ?? 27;
    const monthKey = currentFinancialMonthKey(payday);
    const [rep, recentTx, year, saved] = await Promise.all([
      getMonthlyReport(monthKey),
      getRecentTransactions(5),
      getYearTotals(new Date().getFullYear()),
      getTotalSaved(payday, settings?.initialSavings ?? 0),
    ]);
    setReport(rep);
    setRecent(recentTx);
    setYearTotals(year);
    setTotalSaved(saved);
    setLoading(false);
  }, [settings?.payday, settings?.initialSavings]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading || !report) {
    return (
      <ScreenContainer>
        <LoadingView label="Carico le tue finanze..." />
      </ScreenContainer>
    );
  }

  const topAdvice = report.adviceMessages[0];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>La tua disciplina finanziaria</Text>
          <Text style={styles.headerTitle}>Home</Text>
        </View>

        <SummaryCard
          totals={report.totals}
          comparison={report.comparison}
          targetSavings={report.targetSavings}
          savingsRatePct={report.savingsRatePct}
          targetPct={report.targetPct}
        />

        <Card style={styles.totalSavedCard}>
          <Text style={styles.totalSavedLabel}>Totale risparmiato</Text>
          <Text style={styles.totalSavedValue}>{formatEuro(totalSaved)}</Text>
          <Text style={styles.totalSavedHint}>
            Somma di tutti i mesi risparmiati{settings?.initialSavings ? ' + risparmio iniziale impostato' : ''} ·
            modificabile in Impostazioni
          </Text>
        </Card>

        <View style={styles.yearRow}>
          <View style={styles.yearBlock}>
            <Text style={styles.yearLabel}>Risparmiato quest'anno</Text>
            <Text style={styles.yearValue}>{formatEuro(yearTotals.net)}</Text>
          </View>
          <View style={styles.yearBlock}>
            <Text style={styles.yearLabel}>Investito del risparmio</Text>
            <Text style={[styles.yearValue, { color: COLORS.saving }]}>{report.reinvestPct.toFixed(0)}%</Text>
          </View>
        </View>

        <Card style={{ alignItems: 'center', marginTop: SPACING.lg }}>
          <SectionTitle style={{ alignSelf: 'flex-start' }}>Salute finanziaria del mese</SectionTitle>
          <HealthGauge score={report.healthScore} breakdown={report.healthBreakdown} />
        </Card>

        {topAdvice ? (
          <View style={{ marginTop: SPACING.lg }}>
            <SectionTitle>Consiglio del giorno</SectionTitle>
            <AdviceCard message={topAdvice} tone={report.overspendings.length > 0 ? 'warning' : 'positive'} />
            <Pressable onPress={() => navigation.navigate('Consigli')}>
              <Text style={styles.link}>Vedi tutti i consigli →</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{ marginTop: SPACING.lg }}>
          <View style={styles.rowBetween}>
            <SectionTitle style={{ marginBottom: 0 }}>Movimenti recenti</SectionTitle>
            <Pressable onPress={() => navigation.navigate('Movimenti')}>
              <Text style={styles.link}>Vedi tutti</Text>
            </Pressable>
          </View>
          <Card style={{ marginTop: SPACING.sm }}>
            {recent.length === 0 ? (
              <Text style={styles.emptyText}>Nessun movimento registrato. Aggiungi il primo!</Text>
            ) : (
              recent.map((tx, i) => (
                <View key={tx.id}>
                  <TransactionRow
                    transaction={tx}
                    onPress={(t) => navigation.navigate('AddTransaction', { transactionId: t.id })}
                  />
                  {i < recent.length - 1 ? <View style={styles.rowDivider} /> : null}
                </View>
              ))
            )}
          </Card>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction')}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  greeting: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  totalSavedCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  totalSavedLabel: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  totalSavedValue: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  totalSavedHint: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  yearRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  yearBlock: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  yearLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  yearValue: {
    fontSize: FONT.h3,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.small,
    marginTop: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    textAlign: 'center',
    paddingVertical: SPACING.md,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
