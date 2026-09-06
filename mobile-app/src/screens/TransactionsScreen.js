import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, EmptyState, SectionTitle } from '../components/UI';
import MonthSelector from '../components/MonthSelector';
import TransactionRow from '../components/TransactionRow';
import SwipeToConfirmRow from '../components/SwipeToConfirmRow';
import { useApp } from '../context/AppContext';
import { getTransactionsByRange, getTotalsForRange } from '../db/transactionsRepo';
import { getPendingImports } from '../db/pendingImportRepo';
import { confirmImport, rejectImport } from '../services/gmailService';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { currentFinancialMonthKey, getFinancialPeriodRange, formatEuro } from '../utils/formatters';

export default function TransactionsScreen({ navigation }) {
  const { dataVersion, refresh, settings } = useApp();
  const payday = settings?.payday ?? 27;
  const [monthKey, setMonthKey] = useState(() => currentFinancialMonthKey(payday));
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, saving: 0, net: 0 });
  const [pending, setPending] = useState([]);

  const range = getFinancialPeriodRange(monthKey, payday);

  const load = useCallback(async () => {
    const [tx, tot, pend] = await Promise.all([
      getTransactionsByRange(range),
      getTotalsForRange(range),
      settings?.gmailConnected ? getPendingImports() : Promise.resolve([]),
    ]);
    setTransactions(tx);
    setTotals(tot);
    setPending(pend);
  }, [range.start, range.end, settings?.gmailConnected]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  const handleConfirm = async (item) => {
    await confirmImport(item);
    refresh();
  };

  const handleReject = async (item) => {
    await rejectImport(item);
    refresh();
  };

  return (
    <ScreenContainer>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Movimenti</Text>
        <MonthSelector monthKey={monthKey} onChange={setMonthKey} />
        <Text style={styles.periodLabel}>
          {formatRangeLabel(range)}
        </Text>
        <View style={styles.totalsRow}>
          <Text style={[styles.totalItem, { color: COLORS.income }]}>+ {formatEuro(totals.income)}</Text>
          <Text style={[styles.totalItem, { color: COLORS.expense }]}>- {formatEuro(totals.expense)}</Text>
          <Text style={[styles.totalItem, { color: totals.net >= 0 ? COLORS.primary : COLORS.negative }]}>
            = {formatEuro(totals.net)}
          </Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          pending.length > 0 ? (
            <View style={{ marginBottom: SPACING.lg }}>
              <SectionTitle subtitle="Scorri a destra per confermare, a sinistra per ignorare">
                Da confermare ({pending.length})
              </SectionTitle>
              {pending.map((item) => (
                <SwipeToConfirmRow key={item.id} item={item} onConfirm={handleConfirm} onReject={handleReject} />
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TransactionRow transaction={item} onPress={(tx) => navigation.navigate('AddTransaction', { transactionId: tx.id })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          pending.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="receipt-outline" size={40} color={COLORS.textMuted} />}
              title="Nessun movimento questo periodo"
              subtitle="Tocca + per registrare la tua prima entrata o uscita."
            />
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('AddTransaction', { defaultDate: monthKey })}>
        <Ionicons name="add" size={28} color={COLORS.white} />
      </Pressable>
    </ScreenContainer>
  );
}

function formatRangeLabel(range) {
  const [, sm, sd] = range.start.split('-');
  const [, em, ed] = range.end.split('-');
  return `dal ${sd}/${sm} al ${ed}/${em}`;
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  periodLabel: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: SPACING.sm,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  totalItem: {
    fontWeight: '700',
    fontSize: FONT.small,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
