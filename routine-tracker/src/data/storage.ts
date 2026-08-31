import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityEntry, ActivityKey, AppSettings, DailyRecord } from './types';
import { formatDateKey, getDayKey } from '../utils/date';

const KEYS = {
  records: '@uplink-routine/records',
  ccnaProgress: '@uplink-routine/ccna-progress',
  settings: '@uplink-routine/settings',
};

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  reminderHour: 19,
  reminderMinute: 0,
};

export async function getAllRecords(): Promise<Record<string, DailyRecord>> {
  const raw = await AsyncStorage.getItem(KEYS.records);
  return raw ? JSON.parse(raw) : {};
}

export async function getRecord(date: Date): Promise<DailyRecord | undefined> {
  const all = await getAllRecords();
  return all[formatDateKey(date)];
}

export function emptyRecordFor(date: Date): DailyRecord {
  return { date: formatDateKey(date), weekday: getDayKey(date), activities: {} };
}

export async function saveRecord(record: DailyRecord): Promise<void> {
  const all = await getAllRecords();
  all[record.date] = record;
  await AsyncStorage.setItem(KEYS.records, JSON.stringify(all));
}

export async function setActivityEntry(
  date: Date,
  activity: ActivityKey,
  entry: ActivityEntry
): Promise<DailyRecord> {
  const all = await getAllRecords();
  const key = formatDateKey(date);
  const existing = all[key] ?? emptyRecordFor(date);
  const updated: DailyRecord = {
    ...existing,
    activities: { ...existing.activities, [activity]: entry },
  };
  all[key] = updated;
  await AsyncStorage.setItem(KEYS.records, JSON.stringify(all));
  return updated;
}

export async function getCcnaProgress(): Promise<number> {
  const raw = await AsyncStorage.getItem(KEYS.ccnaProgress);
  return raw ? Number(raw) : 0;
}

export async function setCcnaProgress(value: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.ccnaProgress, String(value));
}

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEYS.settings);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
