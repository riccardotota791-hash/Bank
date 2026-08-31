import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { COLORS, FONT } from '../../constants/theme';
import { monthLabel } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

export default function MonthlyTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <Text style={styles.empty}>Nessun dato disponibile ancora.</Text>;
  }

  const chartData = {
    labels: data.map((d) => monthLabel(d.monthKey, true)),
    datasets: [{ data: data.map((d) => Math.round(d.net * 100) / 100) }],
  };

  return (
    <View>
      <BarChart
        data={chartData}
        width={screenWidth - 64}
        height={220}
        yAxisLabel=""
        yAxisSuffix="€"
        fromZero
        withInnerLines={false}
        showValuesOnTopOfBars
        chartConfig={{
          backgroundGradientFrom: COLORS.card,
          backgroundGradientTo: COLORS.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(31, 111, 80, ${opacity})`,
          labelColor: () => COLORS.textSecondary,
          barPercentage: 0.6,
          propsForLabels: { fontSize: 10 },
          propsForBackgroundLines: { stroke: COLORS.border },
        }}
        style={styles.chart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
    marginLeft: -16,
  },
  empty: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
