import { useMemo } from 'react';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import type { TEntry } from '@/lib/types';

export function useMonthlySummary(entries: TEntry[], monthKey: string, daysInMonth: number) {
  const { budget, getProgress } = useBudget();

  const monthEntries = useMemo(
    () => entries.filter(e => e.date.startsWith(monthKey)),
    [entries, monthKey],
  );

  const total = useMemo(
    () => monthEntries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0),
    [monthEntries],
  );

  const count = monthEntries.length;
  const txCount = monthEntries.reduce((s, e) => s + e.amounts.length, 0);

  const chartData = useMemo(() => {
    const map: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = 0;
    monthEntries.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + e.amounts.reduce((a, b) => a + b, 0);
    });
    return Object.entries(map).map(([day, amount]) => ({ day: parseInt(day), amount }));
  }, [monthEntries, daysInMonth]);

  const maxDay = useMemo(() => {
    if (chartData.every(d => d.amount === 0)) return null;
    return chartData.reduce((m, d) => (d.amount > (m?.amount ?? 0) ? d : m), null as typeof chartData[0] | null);
  }, [chartData]);

  const uniqueDays = new Set(monthEntries.map(e => e.date)).size;
  const avgDay = count > 0 ? total / uniqueDays : 0;

  const progress = getProgress(total);

  return { monthEntries, total, count, txCount, chartData, maxDay, avgDay, budget, progress };
}
