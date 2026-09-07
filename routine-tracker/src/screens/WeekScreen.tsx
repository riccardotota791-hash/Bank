import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HeatmapCalendar } from '../components/HeatmapCalendar';
import { LedDot } from '../components/LedDot';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import {
  ACTIVITY_DEFS,
  ACTIVITY_ORDER,
  getScheduledActivities,
  isActivityDone,
  isActivityPartial,
  isRestDay,
} from '../data/schedule';
import { computeDayCompletion } from '../data/stats';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, radius, spacing } from '../theme/theme';
import {
  addMonths,
  DAY_LABELS,
  formatDateKey,
  formatShort,
  getDayKey,
  isSameDay,
  lastNDays,
} from '../utils/date';

export default function WeekScreen() {
  const navigation = useNavigation<any>();
  const { records, ccnaProgress } = useRoutineStore();
  const today = useMemo(() => new Date(), []);
  const days = useMemo(() => lastNDays(today, 7), [today]);
  const [heatmapMonth, setHeatmapMonth] = useState(() => new Date());

  const openDay = (day: Date) => {
    navigation.navigate('DayDetail', { dateKey: formatDateKey(day) });
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Mappa di calore" hint="Completamento mensile · tocca un giorno per modificarlo" />
      <HeatmapCalendar
        monthDate={heatmapMonth}
        records={records}
        today={today}
        ccnaCompletedLessons={ccnaProgress}
        onPrevMonth={() => setHeatmapMonth((m) => addMonths(m, -1))}
        onNextMonth={() => setHeatmapMonth((m) => addMonths(m, 1))}
        onSelectDay={openDay}
      />

      <SectionHeader title="Ultimi 7 giorni" hint="Tocca un giorno per modificarlo" />
      {days.map((day) => {
        const dayKey = getDayKey(day);
        const record = records[formatDateKey(day)];
        const scheduled = getScheduledActivities(day, ccnaProgress, record?.template);
        const { doneCount, percent } = computeDayCompletion(day, record, ccnaProgress);
        const rest = isRestDay(dayKey) && (record?.template ?? 'auto') === 'auto';
        const isToday = isSameDay(day, today);

        return (
          <Pressable
            key={day.toISOString()}
            onPress={() => openDay(day)}
            style={({ pressed }) => [
              styles.card,
              isToday && styles.cardToday,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.dayLabel}>
                  {DAY_LABELS[dayKey]}{isToday ? ' · OGGI' : ''}
                </Text>
                <Text style={styles.dateLabel}>{formatShort(day)}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={[styles.percent, rest && styles.percentRest]}>
                  {rest ? '—' : `${percent}%`}
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color={colors.textMuted} />
              </View>
            </View>

            {!rest && <ProgressBar percent={percent} />}

            <View style={styles.ledRow}>
              {ACTIVITY_ORDER.filter((key) => scheduled.includes(key)).map((key) => {
                const def = ACTIVITY_DEFS[key];
                const entry = record?.activities[key];
                const ledState = isActivityDone(entry) ? 'on' : isActivityPartial(entry) ? 'partial' : 'off';
                return (
                  <View key={key} style={styles.ledItem}>
                    <LedDot state={ledState} size={7} />
                    <Text style={styles.ledLabel}>{def.shortLabel}</Text>
                  </View>
                );
              })}
              {scheduled.length === 0 && (
                <Text style={styles.emptyLabel}>Nessun modulo previsto</Text>
              )}
            </View>

            <Text style={styles.doneSummary}>{doneCount}/{scheduled.length} completati</Text>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardToday: {
    borderColor: colors.accentDim,
  },
  cardPressed: {
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayLabel: {
    ...fonts.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dateLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  percent: {
    ...fonts.title,
    fontSize: 18,
    color: colors.accent,
  },
  percentRest: {
    color: colors.textMuted,
  },
  ledRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  ledItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ledLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  emptyLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  doneSummary: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
