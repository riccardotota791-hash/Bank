import { DayKey } from '../data/types';

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Lunedì',
  tue: 'Martedì',
  wed: 'Mercoledì',
  thu: 'Giovedì',
  fri: 'Venerdì',
  sat: 'Sabato',
  sun: 'Domenica',
};

export const DAY_LABELS_SHORT: Record<DayKey, string> = {
  mon: 'LUN',
  tue: 'MAR',
  wed: 'MER',
  thu: 'GIO',
  fri: 'VEN',
  sat: 'SAB',
  sun: 'DOM',
};

export const MONTH_LABELS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];

export function getDayKey(date: Date): DayKey {
  return DAY_KEYS[date.getDay()];
}

/** ISO weekday con convenzione Expo Notifications: 1 = Domenica ... 7 = Sabato. */
export function toExpoWeekday(dayKey: DayKey): number {
  return DAY_KEYS.indexOf(dayKey) + 1;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return formatDateKey(a) === formatDateKey(b);
}

/** Ultimi n giorni inclusa la data indicata, in ordine dal più vecchio al più recente. */
export function lastNDays(date: Date, n: number): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(startOfDay(addDays(date, -i)));
  }
  return days;
}

/** Lunedì della settimana della data indicata. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const dayKey = getDayKey(d);
  const offsetFromMonday = DAY_KEYS.indexOf(dayKey) === 0 ? 6 : DAY_KEYS.indexOf(dayKey) - 1;
  return addDays(d, -offsetFromMonday);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatHuman(date: Date): string {
  return `${date.getDate()} ${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShort(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}`;
}
