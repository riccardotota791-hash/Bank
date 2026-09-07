import React from 'react';
import { Platform } from 'react-native';

const WIDGET_NAME = 'RoutineWidget';

/**
 * Richiede un refresh del widget schermata Home (solo Android). Va chiamata
 * dopo ogni modifica ai dati così il widget resta sincronizzato con l'app
 * anche quando è già presente sulla home. No-op su iOS/web e protetta da
 * try/catch: il modulo nativo del widget è best-effort e non deve mai far
 * crashare l'app se non fosse correttamente linkato in una build.
 */
export async function syncWidget(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    // Import dinamico: evita di caricare il modulo nativo su piattaforme
    // dove il pacchetto non è linkato.
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { RoutineWidget } = await import('./RoutineWidget');
    const { getAllRecords, getCcnaProgress } = await import('../data/storage');
    const { computeDayCompletion } = await import('../data/stats');
    const { WATER_GOAL_ML } = await import('../data/schedule');
    const { formatDateKey } = await import('../utils/date');

    await requestWidgetUpdate({
      widgetName: WIDGET_NAME,
      renderWidget: async () => {
        const today = new Date();
        const [records, ccnaProgress] = await Promise.all([getAllRecords(), getCcnaProgress()]);
        const record = records[formatDateKey(today)];
        const { doneCount, percent, scheduled } = computeDayCompletion(today, record, ccnaProgress);
        const waterValue = record?.activities.water?.value ?? 0;
        return React.createElement(RoutineWidget, {
          data: { percent, doneCount, scheduled, waterValue, waterGoal: WATER_GOAL_ML },
        });
      },
    });
  } catch {
    // Widget non disponibile in questa build (es. Expo Go, o link nativo
    // mancante): ignorato silenziosamente, non è una funzionalità critica.
  }
}
