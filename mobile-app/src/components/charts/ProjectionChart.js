import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import { COLORS, FONT, SPACING } from '../../constants/theme';
import { formatEuro, formatCompactAmount } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

export default function ProjectionChart({ projections }) {
  if (!projections || projections.length === 0) return null;

  const data = {
    labels: projections.map((p) => `${p.years} anni`),
    legend: ['Versato', 'Interesse composto'],
    data: projections.map((p) => [Math.round(p.contributed), Math.round(Math.max(0, p.interestEarned))]),
    barColors: [COLORS.neutral, COLORS.accent],
  };

  return (
    <View>
      <StackedBarChart
        data={data}
        width={screenWidth - 64}
        height={230}
        hideLegend={false}
        fromZero
        chartConfig={{
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(31, 111, 80, ${opacity})`,
          labelColor: () => COLORS.textSecondary,
          propsForLabels: { fontSize: 10 },
        }}
        style={styles.chart}
      />
      <View style={styles.table}>
        {projections.map((p) => (
          <View key={p.years} style={styles.tableRow}>
            <Text style={styles.years}>{p.years} anni</Text>
            <Text style={styles.total}>{formatCompactAmount(p.futureValue)}</Text>
            <Text style={styles.detail}>versato {formatEuro(p.contributed, true)} · interessi {formatEuro(p.interestEarned, true)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  table: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  years: {
    width: 56,
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  total: {
    fontSize: FONT.body,
    fontWeight: '800',
    color: COLORS.primary,
    width: 70,
  },
  detail: {
    flex: 1,
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
  },
});
