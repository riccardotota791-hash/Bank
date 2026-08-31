import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer, Card, SectionTitle, LoadingView, Badge } from '../components/UI';
import AdviceCard from '../components/AdviceCard';
import WhatIfSimulator from '../components/WhatIfSimulator';
import { useApp } from '../context/AppContext';
import { getMonthlyReport } from '../services/reportService';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { formatEuro, currentMonthKey } from '../utils/formatters';

export default function AdviceScreen() {
  const { dataVersion, settings } = useApp();
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    setReport(await getMonthlyReport(currentMonthKey()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  if (!report) {
    return (
      <ScreenContainer>
        <LoadingView />
      </ScreenContainer>
    );
  }

  const onTrack = report.totals.net >= report.targetSavings;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Consigli alla Buffett</Text>
        <Text style={styles.subtitle}>Disciplina, pazienza e interesse composto: paga prima te stesso.</Text>

        <Card style={{ marginTop: SPACING.lg }}>
          <View style={styles.rowBetween}>
            <SectionTitle style={{ marginBottom: 0 }}>Obiettivo del mese</SectionTitle>
            <Badge text={onTrack ? 'In linea' : 'Sotto obiettivo'} color={onTrack ? COLORS.positive : COLORS.negative} />
          </View>
          <Text style={styles.targetValue}>{formatEuro(report.targetSavings)}</Text>
          <Text style={styles.targetSub}>
            pari al {report.targetPct.toFixed(0)}% delle entrate — soglia ricalibrata perché non hai spese di casa.
          </Text>
          <View style={styles.compareRow}>
            <Text style={styles.compareLabel}>Risparmiato finora:</Text>
            <Text style={[styles.compareValue, { color: onTrack ? COLORS.positive : COLORS.negative }]}>
              {formatEuro(report.totals.net)}
            </Text>
          </View>
        </Card>

        <View style={{ marginTop: SPACING.lg }}>
          <SectionTitle>I tuoi consigli</SectionTitle>
          {report.adviceMessages.map((msg, i) => (
            <AdviceCard key={i} message={msg} tone={i === 0 ? (onTrack ? 'positive' : 'warning') : 'neutral'} />
          ))}
        </View>

        {report.overspendings.length > 0 ? (
          <View style={{ marginTop: SPACING.md }}>
            <SectionTitle subtitle="Categorie sopra la tua media storica">Sotto la lente</SectionTitle>
            <Card>
              {report.overspendings.map((o, i) => (
                <View key={o.categoryId} style={[styles.overspendRow, i > 0 && styles.overspendBorder]}>
                  <Text style={styles.overspendName}>{o.name}</Text>
                  <View style={styles.overspendValues}>
                    <Text style={styles.overspendCurrent}>{formatEuro(o.current)}</Text>
                    <Text style={styles.overspendAvg}>media {formatEuro(o.average)}</Text>
                  </View>
                  <Text style={styles.overspendPct}>+{o.diffPct.toFixed(0)}%</Text>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <View style={{ marginTop: SPACING.xl }}>
          <SectionTitle subtitle="Quanto potresti avere investendo con costanza">Simulatore what-if</SectionTitle>
          <Card>
            <WhatIfSimulator
              initialMonthly={Math.max(50, Math.round(report.totals.net / 50) * 50 || 300)}
              initialRate={settings?.investmentReturnRate || 6}
            />
          </Card>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
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
  },
  subtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  targetSub: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  compareLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
  },
  compareValue: {
    fontWeight: '700',
    fontSize: FONT.small,
  },
  overspendRow: {
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overspendBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  overspendName: {
    flex: 1,
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  overspendValues: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  overspendCurrent: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  overspendAvg: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
  overspendPct: {
    fontSize: FONT.small,
    fontWeight: '800',
    color: COLORS.negative,
    width: 46,
    textAlign: 'right',
  },
});
