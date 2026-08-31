import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export function ScreenContainer({ children, style, scroll = false }) {
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, style, subtitle }) {
  return (
    <View style={[{ marginBottom: SPACING.sm }, style]}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, style, icon }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && { opacity: 0.85 },
        style,
      ]}
    >
      {icon}
      <Text style={styles.primaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, style, textStyle, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.7 }, disabled && styles.disabledButton, style]}
    >
      <Text style={[styles.secondaryButtonText, textStyle]}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({ title, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.dangerButton, pressed && { opacity: 0.8 }, style]}>
      <Text style={styles.dangerButtonText}>{title}</Text>
    </Pressable>
  );
}

export function Badge({ text, color = COLORS.primary, background }) {
  return (
    <View style={[styles.badge, { backgroundColor: background || `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function LoadingView({ label = 'Caricamento...' }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.empty}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Divider({ style }) {
  return <View style={[{ height: 1, backgroundColor: COLORS.border }, style]} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FONT.h3,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  dangerButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.negativeLight,
  },
  dangerButtonText: {
    color: COLORS.negative,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  disabledButton: {
    opacity: 0.5,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FONT.tiny,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  loadingLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.body,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
});
