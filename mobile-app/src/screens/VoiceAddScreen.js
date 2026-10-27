import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { ScreenContainer, Card, SectionTitle, PrimaryButton, SecondaryButton, Badge } from '../components/UI';
import { COLORS, SPACING, FONT, RADIUS } from '../constants/theme';
import { parseVoiceTransaction } from '../utils/voiceParser';
import { getCategoriesByType } from '../db/categoriesRepo';

const TYPE_LABELS = { expense: 'Uscita', income: 'Entrata', saving: 'Risparmio' };
const TYPE_COLORS = { expense: COLORS.expense, income: COLORS.income, saving: COLORS.saving };

export default function VoiceAddScreen({ navigation }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState(null);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState(null);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript;
    if (text) setTranscript(text);
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    // "no-speech" capita semplicemente se l'utente non dice nulla o smette
    // di parlare: non è un vero errore da mostrare.
    if (event.error === 'no-speech') return;
    setError('Non ho capito bene. Riprova parlando chiaramente vicino al microfono.');
  });

  useEffect(() => {
    if (!transcript) return;
    let cancelled = false;
    (async () => {
      const result = parseVoiceTransaction(transcript);
      if (!result) {
        setError('Non ho capito un importo in quello che hai detto. Prova ad esempio "Speso 12 euro al bar".');
        setParsed(null);
        setCategory(null);
        return;
      }
      setError(null);
      const categories = await getCategoriesByType(result.type);
      if (cancelled) return;
      const match = categories.find((c) => c.name === result.categoryName) || categories[0] || null;
      setCategory(match);
      setParsed(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [transcript]);

  const resetState = useCallback(() => {
    setTranscript('');
    setParsed(null);
    setCategory(null);
    setError(null);
  }, []);

  const handleStart = useCallback(async () => {
    resetState();
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Serve il permesso del microfono per usare il comando vocale.');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'it-IT',
      interimResults: false,
      continuous: false,
    });
  }, [resetState]);

  const handleStop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const handleConfirm = useCallback(() => {
    if (!parsed) return;
    navigation.replace('AddTransaction', {
      prefill: {
        type: parsed.type,
        amount: parsed.amount,
        categoryId: category?.id ?? null,
        note: parsed.note || '',
      },
    });
  }, [parsed, category, navigation]);

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <SectionTitle subtitle="Dì a voce cosa hai speso, guadagnato o risparmiato">Aggiungi a voce</SectionTitle>

        <View style={styles.micWrap}>
          <Pressable
            style={[styles.micButton, listening && styles.micButtonActive]}
            onPress={listening ? handleStop : handleStart}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={40} color={COLORS.white} />
          </Pressable>
          <Text style={styles.hint}>
            {listening
              ? 'Ti ascolto...'
              : 'Tocca e parla, ad esempio "Speso 15 euro al supermercato"'}
          </Text>
        </View>

        {transcript ? (
          <Card style={{ marginTop: SPACING.lg }}>
            <Text style={styles.label}>Ho sentito</Text>
            <Text style={styles.transcript}>"{transcript}"</Text>
          </Card>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={COLORS.negative} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {parsed ? (
          <Card style={{ marginTop: SPACING.md }}>
            <View style={styles.resultRow}>
              <Text style={[styles.resultAmount, { color: TYPE_COLORS[parsed.type] }]}>
                {parsed.type === 'expense' ? '-' : '+'}
                {parsed.amount.toFixed(2)}€
              </Text>
              <Badge text={TYPE_LABELS[parsed.type]} color={TYPE_COLORS[parsed.type]} background={COLORS.background} />
            </View>

            <View style={styles.categoryChip}>
              {category ? (
                <Ionicons name={category.icon} size={16} color={category.color} style={{ marginRight: 6 }} />
              ) : null}
              <Text style={styles.categoryChipText}>{category?.name || 'Altro'}</Text>
            </View>

            {parsed.note ? <Text style={styles.noteText}>{parsed.note}</Text> : null}

            <PrimaryButton title="Rivedi e salva" onPress={handleConfirm} style={{ marginTop: SPACING.lg }} />
            <SecondaryButton title="Riprova" onPress={resetState} style={{ marginTop: SPACING.sm }} />
          </Card>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  micWrap: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  micButtonActive: {
    backgroundColor: COLORS.negative,
  },
  hint: {
    marginTop: SPACING.md,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  label: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  transcript: {
    marginTop: SPACING.xs,
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  errorBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.negativeLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
  },
  errorText: {
    flex: 1,
    fontSize: FONT.small,
    color: COLORS.textPrimary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultAmount: {
    fontSize: FONT.h1,
    fontWeight: '800',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipText: {
    fontSize: FONT.small,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  noteText: {
    marginTop: SPACING.sm,
    fontSize: FONT.small,
    color: COLORS.textSecondary,
  },
});
