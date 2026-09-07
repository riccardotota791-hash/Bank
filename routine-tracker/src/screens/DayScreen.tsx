import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, fonts, radius, spacing } from '../theme/theme';
import { DAY_LABELS, formatDateKey, formatHuman, getDayKey, isSameDay } from '../utils/date';

interface DayScreenProps {
  date: Date;
  /** Se presente, mostra una barra di navigazione (indietro / giorno prec./succ.) sopra lo stato. */
  onBack?: () => void;
  onPrevDay?: () => void;
  onNextDay?: () => void;
  canGoNext?: boolean;
}

/**
 * Schermata di un singolo giorno: usata sia per "Oggi" (senza barra di
 * navigazione) sia per il dettaglio di un giorno passato aperto da
 * Settimana/heatmap (con barra indietro + giorno prec./succ.). Tutte le
 * azioni scrivono sulla data passata in `date`, non necessariamente oggi.
 */
export function DayScreen({ date, onBack, onPrevDay, onNextDay, canGoNext }: DayScreenProps) {
  const {
    loading,
    records,
    ccnaProgress,
    celebrating,
    dismissCelebration,
    setActivityStatus,
    setActivityValue,
    incrementCounter,
    setNote,
    setTemplate,
  } = useRoutineStore();
  const today = useMemo(() => new Date(), []);
  const isToday = isSameDay(date, today);
  const dateKey = formatDateKey(date);
  const dayKey = getDayKey(date);
  const record = records[dateKey];
  const template = record?.template ?? 'auto';

  const scheduled = useMemo(
    () => getScheduledActivities(date, ccnaProgress, template),
    [date, ccnaProgress, template]
  );
  const { doneCount, partialCount, percent } = computeDayCompletion(date, record, ccnaProgress);
  const streak = useMemo(() => computeReadingStreak(records, today), [records, today]);

  if (loading) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </ScreenContainer>
    );
  }

  const showNavBar = !!(onBack || onPrevDay || onNextDay);

  return (
    <View style={styles.root}>
      <ScreenContainer>
        {showNavBar && (
          <View style={styles.navBar}>
            {onBack ? (
              <Pressable onPress={onBack} hitSlop={8} style={styles.navButton}>
                <Ionicons name="arrow-back-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.navButtonText}>Settimana</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={styles.navArrows}>
              <Pressable onPress={onPrevDay} hitSlop={8} style={styles.arrowButton} disabled={!onPrevDay}>
                <Ionicons name="chevron-back-outline" size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={onNextDay}
                hitSlop={8}
                style={styles.arrowButton}
                disabled={!onNextDay || !canGoNext}
              >
                <Ionicons
                  name="chevron-forward-outline"
                  size={18}
                  color={canGoNext ? colors.textSecondary : colors.offline}
                />
              </Pressable>
            </View>
          </View>
        )}

        <StatusBanner
          dayLabel={DAY_LABELS[dayKey]}
          dateLabel={formatHuman(date)}
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
        <TemplateSelector value={template} onChange={(id) => setTemplate(date, id)} />

        <SectionHeader title={isToday ? 'Moduli di oggi' : 'Moduli del giorno'} hint={`${scheduled.length} attivi`} />

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
                onStatusChange={(status) => setActivityStatus(date, key, status)}
              />
            );
          }

          if (key === 'walking') {
            const walkingValue = entry?.value ?? 0;
            return (
              <React.Fragment key={key}>
                {isToday && (
                  <PedometerCard
                    currentValue={walkingValue}
                    onAdd={(delta) => setActivityValue(date, key, walkingValue + delta)}
                    onSet={(v) => setActivityValue(date, key, v)}
                  />
                )}
                <ActivityPanel
                  def={def}
                  entry={entry}
                  onStatusChange={(status) => setActivityStatus(date, key, status)}
                  onValueChange={(v) => setActivityValue(date, key, v)}
                />
              </React.Fragment>
            );
          }

          if (def.kind === 'counter') {
            const counterValue = entry?.value ?? 0;
            return (
              <ActivityPanel
                key={key}
                def={def}
                entry={entry}
                onStatusChange={(status) => setActivityStatus(date, key, status)}
                onQuickAdd={(delta) => incrementCounter(date, key, delta)}
                onReset={() => incrementCounter(date, key, -counterValue)}
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
                onStatusChange={(status) => setActivityStatus(date, key, status)}
                onValueChange={(v) => setActivityValue(date, key, v)}
              />
            );
          }

          return (
            <ActivityPanel
              key={key}
              def={def}
              entry={entry}
              onStatusChange={(status) => setActivityStatus(date, key, status)}
            />
          );
        })}

        <SectionHeader title="Diario rapido" />
        <DailyNoteField value={record?.note ?? ''} onSave={(text) => setNote(date, text)} />
      </ScreenContainer>
      {isToday && <CelebrationOverlay active={celebrating} onDone={dismissCelebration} />}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  navArrows: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: 'auto',
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panel,
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
