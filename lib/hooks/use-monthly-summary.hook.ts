import { useMemo } from 'react';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { usePlanCutoff } from '@/lib/hooks/use-plan-cutoff.hook';
import type { TEntry } from '@/lib/types';
import { splitByUpcoming, sumEntries } from '@/lib/utils/entries.util';

export function useMonthlySummary(entries: TEntry[], monthKey: string, daysInMonth: number) {
  const { budget, getProgress } = useBudget();
  const cutoff = usePlanCutoff();

  // Cutting the month at the plan cutoff is what keeps every number below
  // actual-only — total, count, chart, avg/day and (via getProgress) the budget
  // bar all derive from monthEntries. For any past month the split is a no-op,
  // and with Plan Mode off the cutoff makes every entry actual.
  const { monthEntries, upcomingInMonth } = useMemo(() => {
    const inMonth = entries.filter(e => e.date.startsWith(monthKey));
    const { actual, upcoming } = splitByUpcoming(inMonth, cutoff);
    return { monthEntries: actual, upcomingInMonth: upcoming };
  }, [entries, monthKey, cutoff]);

  const total = useMemo(() => sumEntries(monthEntries), [monthEntries]);
  const plannedTotal = useMemo(() => sumEntries(upcomingInMonth), [upcomingInMonth]);

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

  // Planned spend keyed the same way as chartData, so the chart can render it as
  // ghost bars on days that haven't happened yet without a second scan.
  const plannedByDay = useMemo(() => {
    const map: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = 0;
    upcomingInMonth.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + e.amounts.reduce((a, b) => a + b, 0);
    });
    return Object.entries(map).map(([day, amount]) => ({ day: parseInt(day), amount }));
  }, [upcomingInMonth, daysInMonth]);

  const maxDay = useMemo(() => {
    if (chartData.every(d => d.amount === 0)) return null;
    return chartData.reduce((m, d) => (d.amount > (m?.amount ?? 0) ? d : m), null as typeof chartData[0] | null);
  }, [chartData]);

  const uniqueDays = new Set(monthEntries.map(e => e.date)).size;
  const avgDay = count > 0 ? total / uniqueDays : 0;

  const progress = getProgress(total);

  return {
    monthEntries,
    upcomingInMonth,
    total,
    plannedTotal,
    count,
    txCount,
    chartData,
    plannedByDay,
    maxDay,
    avgDay,
    budget,
    progress,
  };
}
