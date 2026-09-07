import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityDef } from '../data/schedule';
import { ActivityEntry, ActivityStatus } from '../data/types';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { LedDot } from './LedDot';
import { ProgressBar } from './ProgressBar';

interface Props {
  def: ActivityDef;
  entry?: ActivityEntry;
  subtitle?: string;
  onStatusChange: (status: ActivityStatus) => void;
  onValueChange?: (value: number) => void;
  onQuickAdd?: (deltaMl: number) => void;
  onReset?: () => void;
}

export function ActivityPanel({
  def,
  entry,
  subtitle,
  onStatusChange,
  onValueChange,
  onQuickAdd,
  onReset,
}: Props) {
  const status = entry?.status ?? 'pending';
  const done = status === 'done';
  const partial = status === 'partial';
  const value = entry?.value ?? 0;
  const [draft, setDraft] = useState(value > 0 ? String(value) : '');

  const commitValue = () => {
    const parsed = Math.max(0, Math.round(Number(draft) || 0));
    onValueChange?.(parsed);
  };

  const ledState = done ? 'on' : partial ? 'partial' : 'off';
  const panelStyle = [styles.panel, done && styles.panelDone, partial && styles.panelPartial];
  const titleColor = done ? colors.accent : partial ? colors.accentMid : colors.textSecondary;

  return (
    <View style={panelStyle}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Ionicons name={def.icon as any} size={18} color={titleColor} />
          <Text style={[styles.title, { color: done ? colors.accent : partial ? colors.accentMid : colors.textPrimary }]}>
            {def.label}
          </Text>
        </View>
        <LedDot state={ledState} />
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {def.kind === 'numeric' && (
        <>
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
            {typeof def.goal === 'number' && <Text style={styles.goal}>/ {def.goal} obiettivo</Text>}
          </View>
          {typeof def.goal === 'number' && def.goal > 0 && (
            <View style={styles.progressWrap}>
              <ProgressBar percent={(value / def.goal) * 100} />
            </View>
          )}
        </>
      )}

      {def.kind === 'counter' && (
        <>
          <View style={styles.numericRow}>
            <Text style={styles.counterValue}>{value}</Text>
            <Text style={styles.unit}>{def.unit}</Text>
            {typeof def.goal === 'number' && <Text style={styles.goal}>/ {def.goal} obiettivo</Text>}
          </View>
          {typeof def.goal === 'number' && def.goal > 0 && (
            <View style={styles.progressWrap}>
              <ProgressBar
                percent={(value / def.goal) * 100}
                color={done ? colors.accent : partial ? colors.accentMid : colors.accent}
              />
            </View>
          )}
          <View style={styles.quickAddRow}>
            {(def.quickAdd ?? [1]).map((qty) => (
              <Pressable
                key={qty}
                style={({ pressed }) => [styles.quickAddButton, pressed && styles.pressed]}
                onPress={() => onQuickAdd?.(qty)}
              >
                <Text style={styles.quickAddText}>
                  +{qty}
                  {def.unit === 'ml' ? 'ml' : ''}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
              onPress={onReset}
            >
              <Ionicons name="refresh-outline" size={14} color={colors.textMuted} />
            </Pressable>
          </View>
        </>
      )}

      {def.kind !== 'counter' && (
        <View style={styles.statusRow}>
          <Pressable
            onPress={() => onStatusChange(partial ? 'pending' : 'partial')}
            style={({ pressed }) => [
              styles.chip,
              partial && styles.chipPartialActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.chipText, partial && styles.chipTextPartialActive]}>IN CORSO</Text>
          </Pressable>
          <Pressable
            onPress={() => onStatusChange(done ? 'pending' : 'done')}
            style={({ pressed }) => [styles.chip, done && styles.chipDoneActive, pressed && styles.pressed]}
          >
            <Text style={[styles.chipText, done && styles.chipTextDoneActive]}>
              {done ? 'COMPLETATO' : 'FATTO'}
            </Text>
          </Pressable>
        </View>
      )}
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
  panelPartial: {
    borderColor: colors.accentMid,
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
    fontWeight: '700',
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
  counterValue: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
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
  quickAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: colors.accentSoft,
    paddingVertical: 10,
    alignItems: 'center',
  },
  quickAddText: {
    ...fonts.label,
    color: colors.accent,
    fontSize: 11,
  },
  resetButton: {
    width: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  chipPartialActive: {
    borderColor: colors.accentMid,
    backgroundColor: colors.accentMidSoft,
  },
  chipDoneActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  pressed: {
    opacity: 0.7,
  },
  chipText: {
    ...fonts.label,
    color: colors.textSecondary,
    fontSize: 10,
  },
  chipTextPartialActive: {
    color: colors.accentMid,
  },
  chipTextDoneActive: {
    color: colors.accent,
  },
});
