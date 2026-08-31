import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';
import { formatEuro, formatDateIT } from '../utils/formatters';

const TYPE_SIGN = { income: '+', expense: '-', saving: '-' };
const TYPE_COLOR = { income: COLORS.income, expense: COLORS.expense, saving: COLORS.saving };

export default function TransactionRow({ transaction, onPress }) {
  const color = TYPE_COLOR[transaction.type];
  const sign = TYPE_SIGN[transaction.type];

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={() => onPress?.(transaction)}>
      <View style={[styles.iconCircle, { backgroundColor: `${transaction.category_color || COLORS.neutral}22` }]}>
        <Ionicons name={transaction.category_icon || 'help-circle-outline'} size={20} color={transaction.category_color || COLORS.neutral} />
      </View>
      <View style={styles.info}>
        <Text style={styles.category} numberOfLines={1}>{transaction.category_name || 'Senza categoria'}</Text>
        <Text style={styles.note} numberOfLines={1}>
          {transaction.note ? transaction.note : formatDateIT(transaction.date)}
        </Text>
      </View>
      <View style={styles.amountBlock}>
        <Text style={[styles.amount, { color }]}>{sign} {formatEuro(transaction.amount)}</Text>
        {transaction.source === 'gmail' ? (
          <View style={styles.gmailTag}>
            <Ionicons name="mail-outline" size={10} color={COLORS.textMuted} />
            <Text style={styles.gmailTagText}>Gmail</Text>
          </View>
        ) : (
          <Text style={styles.date}>{formatDateIT(transaction.date)}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: FONT.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  note: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  amountBlock: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: FONT.body,
    fontWeight: '700',
  },
  date: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gmailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  gmailTagText: {
    fontSize: FONT.tiny,
    color: COLORS.textMuted,
  },
});
