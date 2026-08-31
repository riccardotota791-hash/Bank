import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityDef } from '../data/schedule';
import { ActivityEntry } from '../data/types';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { LedDot } from './LedDot';
import { ProgressBar } from './ProgressBar';

interface Props {
  def: ActivityDef;
  entry?: ActivityEntry;
  subtitle?: string;
  goal?: number;
  onToggleDone: () => void;
  onValueChange?: (value: number) => void;
}

export function ActivityPanel({ def, entry, subtitle, goal, onToggleDone, onValueChange }: Props) {
  const done = !!entry?.done;
  const value = entry?.value ?? 0;
  const [draft, setDraft] = useState(value > 0 ? String(value) : '');

  const commitValue = () => {
    const parsed = Math.max(0, Math.round(Number(draft) || 0));
    onValueChange?.(parsed);
  };

  return (
    <View style={[styles.panel, done && styles.panelDone]}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons
            name={def.icon as any}
            size={18}
            color={done ? colors.accent : colors.textSecondary}
          />
          <Text style={[styles.title, done && styles.titleDone]}>{def.label}</Text>
        </View>
        <LedDot state={done ? 'on' : 'off'} />
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {def.hasNumericInput && (
        <View style={styles.numericRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onEndEditing={commitValue}
            onBlur={commitValue}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={styles.numericInput}
          />
          <Text style={styles.unit}>{def.unit}</Text>
          {typeof goal === 'number' && (
            <Text style={styles.goal}>/ {goal} obiettivo</Text>
          )}
        </View>
      )}

      {def.hasNumericInput && typeof goal === 'number' && goal > 0 && (
        <View style={styles.progressWrap}>
          <ProgressBar percent={(value / goal) * 100} />
        </View>
      )}

      <Pressable
        onPress={onToggleDone}
        style={({ pressed }) => [
          styles.toggle,
          done ? styles.toggleOn : styles.toggleOff,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.toggleText, done && styles.toggleTextOn]}>
          {done ? 'COMPLETATO' : 'SEGNA COME FATTO'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  panelDone: {
    borderColor: colors.accentDim,
    backgroundColor: colors.panelAlt,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...fonts.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  titleDone: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  numericRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  numericInput: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontWeight: '700',
    minWidth: 72,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    color: colors.textMuted,
    fontSize: 12,
  },
  goal: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 'auto',
  },
  progressWrap: {
    marginTop: -spacing.xs,
  },
  toggle: {
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  toggleOff: {
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  toggleOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  toggleText: {
    ...fonts.label,
    color: colors.textSecondary,
  },
  toggleTextOn: {
    color: colors.accent,
  },
});
