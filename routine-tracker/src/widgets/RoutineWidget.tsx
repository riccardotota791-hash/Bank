import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

export interface RoutineWidgetData {
  percent: number;
  doneCount: number;
  scheduled: number;
  waterValue: number;
  waterGoal: number;
}

/**
 * Widget schermata Home (Android). Mostra la % di completamento di oggi e
 * due azioni rapide (acqua, passi) che aggiornano AsyncStorage in background
 * tramite il widget-task-handler, senza aprire l'app.
 *
 * ATTENZIONE: componente non verificato su dispositivo reale in questa
 * sessione (nessun emulatore/telefono disponibile) — vedi README per come
 * testarlo con `eas build --profile development`.
 */
export function RoutineWidget({ data }: { data: RoutineWidgetData }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#0d1a29',
        borderRadius: 20,
        padding: 14,
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget style={{ flexDirection: 'column' }}>
        <TextWidget
          text="UPLINK ROUTINE"
          style={{ fontSize: 10, color: '#7f9bb3', letterSpacing: 1, fontWeight: 'bold' }}
        />
        <TextWidget
          text={`${data.percent}%`}
          style={{ fontSize: 30, color: '#2de3c9', fontWeight: 'bold', marginTop: 2 }}
        />
        <TextWidget
          text={`${data.doneCount}/${data.scheduled} moduli completati`}
          style={{ fontSize: 11, color: '#e7f3ff', marginTop: 2 }}
        />
      </FlexWidget>

      <FlexWidget style={{ flexDirection: 'row', flexGap: 8 }}>
        <FlexWidget
          clickAction="ADD_WATER"
          style={{
            flex: 1,
            backgroundColor: '#134d44',
            borderRadius: 12,
            padding: 8,
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget text="+250ml" style={{ fontSize: 12, color: '#2de3c9', fontWeight: 'bold' }} />
          <TextWidget text="Acqua" style={{ fontSize: 9, color: '#7f9bb3' }} />
        </FlexWidget>
        <FlexWidget
          clickAction="ADD_STEPS"
          style={{
            flex: 1,
            backgroundColor: '#134d44',
            borderRadius: 12,
            padding: 8,
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <TextWidget text="+1000" style={{ fontSize: 12, color: '#2de3c9', fontWeight: 'bold' }} />
          <TextWidget text="Passi" style={{ fontSize: 9, color: '#7f9bb3' }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
