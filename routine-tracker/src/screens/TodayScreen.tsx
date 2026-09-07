import React, { useMemo } from 'react';
import { DayScreen } from './DayScreen';

export default function TodayScreen() {
  const today = useMemo(() => new Date(), []);
  return <DayScreen date={today} />;
}
