import { useMemo, useState } from 'react';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TCategoryFilter, TEntry } from '@/lib/types';
import { getPeriodRange, type TPeriod } from '@/lib/utils/date.util';

export type TSortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export function useEntriesList(entries: TEntry[]) {
  const { locale } = useLocale();
  const { enabled: categoriesEnabled } = useCategories();
  const [period, setPeriod] = useState<TPeriod>('month');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<TSortKey>('date-desc');
  const [categoryFilter, setCategoryFilter] = useState<TCategoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const isDateFiltering = dateFilter !== null;

  // Reset the category filter the moment the feature is disabled, rather than
  // silently keeping a stale filter that would reappear on re-enable — done
  // during render (not an effect) so it lands in the same commit.
  const [prevCategoriesEnabled, setPrevCategoriesEnabled] = useState(categoriesEnabled);
  if (categoriesEnabled !== prevCategoriesEnabled) {
    setPrevCategoriesEnabled(categoriesEnabled);
    if (!categoriesEnabled) setCategoryFilter('all');
  }

  const sorts = useMemo((): { key: TSortKey; label: string }[] => [
    { key: 'date-desc', label: 'Newest' },
    { key: 'date-asc', label: 'Oldest' },
    { key: 'amount-desc', label: `Highest ${locale.symbol}` },
    { key: 'amount-asc', label: `Lowest ${locale.symbol}` },
  ], [locale.symbol]);

  function handlePeriodChange(p: TPeriod) {
    setPeriod(p);
    setOffset(0);
    setCategoryFilter('all');
  }

  const range = useMemo(() => getPeriodRange(period, offset), [period, offset]);

  const filtered = useMemo(() => {
    let base = isDateFiltering
      ? entries.filter(e => e.date === dateFilter)
      : period === 'all'
        ? [...entries]
        : entries.filter(e => e.date >= range.start && e.date <= range.end);

    if (categoryFilter === 'uncategorized') base = base.filter(e => e.categoryId === null);
    else if (categoryFilter !== 'all') base = base.filter(e => e.categoryId === categoryFilter);

    return base.sort((a, b) => {
      if (sort === 'date-desc') return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      if (sort === 'date-asc') return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      const aT = a.amounts.reduce((s, n) => s + n, 0);
      const bT = b.amounts.reduce((s, n) => s + n, 0);
      return sort === 'amount-desc' ? bT - aT : aT - bT;
    });
  }, [entries, period, offset, sort, range, categoryFilter, dateFilter, isDateFiltering]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
    const count = filtered.length;
    const items = filtered.reduce((s, e) => s + e.amounts.length, 0);
    const uniqueDays = new Set(filtered.map(e => e.date)).size;
    const avgDay = uniqueDays > 0 ? Math.round(total / uniqueDays) : 0;
    const highest = filtered.reduce((m, e) => {
      const t = e.amounts.reduce((a, b) => a + b, 0);
      return t > m ? t : m;
    }, 0);
    return { total, count, items, uniqueDays, avgDay, highest };
  }, [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filtered]);

  const canGoForward = period !== 'all' && offset < 0;
  const showGroups = sort === 'date-desc' || sort === 'date-asc';

  return {
    period,
    offset,
    sort,
    setSort,
    setOffset,
    sorts,
    handlePeriodChange,
    range,
    filtered,
    stats,
    grouped,
    canGoForward,
    showGroups,
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    isDateFiltering,
  };
}
