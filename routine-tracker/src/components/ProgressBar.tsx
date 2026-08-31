import React from 'react';
import { View } from 'react-native';
import { colors, radius } from '../theme/theme';

export function ProgressBar({
  percent,
  color = colors.accent,
  height = 6,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: colors.grid,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}
