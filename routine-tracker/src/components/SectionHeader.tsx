import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../theme/theme';

export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.tick} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tick: {
    width: 3,
    height: 14,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  title: {
    ...fonts.label,
    color: colors.textSecondary,
  },
  hint: {
    marginLeft: 'auto',
    color: colors.textMuted,
    fontSize: 11,
  },
});
