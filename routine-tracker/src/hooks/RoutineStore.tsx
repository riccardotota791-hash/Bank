import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CCNA_TOTAL_LESSONS } from '../data/schedule';
import {
  DEFAULT_SETTINGS,
  getAllRecords,
  getCcnaProgress,
  getSettings,
  saveSettings,
  setActivityEntry,
  setCcnaProgress,
} from '../data/storage';
import { ActivityKey, AppSettings, DailyRecord } from '../data/types';
import { formatDateKey } from '../utils/date';
import { rescheduleReminders } from '../notifications/reminders';

interface RoutineContextValue {
  loading: boolean;
  records: Record<string, DailyRecord>;
  ccnaProgress: number;
  settings: AppSettings;
  toggleActivity: (date: Date, key: ActivityKey) => Promise<void>;
  setActivityValue: (date: Date, key: ActivityKey, value: number) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

const RoutineContext = createContext<RoutineContextValue | undefined>(undefined);

export function RoutineProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Record<string, DailyRecord>>({});
  const [ccnaProgress, setCcnaProgressState] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

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

  const toggleActivity = useCallback(
    async (date: Date, key: ActivityKey) => {
      const dateKey = formatDateKey(date);
      const existing = records[dateKey]?.activities[key];
      const nextDone = !existing?.done;

      if (key === 'ccna') {
        let nextProgress = ccnaProgress;
        let entry;
        if (nextDone) {
          nextProgress = Math.min(CCNA_TOTAL_LESSONS, ccnaProgress + 1);
          entry = { done: true, lessonNumber: nextProgress };
        } else {
          if (existing?.lessonNumber === ccnaProgress) {
            nextProgress = Math.max(0, ccnaProgress - 1);
          }
          entry = { done: false };
        }
        await setCcnaProgress(nextProgress);
        setCcnaProgressState(nextProgress);
        const updated = await setActivityEntry(date, key, entry);
        setRecords((prev) => ({ ...prev, [dateKey]: updated }));
        await rescheduleReminders();
        return;
      }

      const updated = await setActivityEntry(date, key, {
        done: nextDone,
        value: existing?.value,
      });
      setRecords((prev) => ({ ...prev, [dateKey]: updated }));
    },
    [records, ccnaProgress]
  );

  const setActivityValue = useCallback(
    async (date: Date, key: ActivityKey, value: number) => {
      const dateKey = formatDateKey(date);
      const existing = records[dateKey]?.activities[key];
      const updated = await setActivityEntry(date, key, {
        done: existing?.done ?? false,
        value,
      });
      setRecords((prev) => ({ ...prev, [dateKey]: updated }));
    },
    [records]
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
    () => ({ loading, records, ccnaProgress, settings, toggleActivity, setActivityValue, updateSettings, refresh }),
    [loading, records, ccnaProgress, settings, toggleActivity, setActivityValue, updateSettings, refresh]
  );

  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

export function useRoutineStore(): RoutineContextValue {
  const ctx = useContext(RoutineContext);
  if (!ctx) throw new Error('useRoutineStore deve essere usato dentro RoutineProvider');
  return ctx;
}
