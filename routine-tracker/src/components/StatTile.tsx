import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors, fonts, radius, spacing } from '../theme/theme';

export function StatTile({ label, percent }: { label: string; percent: number }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{percent}%</Text>
      <ProgressBar percent={percent} height={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  label: {
    ...fonts.label,
    fontSize: 10,
    color: colors.textMuted,
  },
  value: {
    ...fonts.title,
    fontSize: 24,
    color: colors.accent,
  },
});
