import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, SectionTitle, Card } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getAllCategories } from '../db/categoriesRepo';
import { CATEGORY_TYPE_LABELS } from '../constants/categories';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export default function CategoryManagerScreen({ navigation }) {
  const { dataVersion } = useApp();
  const [categories, setCategories] = useState([]);

  const load = useCallback(async () => {
    setCategories(await getAllCategories());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  const grouped = ['income', 'expense', 'saving'].map((type) => ({
    type,
    items: categories.filter((c) => c.type === type),
  }));

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        {grouped.map((group) => (
          <View key={group.type} style={{ marginBottom: SPACING.lg }}>
            <View style={styles.sectionHeader}>
              <SectionTitle style={{ marginBottom: 0 }}>{CATEGORY_TYPE_LABELS[group.type]}</SectionTitle>
              <Pressable onPress={() => navigation.navigate('CategoryEdit', { type: group.type })} hitSlop={10}>
                <Ionicons name="add-circle" size={26} color={COLORS.primary} />
              </Pressable>
            </View>
            <Card style={{ padding: 0 }}>
              {group.items.map((cat, i) => (
                <Pressable
                  key={cat.id}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                  onPress={() => navigation.navigate('CategoryEdit', { categoryId: cat.id, type: cat.type })}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${cat.color}22` }]}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <Text style={styles.name} numberOfLines={1}>{cat.name}</Text>
                  {cat.monthly_budget ? <Text style={styles.budget}>Budget {cat.monthly_budget}€</Text> : null}
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  budget: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
});
