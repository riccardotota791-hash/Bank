import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenContainer, SectionTitle, PrimaryButton, DangerButton } from '../components/UI';
import CategoryGrid from '../components/CategoryGrid';
import { useApp } from '../context/AppContext';
import { getCategoriesByType } from '../db/categoriesRepo';
import { getSubscriptionById, addSubscription, updateSubscription, deleteSubscription } from '../db/subscriptionsRepo';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatDateLong, todayISODate } from '../utils/formatters';

const FREQUENCY_OPTIONS = [
  { months: 1, label: 'Ogni mese' },
  { months: 2, label: 'Ogni 2 mesi' },
  { months: 3, label: 'Ogni 3 mesi' },
  { months: 6, label: 'Ogni 6 mesi' },
  { months: 12, label: 'Ogni 12 mesi' },
];

export default function SubscriptionFormScreen({ route, navigation }) {
  const { refresh } = useApp();
  const editingId = route.params?.subscriptionId;
  const isEditing = !!editingId;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequencyMonths, setFrequencyMonths] = useState(12);
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [nextDueDate, setNextDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifica abbonamento' : 'Nuovo abbonamento' });
  }, [isEditing, navigation]);

  useEffect(() => {
    (async () => {
      const cats = await getCategoriesByType('expense');
      setCategories(cats);
      setCategoryId((current) => (cats.find((c) => c.id === current) ? current : cats[0]?.id ?? null));
    })();
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      const sub = await getSubscriptionById(editingId);
      if (sub) {
        setName(sub.name);
        setAmount(String(sub.amount).replace('.', ','));
        setFrequencyMonths(sub.frequency_months);
        setCategoryId(sub.category_id);
        setNextDueDate(new Date(`${sub.next_due_date}T12:00:00`));
      }
    })();
  }, [isEditing, editingId]);

  const numericAmount = parseFloat(amount.replace(',', '.'));
  const isValid = name.trim() && numericAmount > 0 && categoryId;

  const handleSave = async () => {
    if (!isValid) return;
    const payload = {
      name: name.trim(),
      categoryId,
      amount: numericAmount,
      frequencyMonths,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
    };
    if (isEditing) {
      await updateSubscription(editingId, payload);
    } else {
      await addSubscription(payload);
    }
    refresh();
    navigation.goBack();
  };

  const handleDelete = async () => {
    await deleteSubscription(editingId);
    refresh();
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle subtitle='Es. "Assicurazione macchina", 380€ ogni 12 mesi'>Nome</SectionTitle>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nome abbonamento"
          placeholderTextColor={COLORS.textMuted}
        />

        <SectionTitle style={{ marginTop: SPACING.lg }}>Importo alla scadenza</SectionTitle>
        <View style={styles.amountRow}>
          <Text style={styles.currencySymbol}>€</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Ogni quanto arriva</SectionTitle>
        <View style={styles.chipRow}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.months}
              onPress={() => setFrequencyMonths(opt.months)}
              style={[styles.chip, frequencyMonths === opt.months && styles.chipSelected]}
            >
              <Text style={[styles.chipText, frequencyMonths === opt.months && styles.chipTextSelected]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        {numericAmount > 0 && frequencyMonths > 0 ? (
          <Text style={styles.hint}>
            Quota da mettere da parte ogni mese: {(numericAmount / frequencyMonths).toFixed(2).replace('.', ',')}€
          </Text>
        ) : null}

        <SectionTitle style={{ marginTop: SPACING.lg }}>Categoria di spesa</SectionTitle>
        <CategoryGrid categories={categories} selectedId={categoryId} onSelect={setCategoryId} />

        <SectionTitle style={{ marginTop: SPACING.lg }}>Prossima scadenza</SectionTitle>
        <Pressable style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
          <Text style={styles.dateText}>{formatDateLong(nextDueDate.toISOString().slice(0, 10))}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={nextDueDate}
            mode="date"
            minimumDate={new Date(todayISODate())}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, selected) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selected) setNextDueDate(selected);
            }}
          />
        )}

        <PrimaryButton
          title={isEditing ? 'Salva modifiche' : 'Aggiungi abbonamento'}
          onPress={handleSave}
          disabled={!isValid}
          style={{ marginTop: SPACING.xl }}
        />

        {isEditing ? <DangerButton title="Elimina abbonamento" onPress={handleDelete} style={{ marginTop: SPACING.md }} /> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencySymbol: {
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  amountInput: {
    flex: 1,
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
    paddingVertical: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT.small,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: COLORS.white,
  },
  hint: {
    marginTop: SPACING.sm,
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
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
});
