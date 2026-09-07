import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

/**
 * Wrapper sul sensore passi (`expo-sensors` Pedometer).
 *
 * IMPORTANTE — limite noto della piattaforma: su iOS `getStepCountAsync`
 * restituisce il totale passi reale in un intervallo (usiamo "da mezzanotte
 * a ora" per il conteggio storico di oggi). Su Android, expo-sensors espone
 * solo `watchStepCount`, che riporta i passi accumulati da quando il
 * listener è stato avviato — NON un totale storico della giornata. Per
 * questo su Android il valore live va sommato manualmente al totale già
 * inserito (pulsante "Aggiungi al totale"), invece di sostituirlo.
 */
export function usePedometer() {
  const [checked, setChecked] = useState(false);
  const [available, setAvailable] = useState(false);
  const [liveSteps, setLiveSteps] = useState(0);
  const [historicalSteps, setHistoricalSteps] = useState<number | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let isAvailable = false;
      try {
        isAvailable = await Pedometer.isAvailableAsync();
      } catch {
        isAvailable = false;
      }
      if (cancelled) return;
      if (!isAvailable) {
        setAvailable(false);
        setChecked(true);
        return;
      }

      let permissionGranted = false;
      try {
        const current = await Pedometer.getPermissionsAsync();
        permissionGranted = current.granted || (await Pedometer.requestPermissionsAsync()).granted;
      } catch {
        permissionGranted = false;
      }
      if (cancelled) return;
      setAvailable(permissionGranted);
      setChecked(true);
      if (!permissionGranted) return;

      if (Platform.OS === 'ios') {
        try {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const result = await Pedometer.getStepCountAsync(start, end);
          if (!cancelled) setHistoricalSteps(result.steps);
        } catch {
          // Permesso negato o dato non disponibile su questo dispositivo: si
          // resta sull'inserimento manuale, nessun errore bloccante.
        }
      }

      try {
        subscriptionRef.current = Pedometer.watchStepCount((result) => {
          // Il valore riportato è già cumulativo dall'avvio del listener.
          setLiveSteps(result.steps);
        });
      } catch {
        // watchStepCount non supportato: si resta sull'inserimento manuale.
      }
    })();

    return () => {
      cancelled = true;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  const resetLiveSteps = useCallback(() => setLiveSteps(0), []);

  return { checked, available, liveSteps, historicalSteps, resetLiveSteps, platform: Platform.OS };
}
