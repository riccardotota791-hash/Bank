export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type ActivityKey =
  | 'ccna'
  | 'weights'
  | 'cardio'
  | 'walking'
  | 'water'
  | 'pills'
  | 'english'
  | 'reading';

export interface ActivityEntry {
  done: boolean;
  /** Passi per "walking", pagine per "reading". */
  value?: number;
  /** Numero di lezione CCNA associata a questo giorno (solo per "ccna"). */
  lessonNumber?: number;
}

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  weekday: DayKey;
  activities: Partial<Record<ActivityKey, ActivityEntry>>;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}
