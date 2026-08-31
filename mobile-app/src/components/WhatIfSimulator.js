import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { futureValueMonthlySeries } from '../engine/calculations';
import { formatEuro } from '../utils/formatters';

export default function WhatIfSimulator({ initialMonthly = 300, initialYears = 10, initialRate = 6 }) {
  const [monthly, setMonthly] = useState(initialMonthly);
  const [years, setYears] = useState(initialYears);
  const [rate, setRate] = useState(initialRate);

  const result = useMemo(() => {
    const futureValue = futureValueMonthlySeries(monthly, rate, years);
    const contributed = monthly * years * 12;
    const interest = futureValue - contributed;
    return { futureValue, contributed, interest };
  }, [monthly, years, rate]);

  return (
    <View>
      <Stepper label="Risparmio mensile investito" value={monthly} unit="€" step={50} min={0} max={5000} onChange={setMonthly} />
      <Stepper label="Orizzonte temporale" value={years} unit="anni" step={1} min={1} max={40} onChange={setYears} />
      <Stepper label="Rendimento annuo atteso" value={rate} unit="%" step={0.5} min={0} max={12} decimals={1} onChange={setRate} />

      <View style={styles.resultCard}>
        <Text style={styles.resultLabel}>Patrimonio stimato tra {years} anni</Text>
        <Text style={styles.resultValue}>{formatEuro(result.futureValue)}</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownItem}>Versato: {formatEuro(result.contributed, true)}</Text>
          <Text style={[styles.breakdownItem, { color: COLORS.accent }]}>Interesse composto: {formatEuro(result.interest, true)}</Text>
        </View>
      </View>
    </View>
  );
}

function Stepper({ label, value, unit, step, min, max, decimals = 0, onChange }) {
  const displayValue = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperBtn} onPress={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>
          <Ionicons name="remove" size={16} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{displayValue}{unit}</Text>
        <Pressable style={styles.stepperBtn} onPress={() => onChange(Math.min(max, +(value + step).toFixed(2)))}>
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperRow: {
    marginBottom: SPACING.md,
  },
  stepperLabel: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 90,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  resultLabel: {
    fontSize: FONT.small,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
    gap: 6,
  },
  breakdownItem: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
