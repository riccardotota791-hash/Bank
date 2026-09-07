import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeMonthHeatmap, HeatmapDay } from '../data/stats';
import { DailyRecord } from '../data/types';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { DAY_LABELS_SHORT, formatMonthLabel, getDayKey, isSameMonth } from '../utils/date';

const WEEKDAY_HEADER = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

const ACCENT_RGB = hexToRgb(colors.accent);

function cellColor(percent: number | null): string {
  if (percent === null) return 'transparent';
  const alpha = percent <= 0 ? 0.08 : 0.16 + (percent / 100) * 0.74;
  return `rgba(${ACCENT_RGB[0]}, ${ACCENT_RGB[1]}, ${ACCENT_RGB[2]}, ${alpha})`;
}

/** Offset (0=lunedì..6=domenica) del primo giorno del mese, per allineare la griglia. */
function leadingOffset(monthDate: Date): number {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const dayKey = getDayKey(first);
  const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  return order.indexOf(dayKey);
}

/**
 * Calendario mensile stile heat-map (GitHub-style): una cella per giorno,
 * l'intensità del verde-acqua rispecchia la % di completamento di quel
 * giorno. Naviga tra i mesi con le frecce; non è possibile andare oltre il
 * mese corrente.
 */
export function HeatmapCalendar({
  monthDate,
  records,
  today,
  ccnaCompletedLessons,
  onPrevMonth,
  onNextMonth,
}: {
  monthDate: Date;
  records: Record<string, DailyRecord>;
  today: Date;
  ccnaCompletedLessons: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const days = useMemo(
    () => computeMonthHeatmap(records, monthDate, today, ccnaCompletedLessons),
    [records, monthDate, today, ccnaCompletedLessons]
  );
  const offset = leadingOffset(monthDate);
  const isCurrentMonth = isSameMonth(monthDate, today);

  const cells: (HeatmapDay | null)[] = [...Array(offset).fill(null), ...days];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable onPress={onPrevMonth} hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={18} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthLabel(monthDate).toUpperCase()}</Text>
        <Pressable onPress={onNextMonth} hitSlop={8} disabled={isCurrentMonth}>
          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color={isCurrentMonth ? colors.offline : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_HEADER.map((d) => (
          <Text key={d} style={styles.weekdayLabel}>
            {d[0]}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, i) =>
          cell === null ? (
            <View key={`blank-${i}`} style={styles.cell} />
          ) : (
            <View
              key={cell.dateKey}
              style={[
                styles.cell,
                styles.dayCell,
                { backgroundColor: cellColor(cell.percent) },
                cell.isFuture && styles.futureCell,
              ]}
            >
              <Text style={styles.dayNumber}>{cell.date.getDate()}</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>MENO</Text>
        {[0, 25, 50, 75, 100].map((p) => (
          <View key={p} style={[styles.legendSwatch, { backgroundColor: cellColor(p) }]} />
        ))}
        <Text style={styles.legendLabel}>PIÙ</Text>
      </View>
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%`;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthLabel: {
    ...fonts.label,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    width: CELL_SIZE as any,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL_SIZE as any,
    aspectRatio: 1,
    padding: 2,
  },
  dayCell: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  futureCell: {
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  dayNumber: {
    color: colors.textSecondary,
    fontSize: 9,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 9,
    marginHorizontal: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
