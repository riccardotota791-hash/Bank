import { ActivityKey, DailyRecord } from './types';
import { ACTIVITY_DEFS, activityWeight, getScheduledActivities, isActivityDone } from './schedule';
import { addDays, formatDateKey, startOfDay, startOfMonth, startOfWeek } from '../utils/date';

export interface DayCompletion {
  /** Somma pesata dei moduli previsti (fatto=1, in corso=0.5, non fatto=0). */
  score: number;
  doneCount: number;
  partialCount: number;
  scheduled: number;
  percent: number;
}

const EMPTY_COMPLETION: DayCompletion = { score: 0, doneCount: 0, partialCount: 0, scheduled: 0, percent: 100 };

/**
 * Completamento pesato di un giorno: i moduli "in corso" contano per metà.
 * Se non ci sono moduli previsti (caso limite) restituisce 100%.
 * Il template del giorno (se impostato manualmente sul record) sostituisce
 * la regola automatica per giorno della settimana.
 */
export function computeDayCompletion(
  date: Date,
  record: DailyRecord | undefined,
  ccnaCompletedLessons: number
): DayCompletion {
  const scheduled = getScheduledActivities(date, ccnaCompletedLessons, record?.template);
  if (scheduled.length === 0) return EMPTY_COMPLETION;

  let score = 0;
  let doneCount = 0;
  let partialCount = 0;
  for (const key of scheduled) {
    const weight = activityWeight(record?.activities[key]);
    score += weight;
    if (weight === 1) doneCount++;
    else if (weight === 0.5) partialCount++;
  }

  return {
    score,
    doneCount,
    partialCount,
    scheduled: scheduled.length,
    percent: Math.round((score / scheduled.length) * 100),
  };
}

export interface WeekCompletion {
  weekStart: Date;
  label: string;
  percent: number;
  scoreSum: number;
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
    let scoreSum = 0;
    let scheduledCount = 0;

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      if (day.getTime() > startOfDay(today).getTime()) break; // giorno futuro, non ancora accaduto
      const record = records[formatDateKey(day)];
      const { score, scheduled } = computeDayCompletion(day, record, ccnaCompletedLessons);
      scoreSum += score;
      scheduledCount += scheduled;
    }

    const percent = scheduledCount > 0 ? Math.round((scoreSum / scheduledCount) * 100) : 0;
    result.push({
      weekStart,
      label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      percent,
      scoreSum,
      scheduledCount,
    });
  }

  return result;
}

/**
 * Tasso di completamento medio (%) nell'intervallo [from, to] incluso,
 * limitato a `today` per non contare giorni futuri. Usato per le statistiche
 * "mese corrente" e "sempre".
 */
export function computeCompletionRateInRange(
  records: Record<string, DailyRecord>,
  today: Date,
  ccnaCompletedLessons: number,
  from: Date,
  to: Date
): number {
  const end = to.getTime() < today.getTime() ? to : startOfDay(today);
  let scoreSum = 0;
  let scheduledCount = 0;
  let cursor = startOfDay(from);
  while (cursor.getTime() <= end.getTime()) {
    const record = records[formatDateKey(cursor)];
    const { score, scheduled } = computeDayCompletion(cursor, record, ccnaCompletedLessons);
    scoreSum += score;
    scheduledCount += scheduled;
    cursor = addDays(cursor, 1);
  }
  return scheduledCount > 0 ? Math.round((scoreSum / scheduledCount) * 100) : 0;
}

export function computeMonthCompletionRate(
  records: Record<string, DailyRecord>,
  today: Date,
  ccnaCompletedLessons: number
): number {
  return computeCompletionRateInRange(records, today, ccnaCompletedLessons, startOfMonth(today), today);
}

