import { ActivityKey, ActivityStatus, DayKey, DayTemplateId } from './types';
import { getDayKey } from '../utils/date';

export const CCNA_TOTAL_LESSONS = 30;
export const CCNA_LESSON_HOURS = 3;
/** Metà novembre 2026: dopo questa data il corso CCNA è concluso e il modulo sparisce. */
export const CCNA_END_DATE = new Date(2026, 10, 15, 23, 59, 59); // 15 novembre 2026
export const CCNA_ACTIVE_DAYS: DayKey[] = ['tue', 'thu', 'sat'];

/** Valore di default del promemoria Pillole, modificabile dall'utente nelle Impostazioni. */
export const DEFAULT_PILLS_REMINDER_HOUR = 9;
export const DEFAULT_PILLS_REMINDER_MINUTE = 0;

export const WALKING_GOAL_STEPS = 10000;
export const WATER_GOAL_ML = 2000;
export const WATER_QUICK_ADD_ML = [250, 500];
/** Un libro al mese di media lunghezza: usato come riferimento per l'obiettivo di lettura giornaliero. */
export const READING_BOOK_PAGES = 300;
export const READING_DAILY_GOAL_PAGES = Math.round(READING_BOOK_PAGES / 30);

export type ActivityKind = 'toggle' | 'numeric' | 'counter';

export interface ActivityDef {
  key: ActivityKey;
  label: string;
  shortLabel: string;
  icon: string; // nome icona Ionicons
  days: DayKey[];
  kind: ActivityKind;
  unit?: string;
  /** Obiettivo numerico (passi, pagine, ml) quando applicabile. */
  goal?: number;
}

