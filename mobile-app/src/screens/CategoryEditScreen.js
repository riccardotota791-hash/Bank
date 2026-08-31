import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, SectionTitle, PrimaryButton, DangerButton } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getCategoryById, createCategory, updateCategory, deleteCategory } from '../db/categoriesRepo';
import { ICON_CHOICES, COLOR_CHOICES } from '../constants/iconChoices';
import { CATEGORY_TYPE_LABELS } from '../constants/categories';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export default function CategoryEditScreen({ route, navigation }) {
  const { refresh } = useApp();
  const { categoryId, type } = route.params;
  const isEditing = !!categoryId;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [budget, setBudget] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Modifica categoria' : `Nuova categoria` });
  }, [isEditing, navigation]);

  useEffect(() => {
    if (isEditing) {
      (async () => {
        const cat = await getCategoryById(categoryId);
        if (cat) {
          setName(cat.name);
          setIcon(cat.icon);
          setColor(cat.color);
          setBudget(cat.monthly_budget ? String(cat.monthly_budget) : '');
          setIsDefault(!!cat.is_default);
        }
      })();
    }
  }, [isEditing, categoryId]);

  const handleSave = async () => {
    if (!name.trim()) return;
    const monthly_budget = budget ? parseFloat(budget.replace(',', '.')) : null;
    if (isEditing) {
      await updateCategory(categoryId, { name: name.trim(), icon, color, monthly_budget });
    } else {
      await createCategory({ name: name.trim(), type, icon, color, monthly_budget });
    }
    refresh();
    navigation.goBack();
  };

  const handleDelete = async () => {
    await deleteCategory(categoryId);
    refresh();
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.typeLabel}>{CATEGORY_TYPE_LABELS[type]}</Text>

        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="Nome categoria"
          placeholderTextColor={COLORS.textMuted}
        />

        {type === 'expense' ? (
          <TextInput
            style={styles.budgetInput}
            value={budget}
            onChangeText={setBudget}
            placeholder="Budget mensile (opzionale, €)"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="decimal-pad"
          />
        ) : null}

        <SectionTitle style={{ marginTop: SPACING.lg }}>Icona</SectionTitle>
        <View style={styles.grid}>
          {ICON_CHOICES.map((ic) => (
            <Pressable
              key={ic}
              style={[styles.iconOption, icon === ic && { backgroundColor: color, borderColor: color }]}
              onPress={() => setIcon(ic)}
            >
              <Ionicons name={ic} size={20} color={icon === ic ? COLORS.white : COLORS.textSecondary} />
            </Pressable>
          ))}
        </View>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Colore</SectionTitle>
        <View style={styles.grid}>
          {COLOR_CHOICES.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorOption, { backgroundColor: c }, color === c && styles.colorSelected]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <PrimaryButton title="Salva categoria" onPress={handleSave} disabled={!name.trim()} style={{ marginTop: SPACING.xl }} />

        {isEditing && !isDefault ? (
          <DangerButton title="Elimina categoria" onPress={handleDelete} style={{ marginTop: SPACING.md }} />
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  typeLabel: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  nameInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  budgetInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: COLORS.textPrimary,
  },
});
