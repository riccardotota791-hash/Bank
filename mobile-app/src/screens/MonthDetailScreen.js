import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, EmptyState } from '../components/UI';
import TransactionRow from '../components/TransactionRow';
import { useApp } from '../context/AppContext';
import { getTransactionsByRange, getTotalsForRange } from '../db/transactionsRepo';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { monthLabel, formatEuro, getFinancialPeriodRange } from '../utils/formatters';

export default function MonthDetailScreen({ route, navigation }) {
  const { monthKey } = route.params;
  const { dataVersion, settings } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, saving: 0, net: 0 });
  const range = getFinancialPeriodRange(monthKey, settings?.payday ?? 27);

  useEffect(() => {
    navigation.setOptions({ title: monthLabel(monthKey) });
  }, [monthKey, navigation]);

  const load = useCallback(async () => {
    const [tx, tot] = await Promise.all([getTransactionsByRange(range), getTotalsForRange(range)]);
    setTransactions(tx);
    setTotals(tot);
  }, [range.start, range.end]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  return (
    <ScreenContainer>
      <View style={styles.totalsRow}>
        <Text style={[styles.totalItem, { color: COLORS.income }]}>+ {formatEuro(totals.income)}</Text>
        <Text style={[styles.totalItem, { color: COLORS.expense }]}>- {formatEuro(totals.expense)}</Text>
        <Text style={[styles.totalItem, { color: totals.net >= 0 ? COLORS.primary : COLORS.negative }]}>
          = {formatEuro(totals.net)}
        </Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TransactionRow transaction={item} onPress={(tx) => navigation.navigate('AddTransaction', { transactionId: tx.id })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState icon={<Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />} title="Nessun movimento in questo periodo" />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  totalItem: {
    fontWeight: '700',
    fontSize: FONT.small,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
