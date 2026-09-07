import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Achievement } from '../data/achievements';
import { colors, fonts, radius, spacing } from '../theme/theme';

/**
 * Griglia di badge/achievement: disattivati (semi-trasparenti, icona
 * spenta) finché non sbloccati, poi si illuminano con l'accento neon.
 */
export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <View style={styles.grid}>
      {achievements.map((a) => (
        <View key={a.id} style={[styles.badge, a.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
          <View style={[styles.iconWrap, a.unlocked && styles.iconWrapUnlocked]}>
            <Ionicons
              name={a.icon as any}
              size={22}
              color={a.unlocked ? colors.accent : colors.textMuted}
            />
          </View>
          <Text style={[styles.label, a.unlocked && styles.labelUnlocked]} numberOfLines={2}>
            {a.label}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {a.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    width: '31%',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  badgeLocked: {
    borderColor: colors.border,
    backgroundColor: colors.panel,
    opacity: 0.45,
  },
  badgeUnlocked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    opacity: 1,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapUnlocked: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  label: {
    ...fonts.label,
    fontSize: 9,
    textAlign: 'center',
    color: colors.textMuted,
    lineHeight: 12,
  },
  labelUnlocked: {
    color: colors.accent,
  },
  description: {
    color: colors.textMuted,
    fontSize: 8,
    textAlign: 'center',
    lineHeight: 11,
  },
});
