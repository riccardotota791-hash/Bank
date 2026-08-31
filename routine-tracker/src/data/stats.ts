import { DailyRecord } from './types';
import { getScheduledActivities, isActivityDone } from './schedule';
import { addDays, formatDateKey, startOfDay, startOfWeek } from '../utils/date';

/**
 * Percentuale di completamento di un giorno: attività completate / attività previste.
 * Se non ci sono attività previste (caso limite) restituisce 100.
 */
export function computeDayCompletion(
  date: Date,
  record: DailyRecord | undefined,
  ccnaCompletedLessons: number
): { done: number; scheduled: number; percent: number } {
  const scheduled = getScheduledActivities(date, ccnaCompletedLessons);
  if (scheduled.length === 0) return { done: 0, scheduled: 0, percent: 100 };
  const done = scheduled.filter((key) => isActivityDone(record?.activities[key])).length;
  return { done, scheduled: scheduled.length, percent: Math.round((done / scheduled.length) * 100) };
}

export interface WeekCompletion {
  weekStart: Date;
  label: string;
  percent: number;
  doneCount: number;
  scheduledCount: number;
}

/**
 * Storico di completamento settimanale per le ultime `weeks` settimane (lun-dom),
 * calcolato solo sui giorni già trascorsi (oggi incluso).
 */
export function computeWeeklyCompletionHistory(
  records: Record<string, DailyRecord>,
  today: Date,
  ccnaCompletedLessons: number,
  weeks: number
): WeekCompletion[] {
  const thisWeekStart = startOfWeek(today);
  const result: WeekCompletion[] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(thisWeekStart, -7 * w);
    let doneCount = 0;
    let scheduledCount = 0;

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      if (day.getTime() > startOfDay(today).getTime()) break; // giorno futuro, non ancora accaduto
      const record = records[formatDateKey(day)];
      const { done, scheduled } = computeDayCompletion(day, record, ccnaCompletedLessons);
      doneCount += done;
      scheduledCount += scheduled;
    }

    const percent = scheduledCount > 0 ? Math.round((doneCount / scheduledCount) * 100) : 0;
    result.push({
      weekStart,
      label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      percent,
      doneCount,
      scheduledCount,
    });
  }

  return result;
}

/**
 * Streak di giorni consecutivi con lettura registrata (pagine > 0).
 * Il giorno corrente non interrompe lo streak se non ancora registrato:
 * viene semplicemente escluso dal conteggio finché non si inseriscono pagine.
 */
export function computeReadingStreak(records: Record<string, DailyRecord>, today: Date): number {
  let cursor = startOfDay(today);
  const todayRecord = records[formatDateKey(cursor)];
  const todayPages = todayRecord?.activities.reading?.value ?? 0;

  if (todayPages <= 0) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (true) {
    const record = records[formatDateKey(cursor)];
    const pages = record?.activities.reading?.value ?? 0;
    if (pages > 0) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}
