import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { monthLabel, shiftMonthKey, currentMonthKey } from '../utils/formatters';

export default function MonthSelector({ monthKey, onChange }) {
  const isCurrent = monthKey >= currentMonthKey();

  return (
    <View style={styles.row}>
      <Pressable style={styles.arrow} onPress={() => onChange(shiftMonthKey(monthKey, -1))} hitSlop={10}>
        <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
      </Pressable>
      <Text style={styles.label}>{monthLabel(monthKey)}</Text>
      <Pressable
        style={[styles.arrow, isCurrent && styles.arrowDisabled]}
        onPress={() => !isCurrent && onChange(shiftMonthKey(monthKey, 1))}
        disabled={isCurrent}
        hitSlop={10}
      >
        <Ionicons name="chevron-forward" size={20} color={isCurrent ? COLORS.textMuted : COLORS.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 150,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    backgroundColor: COLORS.background,
  },
});
