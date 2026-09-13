import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, LoadingView, Badge } from '../components/UI';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import ProjectionChart from '../components/charts/ProjectionChart';
import { useApp } from '../context/AppContext';
import {
  getYearlyTrend,
  getCategoryPieData,
  getProjectionBasis,
  getYearSummary,
  getRecurringSubscriptions,
} from '../services/reportService';
import { projectWealth } from '../engine/calculations';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { currentFinancialMonthKey, formatEuro, formatDateIT } from '../utils/formatters';

export default function StatisticsScreen() {
  const { dataVersion, settings } = useApp();
  const [trend, setTrend] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [projections, setProjections] = useState([]);
  const [avgMonthlySavings, setAvgMonthlySavings] = useState(0);
  const [yearSummary, setYearSummary] = useState(null);
  const [subscriptions, setSubscriptions] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const payday = settings?.payday ?? 27;
    const monthKey = currentFinancialMonthKey(payday);
    const year = new Date().getFullYear();
    const [trendData, pie, basis, ySummary, subs] = await Promise.all([
      getYearlyTrend(monthKey, payday),
      getCategoryPieData(monthKey, payday),
      getProjectionBasis(monthKey, payday, settings?.initialSavings ?? 0),
      getYearSummary(year),
      getRecurringSubscriptions(),
    ]);
    setTrend(trendData);
    setPieData(pie);
    setYearSummary(ySummary);
    setSubscriptions(subs);
    setAvgMonthlySavings(basis.avgMonthly);
    const rate = settings?.investmentReturnRate || 6;
    setProjections(projectWealth(basis.avgMonthly, rate, [1, 5, 10, 20], basis.startingCapital));
    setLoading(false);
  }, [settings?.investmentReturnRate, settings?.payday, settings?.initialSavings]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingView />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Statistiche</Text>

        {yearSummary ? (
          <View style={styles.yearRow}>
            <YearStat label="Entrate" value={yearSummary.income} color={COLORS.income} />
            <YearStat label="Uscite" value={yearSummary.expense} color={COLORS.expense} />
            <YearStat label="Risparmiato" value={yearSummary.net} color={COLORS.primary} />
          </View>
        ) : null}

        <View style={{ marginTop: SPACING.lg }}>
          <SectionTitle subtitle="Anno in corso">Andamento del risparmio</SectionTitle>
          <Card>
            <MonthlyTrendChart data={trend} />
          </Card>
        </View>

        <View style={{ marginTop: SPACING.lg }}>
          <SectionTitle subtitle="Mese corrente">Uscite per categoria</SectionTitle>
          <Card>
            <CategoryPieChart categories={pieData} />
          </Card>
        </View>

        {subscriptions && subscriptions.items.length > 0 ? (
          <View style={{ marginTop: SPACING.lg }}>
            <SectionTitle subtitle="Spese che si ripetono ogni mese, rilevate dallo storico">Abbonamenti ricorrenti</SectionTitle>
            <Card>
              <View style={styles.subsSummary}>
                <Text style={styles.subsSummaryLabel}>Totale abbonamenti attivi</Text>
                <Text style={styles.subsSummaryValue}>{formatEuro(subscriptions.activeMonthlyCost)}/mese</Text>
                <Text style={styles.subsSummaryHint}>{formatEuro(subscriptions.activeAnnualCost)}/anno se continui così</Text>
              </View>
              {subscriptions.items.map((item, i) => (
                <SubscriptionRow key={i} item={item} isLast={i === subscriptions.items.length - 1} />
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ marginTop: SPACING.lg }}>
          <SectionTitle subtitle={`Se continui a risparmiare ${formatEuro(avgMonthlySavings)}/mese investiti al ${(settings?.investmentReturnRate || 6)}%`}>
            Proiezione patrimonio
          </SectionTitle>
          <Card>
            <ProjectionChart projections={projections} />
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function SubscriptionRow({ item, isLast }) {
  const isActive = item.status === 'active';
  return (
    <View style={[styles.subRow, !isLast && styles.subRowBorder]}>
      <View style={[styles.subIconCircle, { backgroundColor: `${item.categoryColor || COLORS.neutral}22` }]}>
        <Ionicons name={item.categoryIcon || 'repeat-outline'} size={18} color={item.categoryColor || COLORS.neutral} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.subName} numberOfLines={1}>{item.note}</Text>
        <Text style={styles.subMeta}>
          Ultimo addebito {formatDateIT(item.lastDate)} · {item.occurrences} volte rilevato
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.subAmount}>{formatEuro(item.avgAmount)}</Text>
        <Badge
          text={isActive ? 'Attivo' : 'Da verificare'}
          color={isActive ? COLORS.positive : COLORS.textSecondary}
          background={isActive ? COLORS.positiveLight : COLORS.background}
        />
      </View>
    </View>
  );
}

function YearStat({ label, value, color }) {
  return (
    <View style={styles.yearStat}>
      <Text style={styles.yearStatLabel}>{label}</Text>
      <Text style={[styles.yearStatValue, { color }]}>{formatEuro(value, true)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  yearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  yearStat: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
  },
  yearStatLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  yearStatValue: {
    fontSize: FONT.body,
    fontWeight: '800',
    marginTop: 4,
  },
  subsSummary: {
    alignItems: 'center',
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subsSummaryLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  subsSummaryValue: {
    fontSize: FONT.h2,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  subsSummaryHint: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  subRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subIconCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subMeta: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  subAmount: {
    fontSize: FONT.small,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
});
