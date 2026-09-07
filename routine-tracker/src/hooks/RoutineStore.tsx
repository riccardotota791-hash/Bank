import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ACTIVITY_DEFS, CCNA_TOTAL_LESSONS, statusFromCounterValue } from '../data/schedule';
import { computeDayCompletion } from '../data/stats';
import {
  DEFAULT_SETTINGS,
  getAllRecords,
  getCcnaProgress,
  getSettings,
  saveSettings,
  setActivityEntry,
  setCcnaProgress,
  setDayNote,
  setDayTemplate,
} from '../data/storage';
import { ActivityKey, ActivityStatus, AppSettings, DailyRecord, DayTemplateId } from '../data/types';
import { formatDateKey, isSameDay } from '../utils/date';
import { rescheduleReminders } from '../notifications/reminders';
import { syncWidget } from '../widgets/syncWidget';

interface RoutineContextValue {
  loading: boolean;
  records: Record<string, DailyRecord>;
  ccnaProgress: number;
  settings: AppSettings;
  celebrating: boolean;
  dismissCelebration: () => void;
  setActivityStatus: (date: Date, key: ActivityKey, status: ActivityStatus) => Promise<void>;
  setActivityValue: (date: Date, key: ActivityKey, value: number) => Promise<void>;
  incrementCounter: (date: Date, key: ActivityKey, delta: number) => Promise<void>;
  setNote: (date: Date, note: string) => Promise<void>;
  setTemplate: (date: Date, template: DayTemplateId) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const RoutineContext = createContext<RoutineContextValue | undefined>(undefined);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [ccnaProgress, setCcnaProgressState] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [celebrating, setCelebrating] = useState(false);

  const refresh = useCallback(async () => {
    const [allRecords, progress, storedSettings] = await Promise.all([
      getAllRecords(),
      getCcnaProgress(),
      getSettings(),
    ]);
    setRecords(allRecords);
    setCcnaProgressState(progress);
    setSettings(storedSettings);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
      await rescheduleReminders();
    })();
  }, [refresh]);

  const dismissCelebration = useCallback(() => setCelebrating(false), []);

  /** Buzz leggero ad ogni cambio di stato + celebrazione se la giornata odierna raggiunge il 100%. */
  const notifyStatusChange = useCallback(
    (date: Date, dateKey: string, nextRecords: Record<string, DailyRecord>, ccnaForCheck: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (!isSameDay(date, new Date())) return;
      const { percent, scheduled } = computeDayCompletion(date, nextRecords[dateKey], ccnaForCheck);
      if (scheduled > 0 && percent >= 100) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setCelebrating(true);
      }
      syncWidget();
    },
    []
  );

  const setActivityStatus = useCallback(
    async (date: Date, key: ActivityKey, status: ActivityStatus) => {
      const dateKey = formatDateKey(date);
      const existing = records[dateKey]?.activities[key];

      if (key === 'ccna') {
        const wasDone = existing?.status === 'done';
        const nowDone = status === 'done';
        let nextProgress = ccnaProgress;
        let entry: { status: ActivityStatus; lessonNumber?: number };

        if (nowDone && !wasDone) {
          nextProgress = Math.min(CCNA_TOTAL_LESSONS, ccnaProgress + 1);
          entry = { status, lessonNumber: nextProgress };
        } else if (!nowDone && wasDone) {
          if (existing?.lessonNumber === ccnaProgress) {
            nextProgress = Math.max(0, ccnaProgress - 1);
          }
          entry = { status };
        } else {
          entry = { status, lessonNumber: existing?.lessonNumber };
        }

        await setCcnaProgress(nextProgress);
        setCcnaProgressState(nextProgress);
        const updated = await setActivityEntry(date, key, entry);
        const nextRecords = { ...records, [dateKey]: updated };
        setRecords(nextRecords);
        notifyStatusChange(date, dateKey, nextRecords, nextProgress);
        await rescheduleReminders();
        return;
      }

      const updated = await setActivityEntry(date, key, { status, value: existing?.value });
      const nextRecords = { ...records, [dateKey]: updated };
      setRecords(nextRecords);
      notifyStatusChange(date, dateKey, nextRecords, ccnaProgress);
    },
    [records, ccnaProgress, notifyStatusChange]
  );

  const setActivityValue = useCallback(
    async (date: Date, key: ActivityKey, value: number) => {
      const dateKey = formatDateKey(date);
      const existing = records[dateKey]?.activities[key];
      const updated = await setActivityEntry(date, key, {
        status: existing?.status ?? 'pending',
        value,
      });
      setRecords((prev) => ({ ...prev, [dateKey]: updated }));
      syncWidget();
    },
    [records]
  );

  /**
   * Contatore rapido per i moduli "counter" (acqua, denti, ...): lo stato del
   * modulo è derivato automaticamente confrontando il totale con l'obiettivo
   * definito in ACTIVITY_DEFS.
   */
  const incrementCounter = useCallback(
    async (date: Date, key: ActivityKey, delta: number) => {
      const dateKey = formatDateKey(date);
      const existing = records[dateKey]?.activities[key];
      const goal = ACTIVITY_DEFS[key].goal ?? 0;
      const nextValue = Math.max(0, (existing?.value ?? 0) + delta);
      const updated = await setActivityEntry(date, key, {
        status: statusFromCounterValue(nextValue, goal),
        value: nextValue,
      });
      const nextRecords = { ...records, [dateKey]: updated };
      setRecords(nextRecords);
      notifyStatusChange(date, dateKey, nextRecords, ccnaProgress);
    },
    [records, ccnaProgress, notifyStatusChange]
  );

  const setNote = useCallback(async (date: Date, note: string) => {
    const dateKey = formatDateKey(date);
    const updated = await setDayNote(date, note);
    setRecords((prev) => ({ ...prev, [dateKey]: updated }));
  }, []);

  const setTemplate = useCallback(
    async (date: Date, template: DayTemplateId) => {
      const dateKey = formatDateKey(date);
      const updated = await setDayTemplate(date, template);
      setRecords((prev) => ({ ...prev, [dateKey]: updated }));
    },
    []
  );

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
      await rescheduleReminders();
    },
    [settings]
  );

  const value = useMemo(
    () => ({
      loading,
      records,
      ccnaProgress,
      settings,
      celebrating,
      dismissCelebration,
      setActivityStatus,
      setActivityValue,
      incrementCounter,
      setNote,
      setTemplate,
      updateSettings,
      refresh,
    }),
    [
      loading,
      records,
      ccnaProgress,
      settings,
      celebrating,
      dismissCelebration,
      setActivityStatus,
      setActivityValue,
      incrementCounter,
      setNote,
      setTemplate,
      updateSettings,
      refresh,
    ]
  );

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutineStore(): RoutineContextValue {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error('useRoutineStore deve essere usato dentro RoutineProvider');
  return ctx;
}
