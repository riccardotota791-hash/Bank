import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, fonts, radius, spacing } from '../theme/theme';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Riga "orario" riutilizzabile basata sul TimePicker nativo della piattaforma:
 * su Android apre il dialog nativo, su iOS mostra il picker compatto inline.
 */
export function TimePickerField({
  label,
  hint,
  hour,
  minute,
  onChange,
}: {
  label: string;
  hint?: string;
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}) {
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const value = new Date();
  value.setHours(hour, minute, 0, 0);

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        onChange: (event, picked) => {
          if (event.type === 'set' && picked) {
            onChange(picked.getHours(), picked.getMinutes());
          }
        },
      });
    } else {
      setIosPickerOpen((open) => !open);
    }
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{label}</Text>
          {hint ? <Text style={styles.rowSub}>{hint}</Text> : null}
        </View>
        <Pressable style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]} onPress={openPicker}>
          <Text style={styles.timeText}>
            {pad(hour)}:{pad(minute)}
          </Text>
        </Pressable>
      </View>
      {Platform.OS === 'ios' && iosPickerOpen && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour
          display="spinner"
          themeVariant="dark"
          onChange={(event, picked) => {
            if (picked) onChange(picked.getHours(), picked.getMinutes());
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  rowTitle: {
    ...fonts.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  timeButton: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.accentDim,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  timeText: {
    color: colors.accent,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
});
