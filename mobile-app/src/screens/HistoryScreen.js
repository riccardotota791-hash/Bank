import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, EmptyState } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getAvailableMonths, getMonthlyTotals } from '../db/transactionsRepo';
import { computeSavingsRate } from '../engine/calculations';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { monthLabel, formatEuro, currentMonthKey } from '../utils/formatters';

export default function HistoryScreen({ navigation }) {
  const { dataVersion } = useApp();
  const [months, setMonths] = useState([]);

  const load = useCallback(async () => {
    let monthKeys = await getAvailableMonths();
    if (!monthKeys.includes(currentMonthKey())) monthKeys = [currentMonthKey(), ...monthKeys];
    const data = [];
    for (const key of monthKeys) {
      const totals = await getMonthlyTotals(key);
      data.push({ monthKey: key, ...totals, rate: computeSavingsRate(totals.income, totals.expense) });
    }
    setMonths(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  return (
    <ScreenContainer>
      <Text style={styles.title}>Storico</Text>
      <FlatList
        data={months}
        keyExtractor={(item) => item.monthKey}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('MonthDetail', { monthKey: item.monthKey })}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.monthText}>{monthLabel(item.monthKey)}</Text>
              <Text style={styles.rateText}>Tasso di risparmio: {item.rate.toFixed(0)}%</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.netText, { color: item.net >= 0 ? COLORS.positive : COLORS.negative }]}>
                {formatEuro(item.net)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />}
            title="Nessuno storico ancora"
            subtitle="Registra i tuoi movimenti mese dopo mese per costruire il tuo storico."
          />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginVertical: 4,
  },
  rowLeft: {},
  monthText: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  rateText: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netText: {
    fontSize: FONT.body,
    fontWeight: '800',
  },
  separator: {
    height: 4,
  },
});
