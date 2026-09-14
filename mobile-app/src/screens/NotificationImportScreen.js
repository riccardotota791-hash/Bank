import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Platform, NativeModules, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, Badge } from '../components/UI';
import { COLORS, SPACING, FONT } from '../constants/theme';
import { getNotificationDebugLog } from '../services/notificationDebugLog';

const OUTCOME_LABELS = {
  importata: { text: 'Importata ✓', color: COLORS.positive },
  duplicato_ignorato: { text: 'Ignorata (già presente)', color: COLORS.textSecondary },
  non_riconosciuta: { text: 'Non riconosciuta', color: COLORS.negative },
  errore: { text: 'Errore', color: COLORS.negative },
  errore_parsing: { text: 'Errore di lettura', color: COLORS.negative },
};

function formatLogTime(iso) {
  try {
    return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

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
  const [debugLog, setDebugLog] = useState([]);

  const checkStatus = useCallback(async () => {
    if (!isSupported) return;
    const s = await RNAndroidNotificationListener.getPermissionStatus();
    setStatus(s);
    setDebugLog(await getNotificationDebugLog());
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
              <>
                <View style={[styles.noteBox, { backgroundColor: COLORS.positiveLight }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.positive} />
                  <Text style={styles.noteText}>
                    Attivo: da ora ogni pagamento IsyBank comparirà da confermare nella tab Movimenti.
                  </Text>
                </View>

                <View style={styles.noteBox}>
                  <Ionicons name="battery-charging-outline" size={18} color={COLORS.accent} />
                  <Text style={styles.noteText}>
                    Se una notifica non viene importata nonostante il permesso attivo, il motivo più comune sui
                    telefoni Honor/Magic OS è la gestione batteria che blocca l'app in background. Vai su
                    Impostazioni → Batteria → Avvio app → cerca "Risparmio Buffett" → disattiva "Gestisci
                    automaticamente" e abilita manualmente "Avvio automatico", "Avvio secondario" ed "Esecuzione
                    in background".
                  </Text>
                </View>

                <Card style={{ marginTop: SPACING.lg }}>
                  <Text style={styles.label}>Diagnostica ultime notifiche</Text>
                  <Text style={styles.hint}>
                    Ogni notifica che sembra un pagamento (arrivi qui in foreground o no) lascia una traccia,
                    anche quando non viene importata — utile per capire cosa è successo davvero.
                  </Text>
                  {debugLog.length === 0 ? (
                    <Text style={[styles.hint, { marginTop: SPACING.sm }]}>
                      Nessuna voce ancora. Se dopo un pagamento reale questa lista resta vuota, il task in
                      background probabilmente non viene proprio avviato dal telefono (vedi nota sopra sulla
                      batteria).
                    </Text>
                  ) : (
                    debugLog.map((entry, i) => {
                      const label = OUTCOME_LABELS[entry.outcome] || { text: entry.outcome, color: COLORS.textSecondary };
                      return (
                        <View key={i} style={[styles.logRow, i > 0 && styles.logRowBorder]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.logOutcome, { color: label.color }]}>{label.text}</Text>
                            {entry.detail ? (
                              <Text style={styles.logDetail} numberOfLines={1}>{entry.detail}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.logTime}>{formatLogTime(entry.at)}</Text>
                        </View>
                      );
                    })
                  )}
                </Card>
              </>
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
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  logRowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logOutcome: {
    fontSize: FONT.small,
    fontWeight: '700',
  },
  logDetail: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  logTime: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
});
