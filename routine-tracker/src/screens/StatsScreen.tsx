import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AchievementGrid } from '../components/AchievementGrid';
import { HabitInsightCard } from '../components/HabitInsightCard';
import { ProgressBar } from '../components/ProgressBar';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import { evaluateAchievements } from '../data/achievements';
import { CCNA_TOTAL_LESSONS, isCcnaCourseOver } from '../data/schedule';
import {
  computeAllTimeCompletionRate,
  computeHabitInsights,
  computeMonthCompletionRate,
  computeReadingStreak,
  computeWeeklyCompletionHistory,
  sumActivityValue,
} from '../data/stats';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, radius, spacing } from '../theme/theme';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { records, ccnaProgress } = useRoutineStore();
  const today = useMemo(() => new Date(), []);

  const weeklyHistory = useMemo(
    () => computeWeeklyCompletionHistory(records, today, ccnaProgress, 8),
    [records, today, ccnaProgress]
  );
  const streak = useMemo(() => computeReadingStreak(records, today), [records, today]);
  const totalPages = useMemo(() => sumActivityValue(records, 'reading'), [records]);

  const monthRate = useMemo(
    () => computeMonthCompletionRate(records, today, ccnaProgress),
    [records, today, ccnaProgress]
  );
  const allTimeRate = useMemo(
    () => computeAllTimeCompletionRate(records, today, ccnaProgress),
    [records, today, ccnaProgress]
  );

  const insights = useMemo(() => computeHabitInsights(records, ccnaProgress), [records, ccnaProgress]);
  const achievements = useMemo(() => evaluateAchievements(records, ccnaProgress), [records, ccnaProgress]);

  const chartData = {
    labels: weeklyHistory.map((w) => w.label),
    datasets: [{ data: weeklyHistory.map((w) => w.percent) }],
  };

  const ccnaOver = isCcnaCourseOver(today) || ccnaProgress >= CCNA_TOTAL_LESSONS;

  return (
    <ScreenContainer>
      <SectionHeader title="Tasso di disciplina" hint="% moduli completati" />
      <View style={styles.tileRow}>
        <StatTile label="Mese corrente" percent={monthRate} />
        <StatTile label="Sempre" percent={allTimeRate} />
      </View>

      <SectionHeader title="Streak di lettura" />
      <View style={styles.streakCard}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>giorni consecutivi di lettura</Text>
        <Text style={styles.streakSub}>{totalPages} pagine lette in totale</Text>
      </View>

      <SectionHeader title="Andamento completamento settimanale" hint="ultime 8 settimane" />
      <View style={styles.chartCard}>
        <LineChart
          data={chartData}
          width={screenWidth - spacing.lg * 2 - spacing.md * 2}
          height={200}
          fromZero
          yAxisSuffix="%"
          segments={4}
          chartConfig={{
            backgroundColor: colors.panel,
            backgroundGradientFrom: colors.panel,
            backgroundGradientTo: colors.panel,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(45, 227, 201, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(127, 155, 179, ${opacity})`,
            propsForDots: { r: '3', strokeWidth: '1', stroke: colors.accent },
            propsForBackgroundLines: { stroke: colors.grid },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {insights.length > 0 && (
        <>
          <SectionHeader title="Correlazioni tra abitudini" hint="statistiche, non causali" />
          {insights.map((insight) => (
            <HabitInsightCard key={`${insight.fromKey}-${insight.toKey}`} insight={insight} />
          ))}
        </>
      )}

      <SectionHeader title="Achievement" hint={`${achievements.filter((a) => a.unlocked).length}/${achievements.length} sbloccati`} />
      <AchievementGrid achievements={achievements} />

      <SectionHeader title="Corso CCNA" />
      <View style={styles.ccnaCard}>
        <View style={styles.ccnaRow}>
          <Text style={styles.ccnaProgress}>{ccnaProgress}/{CCNA_TOTAL_LESSONS}</Text>
          <Text style={styles.ccnaStatus}>{ccnaOver ? 'CORSO CONCLUSO' : 'IN CORSO'}</Text>
        </View>
        <ProgressBar percent={(ccnaProgress / CCNA_TOTAL_LESSONS) * 100} />
        <Text style={styles.ccnaHint}>
          {ccnaOver
            ? 'Il modulo CCNA non compare più nella schermata di oggi.'
            : 'Videolezioni da 3h, attive martedì · giovedì · sabato fino a metà novembre 2026.'}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  streakCard: {
    backgroundColor: colors.panelAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderBright,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 2,
  },
  streakNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.accent,
  },
  streakLabel: {
    ...fonts.label,
    color: colors.textSecondary,
  },
  streakSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  chart: {
    borderRadius: radius.sm,
  },
  ccnaCard: {
    backgroundColor: colors.panel,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  ccnaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ccnaProgress: {
    ...fonts.title,
    color: colors.textPrimary,
  },
  ccnaStatus: {
    ...fonts.label,
    color: colors.textMuted,
    fontSize: 10,
  },
  ccnaHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
