import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, Card, SectionTitle, LoadingView } from '../components/UI';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import ProjectionChart from '../components/charts/ProjectionChart';
import { useApp } from '../context/AppContext';
import { getYearlyTrend, getCategoryPieData, getProjectionBasis, getYearSummary } from '../services/reportService';
import { projectWealth } from '../engine/calculations';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { currentFinancialMonthKey, formatEuro } from '../utils/formatters';

export default function StatisticsScreen() {
  const { dataVersion, settings } = useApp();
  const [trend, setTrend] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [projections, setProjections] = useState([]);
  const [avgMonthlySavings, setAvgMonthlySavings] = useState(0);
  const [yearSummary, setYearSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const payday = settings?.payday ?? 27;
    const monthKey = currentFinancialMonthKey(payday);
    const year = new Date().getFullYear();
    const [trendData, pie, basis, ySummary] = await Promise.all([
      getYearlyTrend(monthKey, payday),
      getCategoryPieData(monthKey, payday),
      getProjectionBasis(monthKey, payday, settings?.initialSavings ?? 0),
      getYearSummary(year),
    ]);
    setTrend(trendData);
    setPieData(pie);
    setYearSummary(ySummary);
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
});
