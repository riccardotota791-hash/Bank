import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { DayScreen } from './DayScreen';
import { addDays, formatDateKey, parseDateKey, startOfDay } from '../utils/date';

/** Route params attesi: { dateKey: 'YYYY-MM-DD' }. */
export default function DayDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dateKey: string = route.params?.dateKey ?? formatDateKey(new Date());
  const date = useMemo(() => parseDateKey(dateKey), [dateKey]);

  const today = useMemo(() => startOfDay(new Date()), []);
  const canGoNext = date.getTime() < today.getTime();

  const goToDate = (nextDate: Date) => {
    navigation.setParams({ dateKey: formatDateKey(nextDate) });
  };

  return (
    <DayScreen
      date={date}
      onBack={() => navigation.goBack()}
      onPrevDay={() => goToDate(addDays(date, -1))}
      onNextDay={canGoNext ? () => goToDate(addDays(date, 1)) : undefined}
      canGoNext={canGoNext}
    />
  );
}
