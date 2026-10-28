import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, SectionTitle, Card, PrimaryButton, SecondaryButton, EmptyState } from '../components/UI';
import { useApp } from '../context/AppContext';
import { getSubscriptions, allocateMonthlyShare, markSubscriptionPaid, monthlyShareOf } from '../db/subscriptionsRepo';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatEuro, formatDateLong } from '../utils/formatters';

const FREQUENCY_LABELS = {
  1: 'ogni mese',
  2: 'ogni 2 mesi',
  3: 'ogni 3 mesi',
  6: 'ogni 6 mesi',
  12: 'ogni 12 mesi',
};

export default function SubscriptionsScreen({ navigation }) {
  const { dataVersion, refresh } = useApp();
  const [subscriptions, setSubscriptions] = useState([]);

  const load = useCallback(async () => {
    setSubscriptions(await getSubscriptions());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, dataVersion])
  );

  const handleAllocate = async (sub) => {
    const share = await allocateMonthlyShare(sub);
    refresh();
    Alert.alert('Quota accantonata', `Messi da parte ${formatEuro(share)} per "${sub.name}".`);
  };

  const handleMarkPaid = (sub) => {
    Alert.alert(
      'Segnare come pagato?',
      `Verrà registrata una spesa di ${formatEuro(sub.amount)} in "${sub.category_name || 'Altro'}", ma non conterà come nuova spesa del mese: i soldi arrivano da quanto già accantonato finora.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Segna come pagato',
          onPress: async () => {
            await markSubscriptionPaid(sub);
            refresh();
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Per le spese grosse ma prevedibili (assicurazione, bollo, abbonamenti annuali...): ogni mese metti da
          parte una quota, e quando arriva la scadenza la paghi con quei soldi già accantonati — così non risulta
          come se avessi speso tutto in un colpo solo dal tuo stipendio di quel mese.
        </Text>

        <View style={styles.sectionHeader}>
          <SectionTitle style={{ marginBottom: 0 }}>I tuoi abbonamenti</SectionTitle>
          <Pressable onPress={() => navigation.navigate('SubscriptionForm', {})} hitSlop={10}>
            <Ionicons name="add-circle" size={26} color={COLORS.primary} />
          </Pressable>
        </View>

        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="calendar-outline" size={40} color={COLORS.textMuted} />}
            title="Nessun abbonamento ancora"
            subtitle='Tocca + per aggiungerne uno, ad esempio "Assicurazione macchina" a 380€ ogni 12 mesi.'
          />
        ) : (
          subscriptions.map((sub) => {
            const monthlyShare = monthlyShareOf(sub);
            const progress = sub.amount > 0 ? Math.min(1, sub.saved_amount / sub.amount) : 0;
            return (
              <Card key={sub.id} style={{ marginBottom: SPACING.md }}>
                <Pressable
                  style={styles.headerRow}
                  onPress={() => navigation.navigate('SubscriptionForm', { subscriptionId: sub.id })}
                >
                  <View style={[styles.iconCircle, { backgroundColor: `${sub.category_color || COLORS.neutral}22` }]}>
                    <Ionicons name={sub.category_icon || 'calendar-outline'} size={20} color={sub.category_color || COLORS.neutral} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>{sub.name}</Text>
                    <Text style={styles.subtitle}>
                      {formatEuro(sub.amount)} {FREQUENCY_LABELS[sub.frequency_months] || `ogni ${sub.frequency_months} mesi`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </Pressable>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>
                    Accantonato {formatEuro(sub.saved_amount)} di {formatEuro(sub.amount)}
                  </Text>
                  <Text style={styles.progressText}>Scade il {formatDateLong(sub.next_due_date)}</Text>
                </View>

                <View style={styles.actionsRow}>
                  <SecondaryButton
                    title={`Metti da parte ${formatEuro(monthlyShare)}`}
                    onPress={() => handleAllocate(sub)}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton title="Segna pagato" onPress={() => handleMarkPaid(sub)} style={{ flex: 1 }} />
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  description: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    marginTop: SPACING.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.saving,
    borderRadius: RADIUS.pill,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  progressText: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
});
