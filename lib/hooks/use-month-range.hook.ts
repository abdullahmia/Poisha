import { useMemo } from 'react';

export function useMonthRange(monthOffset: number) {
  return useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return {
      monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    };
  }, [monthOffset]);
}
