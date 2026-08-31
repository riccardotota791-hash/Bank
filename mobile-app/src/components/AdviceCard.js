import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export default function AdviceCard({ message, tone = 'neutral' }) {
  const config = TONE_CONFIG[tone] || TONE_CONFIG.neutral;
  return (
    <View style={[styles.card, { backgroundColor: config.background }]}>
      <Ionicons name={config.icon} size={20} color={config.color} style={{ marginTop: 1 }} />
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </View>
  );
}

const TONE_CONFIG = {
  positive: { icon: 'checkmark-circle', color: COLORS.positive, background: COLORS.positiveLight, textColor: COLORS.textPrimary },
  warning: { icon: 'alert-circle', color: COLORS.negative, background: COLORS.negativeLight, textColor: COLORS.textPrimary },
  neutral: { icon: 'bulb-outline', color: COLORS.accent, background: COLORS.accentLight, textColor: COLORS.textPrimary },
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  text: {
    flex: 1,
    fontSize: FONT.small,
    lineHeight: 19,
  },
});
