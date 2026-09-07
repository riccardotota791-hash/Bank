import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DAY_TEMPLATE_LABELS, DAY_TEMPLATE_ORDER, DAY_TEMPLATES } from '../data/schedule';
import { DayTemplateId } from '../data/types';
import { colors, fonts, radius, spacing } from '../theme/theme';

const ICONS: Record<DayTemplateId, keyof typeof Ionicons.glyphMap> = {
  auto: 'sync-outline',
  work: DAY_TEMPLATES.work.icon as keyof typeof Ionicons.glyphMap,
  study: DAY_TEMPLATES.study.icon as keyof typeof Ionicons.glyphMap,
  free: DAY_TEMPLATES.free.icon as keyof typeof Ionicons.glyphMap,
  rest: DAY_TEMPLATES.rest.icon as keyof typeof Ionicons.glyphMap,
};

/**
 * Selettore del template di giornata: "Automatico" segue le regole per
 * giorno della settimana, gli altri sovrascrivono manualmente i moduli
 * attivi per la data corrente (es. "oggi lavoro da casa" anche se è martedì).
 */
export function TemplateSelector({
  value,
  onChange,
}: {
  value: DayTemplateId;
  onChange: (template: DayTemplateId) => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DAY_TEMPLATE_ORDER.map((id) => {
          const active = id === value;
          return (
            <Pressable
              key={id}
              onPress={() => onChange(id)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <Ionicons name={ICONS[id]} size={14} color={active ? colors.accent : colors.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {DAY_TEMPLATE_LABELS[id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -spacing.xs,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipText: {
    ...fonts.label,
    fontSize: 10,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
