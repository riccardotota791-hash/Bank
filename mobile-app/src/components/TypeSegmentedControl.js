import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

const OPTIONS = [
  { value: 'expense', label: 'Uscita', color: COLORS.expense },
  { value: 'income', label: 'Entrata', color: COLORS.income },
  { value: 'saving', label: 'Risparmio', color: COLORS.saving },
];

export default function TypeSegmentedControl({ value, onChange }) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segment, active && { backgroundColor: opt.color }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.white,
  },
});
