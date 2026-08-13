import { useMemo } from 'react';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { usePlanCutoff } from '@/lib/hooks/use-plan-cutoff.hook';
import type { TCategory, TEntry } from '@/lib/types';
import { isoToDate } from '@/lib/utils/date.util';
import { sumEntries } from '@/lib/utils/entries.util';

export type TPlanMonth = {
  key: string; // YYYY-MM
  label: string; // "September 2026"
  entries: TEntry[];
  planned: number;
  actual: number;
  projected: number;
  percentOfBudget: number;
};

export type TPlanCategorySlice = {
  category: TCategory | null; // null = Uncategorized
  total: number;
  share: number; // 0–1 of plannedTotal
};

function monthLabel(key: string): string {
  return isoToDate(`${key}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function daysBetween(fromISO: string, toISO: string): number {
  const ms = isoToDate(toISO).getTime() - isoToDate(fromISO).getTime();
  return Math.round(ms / 86_400_000);
}

export function usePlanSummary() {
  const { entries } = useEntries();
  const { budget } = useBudget();
  const { enabled: categoriesEnabled, categories } = useCategories();
  const cutoff = usePlanCutoff();

  const planned = useMemo(
    () =>
      entries
        .filter(e => e.date > cutoff)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    [entries, cutoff],
  );

  const plannedTotal = useMemo(() => sumEntries(planned), [planned]);

  const nextDue = useMemo(() => {
    const entry = planned[0];
    if (!entry) return null;
    // Measured from the cutoff, not a fresh todayISO(), so it can never disagree
    // with the planned/actual split rendered beside it.
    return { entry, daysAway: daysBetween(cutoff, entry.date) };
  }, [planned, cutoff]);

  // The figure the Plan screen exists to show: planned money never stands alone,
  // it stands next to what's already been spent in the same month.
  const thisMonth = useMemo(() => {
    const key = cutoff.slice(0, 7);
    const inMonth = entries.filter(e => e.date.startsWith(key));
    const actual = sumEntries(inMonth.filter(e => e.date <= cutoff));
    const plannedNow = sumEntries(inMonth.filter(e => e.date > cutoff));
    return { actual, planned: plannedNow, projected: actual + plannedNow };
  }, [entries, cutoff]);

  const months = useMemo((): TPlanMonth[] => {
    const keys = [...new Set(planned.map(e => e.date.slice(0, 7)))].sort();
    return keys.map(key => {
      const inMonth = entries.filter(e => e.date.startsWith(key));
      // `actual` is only ever non-zero for the current month, but it's computed
      // per month rather than special-cased — otherwise back-dating an entry
      // into a month you'd also planned into would silently under-report.
      const actual = sumEntries(inMonth.filter(e => e.date <= cutoff));
      const monthEntries = planned.filter(e => e.date.startsWith(key));
      const plannedSum = sumEntries(monthEntries);
      const projected = actual + plannedSum;
      return {
        key,
        label: monthLabel(key),
        entries: monthEntries,
        planned: plannedSum,
        actual,
        projected,
        // Measured on projected, not planned: "will I blow September's budget"
        // has to include what's already gone.
        percentOfBudget: budget && budget > 0 ? (projected / budget) * 100 : 0,
      };
    });
  }, [planned, entries, cutoff, budget]);

  const categoryBreakdown = useMemo((): TPlanCategorySlice[] => {
    if (!categoriesEnabled || plannedTotal === 0) return [];
    const totals = new Map<string | null, number>();
    for (const e of planned) {
      const key = e.categoryId;
      totals.set(key, (totals.get(key) ?? 0) + e.amounts.reduce((a, b) => a + b, 0));
    }
    return [...totals.entries()]
      .map(([id, total]) => ({
        // Uncategorized folds into a null slice rather than being dropped, or
        // the shares wouldn't sum to the total.
        category: id ? categories.find(c => c.id === id) ?? null : null,
        total,
        share: total / plannedTotal,
      }))
      .sort((a, b) => b.total - a.total);
  }, [planned, plannedTotal, categories, categoriesEnabled]);

  return {
    planned,
    plannedTotal,
    count: planned.length,
    nextDue,
    thisMonth,
    months,
    categoryBreakdown,
    budget,
  };
}
