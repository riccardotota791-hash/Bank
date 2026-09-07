import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ActivityPanel } from '../components/ActivityPanel';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { DailyNoteField } from '../components/DailyNoteField';
import { PedometerCard } from '../components/PedometerCard';
import { ScreenContainer } from '../components/ScreenContainer';
import { SectionHeader } from '../components/SectionHeader';
import { StatusBanner } from '../components/StatusBanner';
import { TemplateSelector } from '../components/TemplateSelector';
import {
  ACTIVITY_DEFS,
  CCNA_LESSON_HOURS,
  CCNA_TOTAL_LESSONS,
  getScheduledActivities,
  isRestDay,
} from '../data/schedule';
import { computeDayCompletion, computeReadingStreak } from '../data/stats';
import { useRoutineStore } from '../hooks/RoutineStore';
import { colors, fonts, spacing } from '../theme/theme';
import { DAY_LABELS, formatDateKey, formatHuman, getDayKey } from '../utils/date';

export default function TodayScreen() {
  const {
    loading,
    records,
    ccnaProgress,
    celebrating,
    dismissCelebration,
    setActivityStatus,
    setActivityValue,
    addWater,
    setNote,
    setTemplate,
  } = useRoutineStore();
  const today = useMemo(() => new Date(), []);
  const dateKey = formatDateKey(today);
  const dayKey = getDayKey(today);
  const record = records[dateKey];
  const template = record?.template ?? 'auto';

  const scheduled = useMemo(
    () => getScheduledActivities(today, ccnaProgress, template),
    [today, ccnaProgress, template]
  );
  const { doneCount, partialCount, percent } = computeDayCompletion(today, record, ccnaProgress);
  const streak = useMemo(() => computeReadingStreak(records, today), [records, today]);

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenContainer>
        <StatusBanner
          dayLabel={DAY_LABELS[dayKey]}
          dateLabel={formatHuman(today)}
          doneCount={doneCount}
          partialCount={partialCount}
          scheduled={scheduled.length}
          percent={percent}
          restDay={isRestDay(dayKey) && template === 'auto'}
        />

        {isRestDay(dayKey) && template === 'auto' && (
          <View style={styles.restNotice}>
            <Text style={styles.restNoticeText}>
              LUNEDÌ // GIORNO LIBERO — CCNA, sala pesi, cardio e inglese sono disattivati. Restano attivi camminata, acqua, pillole e lettura.
            </Text>
          </View>
        )}

        <SectionHeader title="Template di giornata" hint="sovrascrive le regole automatiche" />
        <TemplateSelector value={template} onChange={(id) => setTemplate(today, id)} />

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
                onStatusChange={(status) => setActivityStatus(today, key, status)}
              />
            );
          }

          if (key === 'walking') {
            const walkingValue = entry?.value ?? 0;
            return (
              <React.Fragment key={key}>
                <PedometerCard
                  currentValue={walkingValue}
                  onAdd={(delta) => setActivityValue(today, key, walkingValue + delta)}
                  onSet={(v) => setActivityValue(today, key, v)}
                />
                <ActivityPanel
                  def={def}
                  entry={entry}
                  onStatusChange={(status) => setActivityStatus(today, key, status)}
                  onValueChange={(v) => setActivityValue(today, key, v)}
                />
              </React.Fragment>
            );
          }

          if (key === 'water') {
            const waterValue = entry?.value ?? 0;
            return (
              <ActivityPanel
                key={key}
                def={def}
                entry={entry}
                onStatusChange={(status) => setActivityStatus(today, key, status)}
                onQuickAdd={(delta) => addWater(today, delta)}
                onReset={() => addWater(today, -waterValue)}
              />
            );
          }

          if (key === 'reading') {
            return (
              <ActivityPanel
                key={key}
                def={def}
                entry={entry}
                subtitle={
                  streak > 0
                    ? `Streak: ${streak} giorni consecutivi`
                    : 'Obiettivo giornaliero indicativo per completare un libro al mese'
                }
                onStatusChange={(status) => setActivityStatus(today, key, status)}
                onValueChange={(v) => setActivityValue(today, key, v)}
              />
            );
          }

          return (
            <ActivityPanel
              key={key}
              def={def}
              entry={entry}
              onStatusChange={(status) => setActivityStatus(today, key, status)}
            />
          );
        })}

        <SectionHeader title="Diario rapido" />
        <DailyNoteField value={record?.note ?? ''} onSave={(text) => setNote(today, text)} />
      </ScreenContainer>
      <CelebrationOverlay active={celebrating} onDone={dismissCelebration} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
