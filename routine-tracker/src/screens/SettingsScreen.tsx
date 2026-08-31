import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { sendTestNotification } from '../notifications/reminders';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default function SettingsScreen() {
  const { settings, updateSettings } = useRoutineStore();
  const [hourDraft, setHourDraft] = useState(String(settings.reminderHour).padStart(2, '0'));
  const [minuteDraft, setMinuteDraft] = useState(String(settings.reminderMinute).padStart(2, '0'));

  const commitTime = () => {
    const hour = Math.min(23, Math.max(0, Number(hourDraft) || 0));
    const minute = Math.min(59, Math.max(0, Number(minuteDraft) || 0));
    setHourDraft(String(hour).padStart(2, '0'));
    setMinuteDraft(String(minute).padStart(2, '0'));
    updateSettings({ reminderHour: hour, reminderMinute: minute });
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Promemoria" hint="Notifiche locali" />

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Notifiche attive</Text>
            <Text style={styles.rowSub}>Un promemoria al giorno con i moduli previsti</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
            trackColor={{ false: colors.border, true: colors.accentDim }}
            thumbColor={settings.notificationsEnabled ? colors.accent : colors.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Orario promemoria</Text>
            <Text style={styles.rowSub}>Formato 24h</Text>
          </View>
          <View style={styles.timeRow}>
            <TextInput
              value={hourDraft}
              onChangeText={setHourDraft}
              onEndEditing={commitTime}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.timeInput}
            />
            <Text style={styles.timeSep}>:</Text>
            <TextInput
              value={minuteDraft}
              onChangeText={setMinuteDraft}
              onEndEditing={commitTime}
              keyboardType="number-pad"
              maxLength={2}
              style={styles.timeInput}
            />
          </View>
        </View>
      </View>

      <Pressable
        style={styles.testButton}
        onPress={async () => {
          await sendTestNotification();
          Alert.alert('Notifica inviata', 'Controlla il centro notifiche del telefono.');
        }}
      >
        <Text style={styles.testButtonText}>INVIA NOTIFICA DI PROVA</Text>
      </Pressable>

      <SectionHeader title="Informazioni" />
      <View style={styles.card}>
        <Text style={styles.infoText}>
          Tutti i dati (attività, passi, pagine, progressi CCNA) sono salvati solo su questo
          dispositivo tramite AsyncStorage. Non è previsto alcun account né sincronizzazione
          cloud.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeInput: {
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    width: 44,
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  timeSep: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  testButton: {
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testButtonText: {
    ...fonts.label,
    color: colors.accent,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
