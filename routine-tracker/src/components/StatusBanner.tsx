import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { LedDot } from './LedDot';
import { ProgressBar } from './ProgressBar';

export function StatusBanner({
  dayLabel,
  dateLabel,
  done,
  scheduled,
  percent,
  restDay,
}: {
  dayLabel: string;
  dateLabel: string;
  done: number;
  scheduled: number;
  percent: number;
  restDay: boolean;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.eyebrow}>STATO SISTEMA</Text>
          <Text style={styles.day}>{dayLabel.toUpperCase()}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <View style={styles.badge}>
          <LedDot state={restDay ? 'idle' : percent >= 100 ? 'on' : 'warn'} size={10} />
          <Text style={styles.badgeText}>{restDay ? 'GIORNO LIBERO' : percent >= 100 ? 'ONLINE' : 'IN CORSO'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.statsSub}>{done}/{scheduled} moduli completati</Text>
      </View>
      <ProgressBar percent={percent} height={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panelAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderBright,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    ...fonts.label,
    color: colors.textMuted,
  },
  day: {
    ...fonts.title,
    color: colors.textPrimary,
    marginTop: 2,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    ...fonts.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  percent: {
    ...fonts.bigStat,
    color: colors.accent,
  },
  statsSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
