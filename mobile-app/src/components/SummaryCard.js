import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatEuro, formatSignedPercent } from '../utils/formatters';

export default function SummaryCard({ totals, comparison, targetSavings, savingsRatePct, targetPct }) {
  const trendColor = comparison.trend === 'up' ? COLORS.positive : comparison.trend === 'down' ? COLORS.negative : COLORS.textSecondary;
  const trendIcon = comparison.trend === 'up' ? 'trending-up' : comparison.trend === 'down' ? 'trending-down' : 'remove';
  const progress = targetSavings > 0 ? Math.max(0, Math.min(1, totals.net / targetSavings)) : totals.net > 0 ? 1 : 0;

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>Risparmio del mese</Text>
      <Text style={styles.bigAmount}>{formatEuro(totals.net)}</Text>

      <View style={styles.trendRow}>
        <Ionicons name={trendIcon} size={16} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {formatSignedPercent(comparison.diffPct)} vs mese scorso
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: progress >= 1 ? COLORS.positive : COLORS.accent }]} />
      </View>
      <Text style={styles.progressLabel}>
        Obiettivo {targetPct.toFixed(0)}%: {formatEuro(targetSavings)} · Tasso attuale {savingsRatePct.toFixed(0)}%
      </Text>

      <View style={styles.divider} />

      <View style={styles.row}>
        <StatItem label="Entrate" value={totals.income} color={COLORS.income} />
        <StatItem label="Uscite" value={totals.expense} color={COLORS.expense} />
        <StatItem label="Investito" value={totals.saving} color={COLORS.saving} />
      </View>
    </View>
  );
}

function StatItem({ label, value, color }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{formatEuro(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
  },
  caption: {
    color: '#BFE0CE',
    fontSize: FONT.small,
    fontWeight: '600',
  },
  bigAmount: {
    color: COLORS.white,
    fontSize: 40,
    fontWeight: '800',
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  trendText: {
    fontSize: FONT.small,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: SPACING.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.pill,
  },
  progressLabel: {
    color: '#BFE0CE',
    fontSize: FONT.tiny,
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#BFE0CE',
    fontSize: FONT.tiny,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FONT.body,
    fontWeight: '700',
  },
});
