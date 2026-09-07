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

/** Stato a tre livelli di un modulo: non iniziato, in corso (parziale), completato. */
export type ActivityStatus = 'pending' | 'partial' | 'done';

export interface ActivityEntry {
  status: ActivityStatus;
  /** Passi per "walking", pagine per "reading", millilitri per "water". */
  value?: number;
  /** Numero di lezione CCNA associata a questo giorno (solo per "ccna"). */
  lessonNumber?: number;
}

/** Template di giornata: "auto" segue le regole per giorno della settimana. */
export type DayTemplateId = 'auto' | 'work' | 'study' | 'free' | 'rest';

export interface DailyRecord {
  date: string; // YYYY-MM-DD
  weekday: DayKey;
  activities: Partial<Record<ActivityKey, ActivityEntry>>;
  /** Nota libera di fine giornata (diario rapido), opzionale. */
  note?: string;
  /** Template scelto manualmente per questa data, se diverso da "auto". */
  template?: DayTemplateId;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** Orario del promemoria dedicato al modulo Pillole (indipendente dagli altri). */
  pillsReminderHour: number;
  pillsReminderMinute: number;
}
