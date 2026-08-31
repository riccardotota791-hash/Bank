import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenContainer, SectionTitle, PrimaryButton, DangerButton } from '../components/UI';
import TypeSegmentedControl from '../components/TypeSegmentedControl';
import CategoryGrid from '../components/CategoryGrid';
import { useApp } from '../context/AppContext';
import { getCategoriesByType, getCategoryById } from '../db/categoriesRepo';
import { addTransaction, updateTransaction, deleteTransaction, getTransactionById, getCategoryTotalsForMonth } from '../db/transactionsRepo';
import { checkBudgetAlert } from '../services/notifications';
import { COLORS, SPACING, FONT, RADIUS } from '../constants/theme';
import { formatDateLong, monthKeyOf } from '../utils/formatters';

export default function AddTransactionScreen({ route, navigation }) {
  const { refresh, settings } = useApp();
  const editingId = route.params?.transactionId;
  const isEditing = !!editingId;

  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    const defaultMonth = route.params?.defaultDate;
    if (!defaultMonth) return new Date();
    const now = new Date();
    const [y, m] = defaultMonth.split('-').map(Number);
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    return isCurrentMonth ? now : new Date(y, m - 1, 1, 12);
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifica movimento' : 'Nuovo movimento' });
  }, [isEditing, navigation]);

  useEffect(() => {
    (async () => {
      const cats = await getCategoriesByType(type);
      setCategories(cats);
      setCategoryId((current) => (cats.find((c) => c.id === current) ? current : cats[0]?.id ?? null));
    })();
  }, [type]);

  useEffect(() => {
    if (isEditing) {
      (async () => {
        const tx = await getTransactionById(editingId);
        if (tx) {
          setType(tx.type);
          setAmount(String(tx.amount));
          setCategoryId(tx.category_id);
          setNote(tx.note || '');
          setDate(new Date(`${tx.date}T12:00:00`));
        }
      })();
    }
  }, [isEditing, editingId]);

  const handleSave = useCallback(async () => {
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!numericAmount || numericAmount <= 0) {
      return;
    }
    setSaving(true);
    const dateStr = date.toISOString().slice(0, 10);
    try {
      if (isEditing) {
        await updateTransaction(editingId, { amount: numericAmount, type, category_id: categoryId, note, date: dateStr });
      } else {
        await addTransaction({ amount: numericAmount, type, category_id: categoryId, note, date: dateStr, source: 'manual' });
      }
      refresh();
      if (type === 'expense' && categoryId && settings) {
        const category = await getCategoryById(categoryId);
        const rows = await getCategoryTotalsForMonth(monthKeyOf(dateStr), 'expense');
        const row = rows.find((r) => r.category_id === categoryId);
        if (category && row) {
          checkBudgetAlert({ category, monthTotalForCategory: row.total, settings }).catch(() => {});
        }
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }, [amount, type, categoryId, note, date, isEditing, editingId, navigation, refresh, settings]);

  const handleDelete = useCallback(async () => {
    await deleteTransaction(editingId);
    refresh();
    navigation.goBack();
  }, [editingId, navigation, refresh]);

  const isValid = amount && parseFloat(amount.replace(',', '.')) > 0 && categoryId;

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TypeSegmentedControl value={type} onChange={setType} />

          <View style={styles.amountBlock}>
            <Text style={styles.currencySymbol}>€</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              autoFocus={!isEditing}
            />
          </View>

          <SectionTitle>Categoria</SectionTitle>
          <CategoryGrid categories={categories} selectedId={categoryId} onSelect={setCategoryId} />

          <SectionTitle style={{ marginTop: SPACING.lg }}>Data</SectionTitle>
          <Pressable style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.dateText}>{formatDateLong(date.toISOString().slice(0, 10))}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) setDate(selected);
              }}
            />
          )}

          <SectionTitle style={{ marginTop: SPACING.lg }}>Nota (opzionale)</SectionTitle>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Es. Cena con amici"
            placeholderTextColor={COLORS.textMuted}
          />

          <PrimaryButton
            title={isEditing ? 'Salva modifiche' : 'Aggiungi movimento'}
            onPress={handleSave}
            disabled={!isValid || saving}
            style={{ marginTop: SPACING.xl }}
          />

          {isEditing ? (
            <DangerButton title="Elimina movimento" onPress={handleDelete} style={{ marginTop: SPACING.md }} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  amountBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xl,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 140,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  noteInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