export const ACTIVITY_DEFS: Record<ActivityKey, ActivityDef> = {
  ccna: {
    key: 'ccna',
    label: 'CCNA — Videolezione',
    shortLabel: 'CCNA',
    icon: 'server-outline',
    days: CCNA_ACTIVE_DAYS,
    kind: 'toggle',
  },
  weights: {
    key: 'weights',
    label: 'Sala Pesi',
    shortLabel: 'PESI',
    icon: 'barbell-outline',
    days: ['tue', 'wed', 'fri'],
    kind: 'toggle',
  },
  cardio: {
    key: 'cardio',
    label: 'Cardio',
    shortLabel: 'CARDIO',
    icon: 'pulse-outline',
    days: ['sat'],
    kind: 'toggle',
  },
  walking: {
    key: 'walking',
    label: 'Camminata',
    shortLabel: 'PASSI',
    icon: 'walk-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    kind: 'numeric',
    unit: 'passi',
    goal: WALKING_GOAL_STEPS,
  },
  water: {
    key: 'water',
    label: "2 Litri d'Acqua",
    shortLabel: 'ACQUA',
    icon: 'water-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    kind: 'counter',
    unit: 'ml',
    goal: WATER_GOAL_ML,
  },
  pills: {
    key: 'pills',
    label: 'Pillole',
    shortLabel: 'PILLOLE',
    icon: 'medkit-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    kind: 'toggle',
  },
  english: {
    key: 'english',
    label: 'Inglese',
    shortLabel: 'ENG',
    icon: 'language-outline',
    days: ['tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    kind: 'toggle',
  },
  reading: {
    key: 'reading',
    label: 'Lettura',
    shortLabel: 'LETTURA',
    icon: 'book-outline',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    kind: 'numeric',
    unit: 'pagine',
    goal: READING_DAILY_GOAL_PAGES,
  },
};

export const ACTIVITY_ORDER: ActivityKey[] = [
  'ccna',
  'weights',
  'cardio',
  'walking',
  'water',
  'pills',
  'english',
  'reading',
];

/**
 * Template di giornata: un elenco esplicito di moduli attivi, selezionabile
 * manualmente dall'utente per superare la regola automatica per giorno della
 * settimana (es. "oggi lavoro da casa" anche se è martedì).
 */
export const DAY_TEMPLATES: Record<
  Exclude<DayTemplateId, 'auto'>,
  { label: string; icon: string; activities: ActivityKey[] }
> = {
  work: {
    label: 'Giorno Lavoro',
    icon: 'briefcase-outline',
    activities: ['weights', 'walking', 'water', 'pills', 'english', 'reading'],
  },
  study: {
    label: 'Giorno Studio',
    icon: 'school-outline',
    activities: ['ccna', 'walking', 'water', 'pills', 'english', 'reading'],
  },
  free: {
    label: 'Giorno Libero',
    icon: 'sunny-outline',
    activities: ['walking', 'water', 'pills', 'reading'],
  },
  rest: {
    label: 'Giorno Riposo',
    icon: 'bed-outline',
    activities: ['water', 'pills', 'reading'],
  },
};

export const DAY_TEMPLATE_ORDER: DayTemplateId[] = ['auto', 'work', 'study', 'free', 'rest'];

export const DAY_TEMPLATE_LABELS: Record<DayTemplateId, string> = {
  auto: 'Automatico',
  work: DAY_TEMPLATES.work.label,
  study: DAY_TEMPLATES.study.label,
  free: DAY_TEMPLATES.free.label,
  rest: DAY_TEMPLATES.rest.label,
};

/**
 * Il lunedì è "giorno libero" dagli impegni strutturati (CCNA, sala pesi,
 * cardio, inglese): questi non compaiono mai in `ACTIVITY_DEFS[...].days`
 * per il lunedì. Camminata, acqua, pillole e lettura restano invece attive
 * tutti i giorni, lunedì incluso. Un template manuale (vedi DAY_TEMPLATES)
 * può comunque sovrascrivere questa regola per una singola data.
 */
export function isRestDay(dayKey: DayKey): boolean {
  return dayKey === 'mon';
}

export function isCcnaCourseOver(date: Date): boolean {
  return date.getTime() > CCNA_END_DATE.getTime();
}

function isCourseFinished(date: Date, ccnaCompletedLessons: number): boolean {
  return isCcnaCourseOver(date) || ccnaCompletedLessons >= CCNA_TOTAL_LESSONS;
}

/**
 * Attività previste in un dato giorno. Se `templateOverride` è impostato su
 * un template diverso da "auto", i moduli attivi sono quelli del template;
 * altrimenti derivano dai giorni attivi di ogni modulo in ACTIVITY_DEFS.
 * Il CCNA compare solo prima della fine corso e finché restano lezioni,
 * indipendentemente dal template.
 */
export function getScheduledActivities(
  date: Date,
  ccnaCompletedLessons: number,
  templateOverride?: DayTemplateId
): ActivityKey[] {
  const dayKey = getDayKey(date);
  const courseFinished = isCourseFinished(date, ccnaCompletedLessons);
  const templateActivities =
    templateOverride && templateOverride !== 'auto'
      ? new Set(DAY_TEMPLATES[templateOverride].activities)
      : null;

  const scheduled: ActivityKey[] = [];
  for (const key of ACTIVITY_ORDER) {
    if (key === 'ccna' && courseFinished) continue;

    if (templateActivities) {
      if (templateActivities.has(key)) scheduled.push(key);
      continue;
    }

    if (ACTIVITY_DEFS[key].days.includes(dayKey)) scheduled.push(key);
  }
  return scheduled;
}

export function isActivityDone(entry?: { status: ActivityStatus }): boolean {
  return entry?.status === 'done';
}

export function isActivityPartial(entry?: { status: ActivityStatus }): boolean {
  return entry?.status === 'partial';
}

/** Peso di un modulo verso il completamento giornaliero: fatto=1, parziale=0.5, altro=0. */
export function activityWeight(entry?: { status: ActivityStatus }): number {
  if (entry?.status === 'done') return 1;
  if (entry?.status === 'partial') return 0.5;
  return 0;
}

export function statusFromWaterValue(ml: number): ActivityStatus {
  if (ml >= WATER_GOAL_ML) return 'done';
  if (ml > 0) return 'partial';
  return 'pending';
}
