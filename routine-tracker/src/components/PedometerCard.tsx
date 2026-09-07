import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePedometer } from '../hooks/usePedometer';
import { colors, fonts, radius, spacing } from '../theme/theme';

/**
 * Card di sincronizzazione dal sensore passi del telefono, mostrata sopra il
 * modulo Camminata. Su iOS può leggere il totale passi di oggi direttamente;
 * su Android (limite di `expo-sensors`, vedi `usePedometer.ts`) mostra i
 * passi rilevati da quando questa schermata è aperta e li aggiunge al totale
 * su richiesta. Se il sensore non è disponibile il modulo resta comunque
 * utilizzabile con l'inserimento manuale già presente.
 */
export function PedometerCard({
  currentValue,
  onAdd,
  onSet,
}: {
  currentValue: number;
  onAdd: (delta: number) => void;
  onSet: (value: number) => void;
}) {
  const { checked, available, liveSteps, historicalSteps, resetLiveSteps, platform } = usePedometer();

  if (!checked) return null;

  if (!available) {
    return (
      <View style={styles.card}>
        <Ionicons name="hardware-chip-outline" size={14} color={colors.textMuted} />
        <Text style={styles.text}>Sensore passi non disponibile: usa l'inserimento manuale qui sotto.</Text>
      </View>
    );
  }

  if (platform === 'ios' && historicalSteps !== null) {
    const alreadySynced = currentValue === historicalSteps;
    return (
      <View style={styles.card}>
        <Ionicons name="footsteps-outline" size={14} color={colors.accent} />
        <Text style={styles.text}>Sensore: {historicalSteps} passi rilevati oggi.</Text>
        <Pressable
          style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
          onPress={() => onSet(historicalSteps)}
          disabled={alreadySynced}
        >
          <Text style={styles.syncText}>{alreadySynced ? 'SINCRONIZZATO' : 'SINCRONIZZA'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Ionicons name="footsteps-outline" size={14} color={colors.accent} />
      <Text style={styles.text}>Sensore: +{liveSteps} passi rilevati ora.</Text>
      <Pressable
        style={({ pressed }) => [styles.syncButton, pressed && styles.pressed]}
        onPress={() => {
          if (liveSteps <= 0) return;
          onAdd(liveSteps);
          resetLiveSteps();
        }}
        disabled={liveSteps <= 0}
      >
        <Text style={styles.syncText}>AGGIUNGI AL TOTALE</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 11,
    flexShrink: 1,
  },
  syncButton: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: colors.accentDim,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  syncText: {
    ...fonts.label,
    fontSize: 9,
    color: colors.accent,
  },
  pressed: {
    opacity: 0.6,
  },
});
