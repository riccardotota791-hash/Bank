import { ActivityKey, DayKey } from './types';
import { getDayKey } from '../utils/date';

export const CCNA_TOTAL_LESSONS = 30;
export const CCNA_LESSON_HOURS = 3;
/** Metà novembre 2026: dopo questa data il corso CCNA è concluso e il modulo sparisce. */
export const CCNA_END_DATE = new Date(2026, 10, 15, 23, 59, 59); // 15 novembre 2026
export const CCNA_ACTIVE_DAYS: DayKey[] = ['tue', 'thu', 'sat'];

export const WALKING_GOAL_STEPS = 10000;
/** Un libro al mese di media lunghezza: usato come riferimento per l'obiettivo di lettura giornaliero. */
export const READING_BOOK_PAGES = 300;
export const READING_DAILY_GOAL_PAGES = Math.round(READING_BOOK_PAGES / 30);

export interface ActivityDef {
  key: ActivityKey;
  label: string;
  shortLabel: string;
  icon: string; // nome icona Ionicons
  days: DayKey[];
  hasNumericInput: boolean;
  unit?: string;
}

export const ACTIVITY_DEFS: Record<ActivityKey, ActivityDef> = {
  ccna: {
    key: 'ccna',
    label: 'CCNA — Videolezione',
    shortLabel: 'CCNA',
    icon: 'server-outline',
    days: CCNA_ACTIVE_DAYS,
    hasNumericInput: false,
  },
  weights: {
    key: 'weights',
    label: 'Sala Pesi',
    shortLabel: 'PESI',
    icon: 'barbell-outline',
    days: ['tue', 'wed', 'fri'],
    hasNumericInput: false,
  },
  cardio: {
    key: 'cardio',
    label: 'Cardio',
    shortLabel: 'CARDIO',
    icon: 'pulse-outline',
    days: ['sat'],
    hasNumericInput: false,
  },
  walking: {
    key: 'walking',
    label: 'Camminata',
    shortLabel: 'PASSI',
    icon: 'walk-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    hasNumericInput: true,
    unit: 'passi',
  },
  water: {
    key: 'water',
    label: "2 Litri d'Acqua",
    shortLabel: 'ACQUA',
    icon: 'water-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    hasNumericInput: false,
  },
  english: {
    key: 'english',
    label: 'Inglese',
    shortLabel: 'ENG',
    icon: 'language-outline',
    days: ['tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    hasNumericInput: false,
  },
  reading: {
    key: 'reading',
    label: 'Lettura',
    shortLabel: 'LETTURA',
    icon: 'book-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    hasNumericInput: true,
    unit: 'pagine',
  },
};

export const ACTIVITY_ORDER: ActivityKey[] = [
  'ccna',
  'weights',
  'cardio',
  'walking',
  'water',
  'english',
  'reading',
];

/**
 * Il lunedì è "giorno libero" dagli impegni strutturati (CCNA, sala pesi,
 * cardio, inglese): questi non compaiono mai in `ACTIVITY_DEFS[...].days`
 * per il lunedì. Camminata, acqua e lettura restano invece attive tutti i
 * giorni, lunedì incluso.
 */
export function isRestDay(dayKey: DayKey): boolean {
  return dayKey === 'mon';
}

export function isCcnaCourseOver(date: Date): boolean {
  return date.getTime() > CCNA_END_DATE.getTime();
}

/**
 * Attività previste in un dato giorno, derivate dai giorni attivi di ogni
 * modulo in ACTIVITY_DEFS. Il CCNA compare solo nei giorni attivi, prima
 * della fine corso e finché restano lezioni.
 */
export function getScheduledActivities(
  date: Date,
  ccnaCompletedLessons: number
): ActivityKey[] {
  const dayKey = getDayKey(date);

  const scheduled: ActivityKey[] = [];
  for (const key of ACTIVITY_ORDER) {
    const def = ACTIVITY_DEFS[key];
    if (!def.days.includes(dayKey)) continue;

    if (key === 'ccna') {
      const courseFinished = isCcnaCourseOver(date) || ccnaCompletedLessons >= CCNA_TOTAL_LESSONS;
      if (courseFinished) continue;
    }

    scheduled.push(key);
  }
  return scheduled;
}

export function isActivityDone(entry?: { done: boolean }): boolean {
  return !!entry?.done;
}
