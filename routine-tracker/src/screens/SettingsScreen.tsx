import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { TimePickerField } from '../components/TimePickerField';
import { sendTestNotification } from '../notifications/reminders';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, radius, spacing } from '../theme/theme';

export default function SettingsScreen() {
  const { settings, updateSettings } = useRoutineStore();

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

        <TimePickerField
          label="Orario promemoria generale"
          hint="Vale per tutti i moduli tranne Pillole"
          hour={settings.reminderHour}
          minute={settings.reminderMinute}
          onChange={(hour, minute) => updateSettings({ reminderHour: hour, reminderMinute: minute })}
        />

        <View style={styles.divider} />

        <TimePickerField
          label="Orario promemoria Pillole"
          hint="Indipendente dagli altri moduli"
          hour={settings.pillsReminderHour}
          minute={settings.pillsReminderMinute}
          onChange={(hour, minute) =>
            updateSettings({ pillsReminderHour: hour, pillsReminderMinute: minute })
          }
        />
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
