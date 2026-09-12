import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, EmptyState, SecondaryButton } from '../components/UI';
import CategoryGrid from '../components/CategoryGrid';
import TransactionRow from '../components/TransactionRow';
import { searchTransactions } from '../db/transactionsRepo';
import { getAllCategories } from '../db/categoriesRepo';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatEuro, formatDateIT } from '../utils/formatters';

const TYPE_OPTIONS = [
  { value: null, label: 'Tutti' },
  { value: 'expense', label: 'Uscite' },
  { value: 'income', label: 'Entrate' },
  { value: 'saving', label: 'Risparmio' },
];

export default function SearchTransactionsScreen({ navigation }) {
  const [text, setText] = useState('');
  const [type, setType] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null);

  useEffect(() => {
    getAllCategories().then(setCategories);
  }, []);

  const visibleCategories = useMemo(
    () => (type ? categories.filter((c) => c.type === type) : categories),
    [categories, type]
  );

  const activeFilterCount = [type, categoryId, minAmount, maxAmount, startDate, endDate].filter(
    (v) => v !== null && v !== ''
  ).length;

  const runSearch = useCallback(async () => {
    const min = parseFloat(minAmount.replace(',', '.'));
    const max = parseFloat(maxAmount.replace(',', '.'));
    const rows = await searchTransactions({
      text,
      type,
      categoryId,
      minAmount: Number.isFinite(min) ? min : null,
      maxAmount: Number.isFinite(max) ? max : null,
      startDate: startDate ? startDate.toISOString().slice(0, 10) : null,
      endDate: endDate ? endDate.toISOString().slice(0, 10) : null,
    });
    setResults(rows);
  }, [text, type, categoryId, minAmount, maxAmount, startDate, endDate]);

  useEffect(() => {
    const hasAnyFilter = text.trim() || type || categoryId != null || minAmount || maxAmount || startDate || endDate;
    if (!hasAnyFilter) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [runSearch, text, type, categoryId, minAmount, maxAmount, startDate, endDate]);

  const handleClearFilters = () => {
    setType(null);
    setCategoryId(null);
    setMinAmount('');
    setMaxAmount('');
    setStartDate(null);
    setEndDate(null);
  };

  const totals = useMemo(() => {
    if (!results) return null;
    return results.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] || 0) + r.amount;
        return acc;
      },
      { income: 0, expense: 0, saving: 0 }
    );
  }, [results]);

  return (
    <ScreenContainer>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={text}
          onChangeText={setText}
          placeholder="Cerca per nota o categoria..."
          placeholderTextColor={COLORS.textMuted}
          autoFocus
        />
        {text ? (
          <Pressable onPress={() => setText('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Pressable style={styles.filtersToggle} onPress={() => setFiltersOpen((v) => !v)}>
        <Text style={styles.filtersToggleText}>
          Filtri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Text>
        <Ionicons name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
      </Pressable>

      {filtersOpen ? (
        <View style={styles.filtersPanel}>
          <View style={styles.chipRow}>
            {TYPE_OPTIONS.map((opt) => (
              <Pressable
                key={String(opt.value)}
                onPress={() => {
                  setType(opt.value);
                  setCategoryId(null);
                }}
                style={[styles.typeChip, type === opt.value && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipText, type === opt.value && styles.typeChipTextSelected]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          {visibleCategories.length > 0 ? (
            <View style={{ marginTop: SPACING.md }}>
              <CategoryGrid
                categories={visibleCategories}
                selectedId={categoryId}
                onSelect={(id) => setCategoryId(id === categoryId ? null : id)}
              />
            </View>
          ) : null}

          <View style={styles.amountRow}>
            <View style={styles.amountField}>
              <Text style={styles.fieldLabel}>Importo min €</Text>
              <TextInput
                style={styles.amountInput}
                value={minAmount}
                onChangeText={setMinAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.amountField}>
              <Text style={styles.fieldLabel}>Importo max €</Text>
              <TextInput
                style={styles.amountInput}
                value={maxAmount}
                onChangeText={setMaxAmount}
                keyboardType="decimal-pad"
                placeholder="Nessun limite"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          <View style={styles.amountRow}>
            <Pressable style={styles.dateField} onPress={() => setShowStartPicker(true)}>
              <Text style={styles.fieldLabel}>Dal</Text>
              <Text style={styles.dateValue}>{startDate ? formatDateIT(startDate.toISOString().slice(0, 10)) : 'Sempre'}</Text>
            </Pressable>
            <Pressable style={styles.dateField} onPress={() => setShowEndPicker(true)}>
              <Text style={styles.fieldLabel}>Al</Text>
              <Text style={styles.dateValue}>{endDate ? formatDateIT(endDate.toISOString().slice(0, 10)) : 'Oggi'}</Text>
            </Pressable>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selected) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (selected) setStartDate(selected);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selected) => {
                setShowEndPicker(Platform.OS === 'ios');
                if (selected) setEndDate(selected);
              }}
            />
          )}

          {activeFilterCount > 0 ? (
            <SecondaryButton title="Cancella filtri" onPress={handleClearFilters} style={{ marginTop: SPACING.md }} />
          ) : null}
        </View>
      ) : null}

      {results && totals ? (
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsCount}>{results.length} risultati</Text>
          <View style={styles.resultsTotals}>
            {totals.income > 0 ? <Text style={[styles.resultsTotal, { color: COLORS.income }]}>+{formatEuro(totals.income)}</Text> : null}
            {totals.expense > 0 ? <Text style={[styles.resultsTotal, { color: COLORS.expense }]}>-{formatEuro(totals.expense)}</Text> : null}
            {totals.saving > 0 ? <Text style={[styles.resultsTotal, { color: COLORS.saving }]}>{formatEuro(totals.saving)}</Text> : null}
          </View>
        </View>
      ) : null}

      <FlatList
        data={results || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TransactionRow transaction={item} onPress={(tx) => navigation.navigate('AddTransaction', { transactionId: tx.id })} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          results !== null ? (
            <EmptyState
              icon={<Ionicons name="search-outline" size={40} color={COLORS.textMuted} />}
              title="Nessun movimento trovato"
              subtitle="Prova a modificare testo o filtri."
            />
          ) : (
            <EmptyState
              icon={<Ionicons name="filter-outline" size={40} color={COLORS.textMuted} />}
              title="Cerca nella tua cronologia"
              subtitle="Scrivi un testo o apri i filtri per categoria, importo o data."
            />
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    paddingVertical: SPACING.sm + 2,
  },
  filtersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
  },
  filtersToggleText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.small,
  },
  filtersPanel: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  typeChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  typeChipTextSelected: {
    color: COLORS.white,
  },
  amountRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  amountField: {
    flex: 1,
  },
  dateField: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT.tiny,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  amountInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    fontSize: FONT.small,
    color: COLORS.textPrimary,
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  resultsCount: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  resultsTotals: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  resultsTotal: {
    fontSize: FONT.small,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
  },
});
