import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initDatabase } from '../db/database';
import { getAllSettings, setSetting as setSettingRepo, setSettings as setSettingsRepo } from '../db/settingsRepo';
import { initNotifications } from '../services/notifications';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettingsState] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const s = await getAllSettings();
        setSettingsState(s);
        setReady(true);
        initNotifications().catch((e) => console.warn('Notifiche non disponibili', e));
      } catch (e) {
        console.error('Errore inizializzazione database', e);
        setError(e);
      }
    })();
  }, []);

  const refresh = useCallback(() => setDataVersion((v) => v + 1), []);

  const reloadSettings = useCallback(async () => {
    const s = await getAllSettings();
    setSettingsState(s);
    return s;
  }, []);

  const updateSetting = useCallback(async (key, value) => {
    await setSettingRepo(key, value);
    await reloadSettings();
    refresh();
  }, [reloadSettings, refresh]);

  const updateSettings = useCallback(async (obj) => {
    await setSettingsRepo(obj);
    await reloadSettings();
    refresh();
  }, [reloadSettings, refresh]);

  const value = {
    ready,
    error,
    settings,
    dataVersion,
    refresh,
    reloadSettings,
    updateSetting,
    updateSettings,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve essere usato dentro AppProvider');
  return ctx;
}
