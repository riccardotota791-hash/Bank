import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, SecondaryButton, DangerButton, Badge } from '../components/UI';
import { useApp } from '../context/AppContext';
import { GMAIL_SCOPES, GOOGLE_DISCOVERY } from '../constants/googleConfig';
import { saveClientId, getClientId } from '../services/tokenStorage';
import { completeGmailConnection, disconnectGmail, syncGmail } from '../services/gmailService';
import { countPendingImports } from '../db/pendingImportRepo';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function GmailSetupScreen() {
  const { settings, updateSetting, refresh } = useApp();
  const [clientId, setClientId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'risparmiobuffett' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: clientId || 'placeholder',
      scopes: GMAIL_SCOPES,
      redirectUri,
      responseType: 'code',
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    (async () => {
      const stored = await getClientId();
      if (stored) setClientId(stored);
      setPendingCount(await countPendingImports());
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (response?.type === 'success' && request?.codeVerifier) {
        try {
          const tokenResult = await AuthSession.exchangeCodeAsync(
            {
              clientId,
              code: response.params.code,
              redirectUri,
              extraParams: { code_verifier: request.codeVerifier },
            },
            GOOGLE_DISCOVERY
          );
          await completeGmailConnection(tokenResult);
          await updateSetting('gmail_connected', 'true');
          Alert.alert('Gmail collegato', 'Ora puoi sincronizzare le tue ricevute e notifiche bancarie.');
        } catch (e) {
          Alert.alert('Errore', "Impossibile completare il collegamento a Gmail. Verifica il Client ID inserito.");
        }
      } else if (response?.type === 'error') {
        Alert.alert('Errore', response.error?.message || 'Accesso a Google non riuscito.');
      }
    })();
  }, [response]);

  const handleSaveClientId = async (value) => {
    setClientId(value);
    await saveClientId(value);
  };

  const handleConnect = async () => {
    if (!clientId) {
      Alert.alert('Client ID mancante', 'Inserisci prima il tuo Google OAuth Client ID.');
      return;
    }
    await promptAsync();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncGmail();
      setPendingCount(await countPendingImports());
      refresh();
      Alert.alert('Sincronizzazione completata', `${count} nuovi movimenti trovati da confermare nella tab Movimenti.`);
    } catch (e) {
      Alert.alert('Errore sincronizzazione', e.message || 'Riprova più tardi.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectGmail();
    await updateSetting('gmail_connected', 'false');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <SectionTitle style={{ marginBottom: 0 }}>Collegamento Gmail</SectionTitle>
          <Badge
            text={settings?.gmailConnected ? 'Connesso' : 'Non connesso'}
            color={settings?.gmailConnected ? COLORS.positive : COLORS.textSecondary}
          />
        </View>
        <Text style={styles.description}>
          Intercetta automaticamente ricevute e notifiche bancarie dalla tua Gmail e le trasforma in movimenti
          già categorizzati, da confermare con uno swipe nella tab Movimenti. Funzione opzionale: se non la attivi,
          continui a inserire i movimenti a mano — l'app funziona comunque al 100%.
        </Text>

        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={styles.label}>Google OAuth Client ID</Text>
          <TextInput
            style={styles.input}
            value={clientId}
            onChangeText={handleSaveClientId}
            placeholder="xxxxxxxx.apps.googleusercontent.com"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>
            Crealo gratuitamente su console.cloud.google.com (tipo "iOS" o "Android"), abilita la Gmail API e usa lo
            scheme di redirect "risparmiobuffett". Nessuna credenziale è inclusa nell'app per motivi di sicurezza.
          </Text>
        </Card>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.accent} />
          <Text style={styles.noteText}>
            Il flusso OAuth con redirect personalizzato richiede una development build (expo-dev-client) o una build
            standalone: dentro Expo Go il collegamento reale a Google potrebbe non completarsi. Il resto dell'app
            funziona sempre perfettamente in Expo Go.
          </Text>
        </View>

        {settings?.gmailConnected ? (
          <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
            <SecondaryButton title={syncing ? 'Sincronizzazione...' : 'Sincronizza ora'} onPress={handleSync} disabled={syncing} />
            {pendingCount > 0 ? (
              <Text style={styles.pendingText}>{pendingCount} movimenti in attesa di conferma nella tab Movimenti.</Text>
            ) : null}
            <DangerButton title="Disconnetti Gmail" onPress={handleDisconnect} />
          </View>
        ) : (
          <PrimaryButton title="Connetti Gmail" onPress={handleConnect} disabled={!request} style={{ marginTop: SPACING.lg }} />
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
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    fontSize: FONT.small,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hint: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  noteBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  noteText: {
    flex: 1,
    fontSize: FONT.tiny,
    color: COLORS.textPrimary,
    lineHeight: 16,
  },
  pendingText: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