/** Tasso "sempre" a partire dal primo record salvato (o da oggi se non c'è storico). */
export function computeAllTimeCompletionRate(
  records: Record<string, DailyRecord>,
  today: Date,
  ccnaCompletedLessons: number
): number {
  const dateKeys = Object.keys(records);
  if (dateKeys.length === 0) return computeMonthCompletionRate(records, today, ccnaCompletedLessons);
  const earliest = dateKeys.reduce((min, k) => (k < min ? k : min), dateKeys[0]);
  const [y, m, d] = earliest.split('-').map(Number);
  return computeCompletionRateInRange(records, today, ccnaCompletedLessons, new Date(y, m - 1, d), today);
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

/** Streak di lettura più lunga mai raggiunta nello storico salvato (per i badge). */
export function computeBestReadingStreak(records: Record<string, DailyRecord>): number {
  const dateKeys = Object.keys(records).sort();
  let best = 0;
  let current = 0;
  for (const key of dateKeys) {
    const pages = records[key]?.activities.reading?.value ?? 0;
    if (pages > 0) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

/** Somma di un valore numerico di modulo (passi, pagine, ml) su tutto lo storico. */
export function sumActivityValue(records: Record<string, DailyRecord>, key: ActivityKey): number {
  return Object.values(records).reduce((sum, r) => sum + (r.activities[key]?.value ?? 0), 0);
}

/** Numero di giorni in cui un modulo risulta "fatto" (status done) su tutto lo storico. */
export function countActivityDone(records: Record<string, DailyRecord>, key: ActivityKey): number {
  return Object.values(records).filter((r) => isActivityDone(r.activities[key])).length;
}

export interface HeatmapDay {
  date: Date;
  dateKey: string;
  percent: number | null; // null = fuori dal mese o giorno futuro senza dati
  inMonth: boolean;
  isFuture: boolean;
}

/**
 * Griglia mensile stile heat-map: una cella per ogni giorno del mese di
 * `monthDate`, con la percentuale di completamento (null per i giorni futuri).
 */
export function computeMonthHeatmap(
  records: Record<string, DailyRecord>,
  monthDate: Date,
  today: Date,
  ccnaCompletedLessons: number
): HeatmapDay[] {
  const first = startOfMonth(monthDate);
  const days: HeatmapDay[] = [];
  const todayStart = startOfDay(today);
  let cursor = new Date(first);
  while (cursor.getMonth() === first.getMonth()) {
    const isFuture = cursor.getTime() > todayStart.getTime();
    let percent: number | null = null;
    if (!isFuture) {
      const record = records[formatDateKey(cursor)];
      const completion = computeDayCompletion(cursor, record, ccnaCompletedLessons);
      percent = completion.scheduled > 0 ? completion.percent : null;
    }
    days.push({
      date: new Date(cursor),
      dateKey: formatDateKey(cursor),
      percent,
      inMonth: true,
      isFuture,
    });
    cursor = addDays(cursor, 1);
  }
  return days;
}

export interface HabitInsight {
  fromKey: ActivityKey;
  toKey: ActivityKey;
  /** Probabilità che `toKey` sia completato quando `fromKey` è completato. */
  probabilityWith: number;
  /** Probabilità di base che `toKey` sia completato (indipendentemente da fromKey). */
  probabilityBase: number;
  /** Variazione relativa (es. 0.3 = +30%). */
  lift: number;
  sampleSize: number;
}

const MIN_INSIGHT_SAMPLE = 8;

/**
 * Correlazioni statistiche (non causali) tra coppie di moduli: quanto più
 * spesso B viene completato nei giorni in cui A è completato, rispetto alla
 * frequenza media di B. Considera solo i giorni in cui entrambi i moduli
 * erano previsti. Richiede un campione minimo per essere affidabile.
 */
export function computeHabitInsights(
  records: Record<string, DailyRecord>,
  ccnaCompletedLessons: number,
  maxResults = 3
): HabitInsight[] {
  const keys = Object.keys(ACTIVITY_DEFS) as ActivityKey[];
  const dateKeys = Object.keys(records).sort();

  const insights: HabitInsight[] = [];

  for (const fromKey of keys) {
    for (const toKey of keys) {
      if (fromKey === toKey) continue;

      let bothScheduled = 0;
      let fromDoneCount = 0;
      let toDoneWhenFromDone = 0;
      let toDoneCount = 0;

      for (const dateKey of dateKeys) {
        const record = records[dateKey];
        const [y, m, d] = dateKey.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        const scheduled = getScheduledActivities(date, ccnaCompletedLessons, record.template);
        if (!scheduled.includes(fromKey) || !scheduled.includes(toKey)) continue;

        bothScheduled++;
        const fromDone = isActivityDone(record.activities[fromKey]);
        const toDone = isActivityDone(record.activities[toKey]);
        if (toDone) toDoneCount++;
        if (fromDone) {
          fromDoneCount++;
          if (toDone) toDoneWhenFromDone++;
        }
      }

      if (bothScheduled < MIN_INSIGHT_SAMPLE || fromDoneCount < MIN_INSIGHT_SAMPLE * 0.5) continue;

      const probabilityBase = toDoneCount / bothScheduled;
      const probabilityWith = fromDoneCount > 0 ? toDoneWhenFromDone / fromDoneCount : 0;
      if (probabilityBase <= 0) continue;

      const lift = (probabilityWith - probabilityBase) / probabilityBase;
      if (lift <= 0.1) continue; // solo correlazioni positive e non trascurabili

      insights.push({ fromKey, toKey, probabilityWith, probabilityBase, lift, sampleSize: bothScheduled });
    }
  }

  return insights.sort((a, b) => b.lift - a.lift).slice(0, maxResults);
}
