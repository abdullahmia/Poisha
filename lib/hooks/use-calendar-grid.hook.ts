import { useMemo, useState } from 'react';
import { dateToISO, isoToDate } from '@/lib/utils/date.util';

export interface TCalendarDay {
  date: Date;
  iso: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
}

export function useCalendarGrid(selectedISO: string, maximumDate?: Date) {
  const [viewDate, setViewDate] = useState(() => isoToDate(selectedISO));

  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const weeks = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const startOffset = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const todayISO = dateToISO(new Date());

    const makeCell = (date: Date, inCurrentMonth: boolean): TCalendarDay => {
      const iso = dateToISO(date);
      return {
        date,
        iso,
        day: date.getDate(),
        inCurrentMonth,
        isToday: iso === todayISO,
        isSelected: iso === selectedISO,
        isDisabled: maximumDate ? date.getTime() > maximumDate.getTime() : false,
      };
    };

    const cells: TCalendarDay[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(makeCell(new Date(year, month - 1, daysInPrevMonth - i), false));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(makeCell(new Date(year, month, d), true));
    }
    let trailing = 1;
    while (cells.length % 7 !== 0) {
      cells.push(makeCell(new Date(year, month + 1, trailing), false));
      trailing += 1;
    }

    const result: TCalendarDay[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [viewDate, selectedISO, maximumDate]);

  const canGoNext = useMemo(() => {
    if (!maximumDate) return true;
    const firstOfNextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    return firstOfNextMonth.getTime() <= maximumDate.getTime();
  }, [viewDate, maximumDate]);

  function goToPrevMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return { monthLabel, weeks, goToPrevMonth, goToNextMonth, canGoNext };
}
