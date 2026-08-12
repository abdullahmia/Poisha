import { useCategories } from "@/lib/hooks/use-categories.hook";
import { useLocale } from "@/lib/hooks/use-locale.hook";
import { usePlanCutoff } from "@/lib/hooks/use-plan-cutoff.hook";
import { usePlanMode } from "@/lib/hooks/use-plan-mode.hook";
import type { TCategoryFilter, TEntry } from "@/lib/types";
import { getPeriodRange, type TPeriod } from "@/lib/utils/date.util";
import { sumEntries } from "@/lib/utils/entries.util";
import { useMemo, useState } from "react";

export type TSortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export function useEntriesList(entries: TEntry[]) {
  const { locale } = useLocale();
  const { enabled: categoriesEnabled } = useCategories();
  const { enabled: planEnabled } = usePlanMode();
  const cutoff = usePlanCutoff();
  const [period, setPeriod] = useState<TPeriod>("month");
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<TSortKey>("date-desc");
  const [categoryFilter, setCategoryFilter] = useState<TCategoryFilter>("all");
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const isDateFiltering = dateFilter !== null;

  // Reset the category filter the moment the feature is disabled, rather than
  // silently keeping a stale filter that would reappear on re-enable — done
  // during render (not an effect) so it lands in the same commit.
  const [prevCategoriesEnabled, setPrevCategoriesEnabled] =
    useState(categoriesEnabled);
  if (categoriesEnabled !== prevCategoriesEnabled) {
    setPrevCategoriesEnabled(categoriesEnabled);
    if (!categoriesEnabled) setCategoryFilter("all");
  }

  // Same render-phase pattern for Plan Mode: turning it off while Browse sits on
  // the Upcoming period would strand the user on a filter whose chip no longer
  // exists and whose list is now permanently empty. Sort is restored alongside
  // the period because handlePeriodChange normally pairs the two, and this path
  // bypasses it.
  const [prevPlanEnabled, setPrevPlanEnabled] = useState(planEnabled);
  if (planEnabled !== prevPlanEnabled) {
    setPrevPlanEnabled(planEnabled);
    if (!planEnabled && period === "upcoming") {
      setPeriod("month");
      setOffset(0);
      setSort("date-desc");
    }
  }

  const sorts = useMemo(
    (): { key: TSortKey; label: string }[] => [
      { key: "date-desc", label: "Newest" },
      { key: "date-asc", label: "Oldest" },
      { key: "amount-desc", label: `Highest ${locale.symbol}` },
      { key: "amount-asc", label: `Lowest ${locale.symbol}` },
    ],
    [locale.symbol],
  );

  function handlePeriodChange(p: TPeriod) {
    setPeriod(p);
    setOffset(0);
    setCategoryFilter("all");
    if ((p === "upcoming") !== (period === "upcoming")) {
      setSort(p === "upcoming" ? "date-asc" : "date-desc");
    }
  }

  const range = useMemo(() => getPeriodRange(period, offset), [period, offset]);

  const filtered = useMemo(() => {
    // Every period except `upcoming` cuts at the plan cutoff — without it "This
    // Month", "This Year" and "All Time" would fold planned rows into
    // stats.total. The exact-day filter is the deliberate exception: picking a
    // future day off the calendar is how you ask "what's planned on the 20th".
    // With Plan Mode off the cutoff passes everything, reverting all of this.
    let base = isDateFiltering
      ? entries.filter((e) => e.date === dateFilter)
      : period === "upcoming"
        ? entries.filter((e) => e.date > cutoff)
        : period === "all"
          ? entries.filter((e) => e.date <= cutoff)
          : entries.filter(
              (e) =>
                e.date >= range.start && e.date <= range.end && e.date <= cutoff,
            );

    if (categoryFilter === "uncategorized")
      base = base.filter((e) => e.categoryId === null);
    else if (categoryFilter !== "all")
      base = base.filter((e) => e.categoryId === categoryFilter);

    return base.sort((a, b) => {
      if (sort === "date-desc")
        return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      if (sort === "date-asc")
        return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      const aT = a.amounts.reduce((s, n) => s + n, 0);
      const bT = b.amounts.reduce((s, n) => s + n, 0);
      return sort === "amount-desc" ? bT - aT : aT - bT;
    });
  }, [
    entries,
    period,
    offset,
    sort,
    range,
    categoryFilter,
    dateFilter,
    isDateFiltering,
    cutoff,
  ]);

  const stats = useMemo(() => {
    const total = sumEntries(filtered);
    const count = filtered.length;
    const items = filtered.reduce((s, e) => s + e.amounts.length, 0);
    const uniqueDays = new Set(filtered.map((e) => e.date)).size;
    const avgDay = uniqueDays > 0 ? Math.round(total / uniqueDays) : 0;
    // Upcoming spans arbitrary future dates, so a per-day average is meaningless
    // there — average per entry is the number that reads correctly.
    const avgEntry = count > 0 ? Math.round(total / count) : 0;
    const highest = filtered.reduce((m, e) => {
      const t = e.amounts.reduce((a, b) => a + b, 0);
      return t > m ? t : m;
    }, 0);
    return { total, count, items, uniqueDays, avgDay, avgEntry, highest };
  }, [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filtered]);

  const canGoForward = period !== "all" && period !== "upcoming" && offset < 0;
  const showGroups = sort === "date-desc" || sort === "date-asc";

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
