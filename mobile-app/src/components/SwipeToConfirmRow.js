import React, { useRef } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatEuro, formatDateIT } from '../utils/formatters';

const SWIPE_THRESHOLD = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Riga "da confermare" per i movimenti importati da Gmail: swipe a destra
 * conferma (verde), swipe a sinistra rifiuta (rosso). Fallback: due bottoni
 * sempre visibili per chi preferisce toccare invece di scorrere.
 */
export default function SwipeToConfirmRow({ item, onConfirm, onReject }) {
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
      onPanResponderMove: (_, gesture) => {
        pan.setValue(gesture.dx);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(pan, { toValue: SCREEN_WIDTH, duration: 180, useNativeDriver: true }).start(() => onConfirm(item));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(pan, { toValue: -SCREEN_WIDTH, duration: 180, useNativeDriver: true }).start(() => onReject(item));
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
        }
      },
    })
  ).current;

  const bgColor = pan.interpolate({
    inputRange: [-SCREEN_WIDTH, -20, 0, 20, SCREEN_WIDTH],
    outputRange: [COLORS.negative, COLORS.card, COLORS.card, COLORS.card, COLORS.positive],
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.background, { backgroundColor: bgColor }]}>
        <Ionicons name="close" size={22} color={COLORS.white} />
        <Ionicons name="checkmark" size={22} color={COLORS.white} />
      </Animated.View>
      <Animated.View
        style={[styles.card, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${item.category_color || COLORS.neutral}22` }]}>
          <Ionicons name={item.category_icon || 'mail-outline'} size={20} color={item.category_color || COLORS.neutral} />
        </View>
        <View style={styles.info}>
          <Text style={styles.merchant} numberOfLines={1}>{item.merchant || 'Movimento rilevato'}</Text>
          <Text style={styles.category} numberOfLines={1}>{item.category_name || 'Da categorizzare'} · {formatDateIT(item.date)}</Text>
        </View>
        <Text style={[styles.amount, { color: item.suggested_type === 'income' ? COLORS.income : COLORS.expense }]}>
          {item.suggested_type === 'income' ? '+' : '-'} {formatEuro(item.amount)}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    gap: SPACING.md,
    borderRadius: RADIUS.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  merchant: { fontSize: FONT.body, fontWeight: '600', color: COLORS.textPrimary },
  category: { fontSize: FONT.tiny, color: COLORS.textSecondary, marginTop: 1 },
  amount: { fontSize: FONT.body, fontWeight: '700' },
});
