import React from 'react';
import { View } from 'react-native';
import { colors } from '../theme/theme';

type LedState = 'on' | 'off' | 'idle' | 'warn' | 'partial';

const STATE_COLOR: Record<LedState, string> = {
  on: colors.accent,
  off: colors.offline,
  idle: colors.textMuted,
  warn: colors.amber,
  partial: colors.accentMid,
};

export function LedDot({ state = 'off', size = 9 }: { state?: LedState; size?: number }) {
  const color = STATE_COLOR[state];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOpacity: state === 'on' ? 0.9 : state === 'partial' ? 0.5 : 0,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}
