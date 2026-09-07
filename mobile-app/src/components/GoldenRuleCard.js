import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export default function GoldenRuleCard({ icon, title, text, footnote, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  text: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  footnote: {
    fontSize: FONT.tiny,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 6,
  },
});
