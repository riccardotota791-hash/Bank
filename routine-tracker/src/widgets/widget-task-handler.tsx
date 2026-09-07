import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { statusFromWaterValue, WATER_GOAL_ML } from '../data/schedule';
import { getAllRecords, getCcnaProgress, setActivityEntry } from '../data/storage';
import { computeDayCompletion } from '../data/stats';
import { formatDateKey } from '../utils/date';
import { RoutineWidget, RoutineWidgetData } from './RoutineWidget';

async function buildWidgetData(): Promise<RoutineWidgetData> {
  const today = new Date();
  const [records, ccnaProgress] = await Promise.all([getAllRecords(), getCcnaProgress()]);
  const record = records[formatDateKey(today)];
  const { doneCount, percent, scheduled } = computeDayCompletion(today, record, ccnaProgress);
  const waterValue = record?.activities.water?.value ?? 0;
  return { percent, doneCount, scheduled, waterValue, waterGoal: WATER_GOAL_ML };
}

async function addWaterFromWidget(): Promise<void> {
  const today = new Date();
  const records = await getAllRecords();
  const currentValue = records[formatDateKey(today)]?.activities.water?.value ?? 0;
  const nextValue = Math.min(WATER_GOAL_ML * 3, currentValue + 250);
  await setActivityEntry(today, 'water', { status: statusFromWaterValue(nextValue), value: nextValue });
}

async function addStepsFromWidget(): Promise<void> {
  const today = new Date();
  const records = await getAllRecords();
  const entry = records[formatDateKey(today)]?.activities.walking;
  const nextValue = (entry?.value ?? 0) + 1000;
  await setActivityEntry(today, 'walking', { status: entry?.status ?? 'pending', value: nextValue });
}

/**
 * Task handler eseguito dal sistema Android in background (headless) quando
 * il widget viene aggiunto, aggiornato, ridimensionato o toccato. Legge/
 * scrive gli stessi dati AsyncStorage usati dall'app (nessun duplicato).
 *
 * ATTENZIONE: non verificato su dispositivo reale in questa sessione (nessun
 * emulatore/telefono Android disponibile nell'ambiente di sviluppo) — vedi
 * README per come testarlo con `eas build --profile development`.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await buildWidgetData();
      props.renderWidget(<RoutineWidget data={data} />);
      break;
    }
    case 'WIDGET_CLICK': {
      if (props.clickAction === 'ADD_WATER') await addWaterFromWidget();
      if (props.clickAction === 'ADD_STEPS') await addStepsFromWidget();
      const data = await buildWidgetData();
      props.renderWidget(<RoutineWidget data={data} />);
      break;
    }
    default:
      break;
  }
}

