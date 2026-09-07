import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVITY_DEFS } from '../data/schedule';
import { HabitInsight } from '../data/stats';
import { colors, fonts, radius, spacing } from '../theme/theme';

/**
 * Card di insight statistico (correlazione, non causalità) tra due moduli,
 * es. "Quando completi Lettura, hai il 30% in più di probabilità di
 * completare CCNA lo stesso giorno".
 */
export function HabitInsightCard({ insight }: { insight: HabitInsight }) {
  const fromLabel = ACTIVITY_DEFS[insight.fromKey].label;
  const toLabel = ACTIVITY_DEFS[insight.toKey].label;
  const liftPercent = Math.round(insight.lift * 100);

  return (
    <View style={styles.card}>
      <Ionicons name="analytics-outline" size={16} color={colors.accent} />
      <Text style={styles.text}>
        Quando completi <Text style={styles.highlight}>{fromLabel}</Text>, hai il{' '}
        <Text style={styles.highlight}>+{liftPercent}%</Text> di probabilità in più di completare
        anche <Text style={styles.highlight}>{toLabel}</Text> lo stesso giorno.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  highlight: {
    color: colors.accent,
    fontWeight: '700',
  },
});
