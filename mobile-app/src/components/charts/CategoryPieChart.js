import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { COLORS, CHART_PALETTE, FONT } from '../../constants/theme';
import { formatEuro } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

export default function CategoryPieChart({ categories }) {
  const withData = (categories || []).filter((c) => c.total > 0);

  if (withData.length === 0) {
    return <Text style={styles.empty}>Ancora nessuna uscita registrata questo mese.</Text>;
  }

  const total = withData.reduce((sum, c) => sum + c.total, 0);
  const pieData = withData.map((c, i) => ({
    name: c.name,
    population: c.total,
    color: c.color || CHART_PALETTE[i % CHART_PALETTE.length],
    legendFontColor: COLORS.textSecondary,
    legendFontSize: 12,
  }));

  return (
    <View>
      <PieChart
        data={pieData}
        width={screenWidth - 64}
        height={190}
        chartConfig={{ color: () => COLORS.textPrimary }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="8"
        hasLegend={false}
      />
      <View style={styles.legend}>
        {withData
          .slice()
          .sort((a, b) => b.total - a.total)
          .map((c, i) => (
            <View key={c.category_id ?? i} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: c.color || CHART_PALETTE[i % CHART_PALETTE.length] }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>{c.name}</Text>
              <Text style={styles.legendValue}>{formatEuro(c.total)}</Text>
              <Text style={styles.legendPct}>{((c.total / total) * 100).toFixed(0)}%</Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    marginTop: 8,
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: FONT.small,
    color: COLORS.textPrimary,
  },
  legendValue: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  legendPct: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    width: 36,
    textAlign: 'right',
  },
  empty: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
