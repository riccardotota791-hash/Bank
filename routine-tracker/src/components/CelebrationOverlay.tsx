import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

const SPARKLES = [
  { left: '8%', delay: 0 },
  { left: '22%', delay: 120 },
  { left: '38%', delay: 60 },
  { left: '55%', delay: 200 },
  { left: '70%', delay: 40 },
  { left: '84%', delay: 160 },
];

const DURATION_MS = 2200;

/**
 * Micro-animazione "celebration" quando la giornata raggiunge il 100%:
 * bagliore neon pulsante + sparkle stilizzati che salgono e svaniscono.
 * Puramente decorativa (pointerEvents="none"), si autodistrugge dopo l'animazione.
 */
export function CelebrationOverlay({ active, onDone }: { active: boolean; onDone: () => void }) {
  const glow = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;

    glow.setValue(0);
    sparkleAnims.forEach((v) => v.setValue(0));

    const glowAnim = Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.35, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]);

    const sparkleAnimations = sparkleAnims.map((v, i) =>
      Animated.sequence([
        Animated.delay(SPARKLES[i].delay),
        Animated.timing(v, { toValue: 1, duration: DURATION_MS - 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ])
    );

    const timer = setTimeout(onDone, DURATION_MS);
    Animated.parallel([glowAnim, ...sparkleAnimations]).start();
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!active) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.container]}>
      <Animated.View
        style={[
          styles.glowRing,
          {
            opacity: glow,
            transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.02] }) }],
          },
        ]}
      />
      {SPARKLES.map((s, i) => {
        const v = sparkleAnims[i];
        return (
          <Animated.View
            key={i}
            style={[
              styles.sparkle,
              {
                left: s.left as any,
                opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) },
                  { scale: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1, 0.7] }) },
                ],
              },
            ]}
          >
            <Ionicons name="sparkles" size={16} color={colors.accent} />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
  },
  glowRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  sparkle: {
    position: 'absolute',
    top: 100,
  },
});
