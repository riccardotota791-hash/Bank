import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT } from '../constants/theme';

export default function CategoryGrid({ categories, selectedId, onSelect }) {
  return (
    <View style={styles.grid}>
      {categories.map((cat) => {
        const active = selectedId === cat.id;
        return (
          <Pressable key={cat.id} style={styles.item} onPress={() => onSelect(cat.id)}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: active ? cat.color : `${cat.color}1A`, borderColor: cat.color, borderWidth: active ? 0 : 1 },
              ]}
            >
              <Ionicons name={cat.icon} size={22} color={active ? COLORS.white : cat.color} />
            </View>
            <Text style={[styles.label, active && { color: cat.color, fontWeight: '700' }]} numberOfLines={2}>
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  item: {
    width: 74,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FONT.tiny,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
