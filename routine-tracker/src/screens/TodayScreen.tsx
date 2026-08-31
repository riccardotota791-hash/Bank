import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ActivityPanel } from '../components/ActivityPanel';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBanner } from '../components/StatusBanner';
import { ACTIVITY_DEFS, CCNA_LESSON_HOURS, CCNA_TOTAL_LESSONS, READING_DAILY_GOAL_PAGES, WALKING_GOAL_STEPS, getScheduledActivities, isRestDay } from '../data/schedule';
import { computeDayCompletion, computeReadingStreak } from '../data/stats';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, spacing } from '../theme/theme';
import { DAY_LABELS, formatDateKey, formatHuman, getDayKey } from '../utils/date';

export default function TodayScreen() {
  const { loading, records, ccnaProgress, toggleActivity, setActivityValue } = useRoutineStore();
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateKey(today);
  const dayKey = getDayKey(today);
  const record = records[dateKey];

  const scheduled = useMemo(
    () => getScheduledActivities(today, ccnaProgress),
    [today, ccnaProgress]
  );
  const { done, percent } = computeDayCompletion(today, record, ccnaProgress);
  const streak = useMemo(() => computeReadingStreak(records, today), [records, today]);

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <StatusBanner
        dayLabel={DAY_LABELS[dayKey]}
        dateLabel={formatHuman(today)}
        done={done}
        scheduled={scheduled.length}
        percent={percent}
        restDay={isRestDay(dayKey)}
      />

      {isRestDay(dayKey) && (
        <View style={styles.restNotice}>
          <Text style={styles.restNoticeText}>
            LUNEDÌ // GIORNO LIBERO — tutti i moduli sono disattivati tranne la lettura.
          </Text>
        </View>
      )}

      <SectionHeader title="Moduli di oggi" hint={`${scheduled.length} attivi`} />

      {scheduled.map((key) => {
        const def = ACTIVITY_DEFS[key];
        const entry = record?.activities[key];

        if (key === 'ccna') {
          const lessonNumber = entry?.lessonNumber ?? Math.min(CCNA_TOTAL_LESSONS, ccnaProgress + 1);
          return (
            <ActivityPanel
              key={key}
              def={def}
              entry={entry}
              subtitle={`Lezione ${lessonNumber} di ${CCNA_TOTAL_LESSONS} · ${CCNA_LESSON_HOURS}h`}
              onToggleDone={() => toggleActivity(today, key)}
            />
          );
        }

        if (key === 'walking') {
          return (
            <ActivityPanel
              key={key}
              def={def}
              entry={entry}
              goal={WALKING_GOAL_STEPS}
              onToggleDone={() => toggleActivity(today, key)}
              onValueChange={(v) => setActivityValue(today, key, v)}
            />
          );
        }

        if (key === 'reading') {
          return (
            <ActivityPanel
              key={key}
              def={def}
              entry={entry}
              subtitle={streak > 0 ? `Streak: ${streak} giorni consecutivi` : 'Obiettivo giornaliero indicativo per completare un libro al mese'}
              goal={READING_DAILY_GOAL_PAGES}
              onToggleDone={() => toggleActivity(today, key)}
              onValueChange={(v) => setActivityValue(today, key, v)}
            />
          );
        }

        return (
          <ActivityPanel
            key={key}
            def={def}
            entry={entry}
            onToggleDone={() => toggleActivity(today, key)}
          />
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restNotice: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    borderRadius: 10,
    padding: spacing.md,
  },
  restNoticeText: {
    ...fonts.label,
    color: colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
});
