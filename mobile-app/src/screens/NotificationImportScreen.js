import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Platform, NativeModules, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, Badge } from '../components/UI';
import { COLORS, SPACING, FONT } from '../constants/theme';

const isSupported = Platform.OS === 'android' && !!NativeModules.RNAndroidNotificationListener;

// Import "lazy" tramite require: su iOS/Expo Go il modulo nativo non esiste,
// e importare il pacchetto a livello statico andrebbe comunque bene (l'API
// JS non lancia finché non la chiami), ma teniamo tutto condizionato per
// chiarezza.
let RNAndroidNotificationListener = null;
if (isSupported) {
  RNAndroidNotificationListener = require('react-native-android-notification-listener').default;
}

const STATUS_LABELS = {
  authorized: { text: 'Attivo', color: COLORS.positive, background: COLORS.positiveLight },
  denied: { text: 'Non attivo', color: COLORS.negative, background: COLORS.negativeLight },
  unknown: { text: 'Da verificare', color: COLORS.textSecondary, background: COLORS.background },
};

export default function NotificationImportScreen() {
  const [status, setStatus] = useState('unknown');

  const checkStatus = useCallback(async () => {
    if (!isSupported) return;
    const s = await RNAndroidNotificationListener.getPermissionStatus();
    setStatus(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkStatus();
    }, [checkStatus])
  );

  const handleActivate = () => {
    if (!isSupported) return;
    RNAndroidNotificationListener.requestPermission();
  };

  const badge = STATUS_LABELS[status] || STATUS_LABELS.unknown;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <SectionTitle style={{ marginBottom: 0 }}>Importa da notifiche bancarie</SectionTitle>
          {isSupported ? <Badge text={badge.text} color={badge.color} background={badge.background} /> : null}
        </View>

        <Text style={styles.description}>
          Quando arriva una notifica di pagamento da IsyBank ("Hai pagato X € con la carta... da NEGOZIO"),
          l'app la riconosce e la propone come movimento da confermare nella tab Movimenti — con importo,
          data e categoria già proposti, uno swipe e hai finito. Nessuna notifica viene salvata o inviata
          altrove: solo quelle che corrispondono esattamente al formato dei pagamenti IsyBank vengono lette,
          tutte le altre (messaggi, altre app, ecc.) sono ignorate.
        </Text>

        {!isSupported ? (
          <View style={styles.noteBox}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
            <Text style={styles.noteText}>
              {Platform.OS !== 'android'
                ? 'Disponibile solo su Android: iOS non permette a nessuna app di leggere le notifiche di altre app.'
                : "Disponibile solo nell'APK installato, non dentro Expo Go: qui il modulo nativo non è compilato."}
            </Text>
          </View>
        ) : (
          <>
            <Card style={{ marginTop: SPACING.lg }}>
              <Text style={styles.label}>Permesso "Accesso alle notifiche"</Text>
              <Text style={styles.hint}>
                Va concesso una volta sola dalle impostazioni di sistema di Android (Google lo protegge con uno
                schermo dedicato, non è possibile attivarlo direttamente dall'app). Cerca "Risparmio Buffett"
                nell'elenco e abilitalo.
              </Text>
              <PrimaryButton title="Apri impostazioni Android" onPress={handleActivate} style={{ marginTop: SPACING.md }} />
            </Card>

            {status === 'denied' ? (
              <View style={styles.noteBox}>
                <Ionicons name="warning-outline" size={18} color={COLORS.accent} />
                <Text style={styles.noteText}>
                  Se Android mostra "impostazioni con restrizioni" e il toggle risulta bloccato: è una protezione
                  di sicurezza per le app installate fuori dal Play Store. Vai su Impostazioni del telefono → App
                  → Risparmio Buffett → menu (⋮) in alto a destra → "Consenti autorizzazioni con restrizioni",
                  poi torna qui e riprova.
                </Text>
              </View>
            ) : null}

            {status === 'authorized' ? (
              <View style={[styles.noteBox, { backgroundColor: COLORS.positiveLight }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.positive} />
                <Text style={styles.noteText}>
                  Attivo: da ora ogni pagamento IsyBank comparirà da confermare nella tab Movimenti.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  label: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  hint: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
  noteBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: 14,
    marginTop: SPACING.lg,
  },
  noteText: {
    flex: 1,
    fontSize: FONT.tiny,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
});
