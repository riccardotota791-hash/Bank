import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Switch, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, DangerButton } from '../components/UI';
import { useApp } from '../context/AppContext';
import { resetAllData } from '../db/database';
import { rescheduleAllNotifications } from '../services/notifications';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

const WEEKDAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function SettingsScreen({ navigation }) {
  const { settings, updateSetting, refresh } = useApp();
  const [resetting, setResetting] = useState(false);
  const [initialSavingsInput, setInitialSavingsInput] = useState(null);

  if (!settings) return null;

  const initialSavingsValue = initialSavingsInput ?? String(settings.initialSavings || 0).replace('.', ',');

  const handleToggle = async (key, value) => {
    await updateSetting(key, value ? 'true' : 'false');
    await rescheduleAllNotifications();
  };

  const handleTargetChange = async (delta) => {
    const next = Math.max(35, Math.min(50, settings.savingsTargetPct + delta));
    await updateSetting('savings_target_pct', next);
  };

  const handleRateChange = async (delta) => {
    const next = Math.max(0, Math.min(12, +(settings.investmentReturnRate + delta).toFixed(1)));
    await updateSetting('investment_return_rate', next);
  };

  const handlePaydayChange = async (delta) => {
    const next = Math.max(1, Math.min(28, settings.payday + delta));
    await updateSetting('payday', next);
  };

  const handleInitialSavingsCommit = async () => {
    const parsed = parseFloat(initialSavingsInput?.replace(',', '.'));
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    await updateSetting('initial_savings', next);
    setInitialSavingsInput(null);
  };

  const handleReset = () => {
    Alert.alert(
      'Azzerare tutti i dati?',
      "Verranno eliminati tutti i movimenti, le categorie personalizzate e le impostazioni. L'operazione non è reversibile.",
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Azzera',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await resetAllData();
            refresh();
            setResetting(false);
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Impostazioni</Text>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Strategia di risparmio</SectionTitle>
        <Card>
          <SettingStepper
            label="Giorno di accredito stipendio"
            hint="Il mese finanziario va da questo giorno al giorno precedente del mese dopo"
            value={`${settings.payday}`}
            onDecrease={() => handlePaydayChange(-1)}
            onIncrease={() => handlePaydayChange(1)}
          />
          <View style={styles.divider} />
          <SettingStepper
            label="Soglia di risparmio consigliata"
            hint="Ricalibrata più alta (35-50%) perché non hai spese di casa"
            value={`${settings.savingsTargetPct}%`}
            onDecrease={() => handleTargetChange(-1)}
            onIncrease={() => handleTargetChange(1)}
          />
          <View style={styles.divider} />
          <SettingStepper
            label="Rendimento annuo atteso investimenti"
            hint="Usato per le proiezioni a interesse composto"
            value={`${settings.investmentReturnRate}%`}
            onDecrease={() => handleRateChange(-0.5)}
            onIncrease={() => handleRateChange(0.5)}
          />
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Risparmio già accumulato</Text>
              <Text style={styles.settingHint}>Da prima di usare l'app: si somma al risparmio calcolato mese per mese</Text>
            </View>
            <View style={styles.amountInputWrap}>
              <Text style={styles.amountPrefix}>€</Text>
              <TextInput
                style={styles.amountInput}
                value={initialSavingsValue}
                onChangeText={setInitialSavingsInput}
                onEndEditing={handleInitialSavingsCommit}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>
        </Card>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Notifiche</SectionTitle>
        <Card>
          <SettingSwitch
            label="Promemoria settimanale"
            hint={`Ogni ${WEEKDAYS[settings.weeklyReminderWeekday]} alle ${settings.weeklyReminderHour}:00`}
            value={settings.weeklyReminderEnabled}
            onChange={(v) => handleToggle('weekly_reminder_enabled', v)}
          />
          <View style={styles.divider} />
          <SettingSwitch
            label="Alert sforamento budget categoria"
            hint={`Avviso oltre il ${settings.budgetAlertThresholdPct}% del budget`}
            value={settings.budgetAlertEnabled}
            onChange={(v) => handleToggle('budget_alert_enabled', v)}
          />
          <View style={styles.divider} />
          <SettingSwitch
            label="Riepilogo di fine mese"
            hint="Risultato vs obiettivo e consiglio per il mese successivo"
            value={settings.monthlySummaryEnabled}
            onChange={(v) => handleToggle('monthly_summary_enabled', v)}
          />
        </Card>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Importazione automatica</SectionTitle>
        <Card>
          <NavRow
            icon="mail-outline"
            label="Collega Gmail"
            hint={settings.gmailConnected ? 'Connesso' : 'Non connesso — inserimento manuale attivo'}
            onPress={() => navigation.navigate('GmailSetup')}
          />
          <View style={styles.divider} />
          <NavRow
            icon="document-outline"
            label="Importa da file (Excel/CSV)"
            hint="Estratto conto scaricato dall'app della banca"
            onPress={() => navigation.navigate('ImportFile')}
          />
          <View style={styles.divider} />
          <NavRow
            icon="notifications-outline"
            label="Importa da notifiche bancarie"
            hint="Riconosce i pagamenti IsyBank in automatico (Android)"
            onPress={() => navigation.navigate('NotificationImport')}
          />
        </Card>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Personalizzazione</SectionTitle>
        <Card>
          <NavRow icon="pricetags-outline" label="Gestisci categorie" onPress={() => navigation.navigate('CategoryManager')} />
        </Card>

        <SectionTitle style={{ marginTop: SPACING.lg }}>Dati</SectionTitle>
        <DangerButton title={resetting ? 'Azzeramento...' : 'Azzera tutti i dati'} onPress={handleReset} />

        <View style={styles.aboutBlock}>
          <Text style={styles.aboutText}>
            Risparmio Buffett · app locale, nessun account. Tutti i dati restano sul tuo dispositivo.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function SettingStepper({ label, hint, value, onDecrease, onIncrease }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
      </View>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperBtn} onPress={onDecrease}>
          <Ionicons name="remove" size={16} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepperBtn} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );
}

function SettingSwitch({ label, hint, value, onChange }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.primary }} />
    </View>
  );
}

function NavRow({ icon, label, hint, onPress }) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: SPACING.sm }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  settingLabel: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingHint: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 46,
    textAlign: 'center',
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
  },
  amountPrefix: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  amountInput: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 70,
    textAlign: 'right',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  aboutBlock: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  aboutText: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
