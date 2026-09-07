import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../theme/theme';

/** Campo note espandibile e opzionale a fondo pagina: diario rapido di fine giornata. */
export function DailyNoteField({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [expanded, setExpanded] = useState(value.length > 0);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    if (draft !== value) onSave(draft);
  };

  if (!expanded) {
    return (
      <Pressable style={styles.collapsed} onPress={() => setExpanded(true)}>
        <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.collapsedText}>Aggiungi una nota per oggi</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Nota del giorno</Text>
        {draft.length === 0 && (
          <Pressable onPress={() => setExpanded(false)}>
            <Ionicons name="chevron-up-outline" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onEndEditing={commit}
        onBlur={commit}
        multiline
        placeholder='es. "Focus eccellente su CCNA", "corsa faticosa"...'
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  collapsedText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...fonts.label,
    color: colors.textSecondary,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
