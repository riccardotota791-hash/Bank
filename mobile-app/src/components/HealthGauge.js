import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, FONT, SPACING } from '../constants/theme';
import { healthLabel } from '../engine/healthScore';

const SIZE = 130;
const STROKE = 12;
const RADIUS_C = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS_C;

export default function HealthGauge({ score, breakdown }) {
  const { label, color } = healthLabel(score);
  const progress = Math.max(0, Math.min(100, score)) / 100;
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={styles.container}>
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS_C}
            stroke={COLORS.border}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS_C}
            stroke={color}
            strokeWidth={STROKE}
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="none"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
      {breakdown ? (
        <View style={styles.breakdownRow}>
          <BreakdownItem label="Risparmio" value={breakdown.savingsScore} />
          <BreakdownItem label="Costanza" value={breakdown.consistencyScore} />
          <BreakdownItem label="Controllo" value={breakdown.overspendScore} />
        </View>
      ) : null}
    </View>
  );
}

function BreakdownItem({ label, value }) {
  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownValue}>{value}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  scoreText: {
    fontSize: 34,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scoreMax: {
    fontSize: FONT.small,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  label: {
    fontSize: FONT.body,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownValue: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  breakdownLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
  },
});
