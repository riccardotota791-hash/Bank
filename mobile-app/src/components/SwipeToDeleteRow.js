import React, { useRef } from 'react';
import { View, Animated, PanResponder, Alert, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';
import TransactionRow from './TransactionRow';

const SWIPE_THRESHOLD = 90;
const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Avvolge TransactionRow per permettere di eliminare un movimento con uno
 * scorrimento da destra verso sinistra (solo in quella direzione: verso
 * destra la riga non si muove, e il tocco normale per modificarlo resta
 * quello della riga sottostante). A differenza dello swipe sulle proposte
 * "da confermare" qui non si elimina mai subito al rilascio: si tratta di
 * un movimento già registrato e non reversibile, quindi serve sempre una
 * conferma esplicita.
 */
export default function SwipeToDeleteRow({ transaction, onPress, onDelete }) {
  const pan = useRef(new Animated.Value(0)).current;

  const resetPosition = () => {
    Animated.spring(pan, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dx < -10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        // Solo verso sinistra: un trascinamento verso destra non deve
        // spostare la riga.
        pan.setValue(Math.min(0, gesture.dx));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          resetPosition();
          Alert.alert(
            'Eliminare questo movimento?',
            [transaction.category_name, transaction.note].filter(Boolean).join(' · ') || "L'operazione non è reversibile.",
            [
              { text: 'Annulla', style: 'cancel' },
              { text: 'Elimina', style: 'destructive', onPress: () => onDelete(transaction) },
            ]
          );
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const bgOpacity = pan.interpolate({
    inputRange: [-SCREEN_WIDTH, -20, 0],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.background, { opacity: bgOpacity }]}>
        <Ionicons name="trash-outline" size={22} color={COLORS.white} />
      </Animated.View>
      <Animated.View
        style={[styles.foreground, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <TransactionRow transaction={transaction} onPress={onPress} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.negative,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: SPACING.lg,
  },
  foreground: {
    backgroundColor: COLORS.background,
  },
});
