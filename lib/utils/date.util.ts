export function todayISO(): string {
  return dateToISO(new Date());
}

// A date no real entry can exceed. Used as the "plan cutoff" when Plan Mode is
// off: every `date <= NO_CUTOFF` test passes and every `isUpcomingISO(date,
// NO_CUTOFF)` is false, so the planned-entry model collapses to "everything is
// actual" with no branching at any consumer.
export const NO_CUTOFF = '9999-12-31';

// ISO YYYY-MM-DD strings sort chronologically, so "is this date in the future"
// is a plain string comparison — no Date objects, no timezone surface. `today`
// is a parameter so callers can pass a stable value from `useToday()` and stay
// referentially correct inside `useMemo` instead of each reading the clock.
export function isUpcomingISO(iso: string, today: string = todayISO()): boolean {
  return iso > today;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLong(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  return isoToDate(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export type TPeriod = 'day' | 'week' | 'month' | 'year' | 'all' | 'upcoming';

export interface TPeriodRange {
  start: string;
  end: string;
  label: string;
  sublabel: string;
}

export function getPeriodRange(period: TPeriod, offset: number): TPeriodRange {
  if (period === 'all') return { start: '', end: '', label: 'All Time', sublabel: 'every entry' };
  if (period === 'upcoming') return { start: '', end: '', label: 'Upcoming', sublabel: 'planned entries' };

  const now = new Date();

  if (period === 'day') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const iso = dateToISO(d);
    const label = offset === 0
      ? 'Today'
      : offset === -1
        ? 'Yesterday'
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      start: iso,
      end: iso,
      label,
      sublabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }

  if (period === 'week') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const startFmt = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFmt = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      start: dateToISO(monday),
      end: dateToISO(sunday),
      label: offset === 0 ? 'This Week' : `${startFmt} – ${endFmt}`,
      sublabel: `${startFmt} – ${endFmt}, ${sunday.getFullYear()}`,
    };
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: dateToISO(d),
      end: dateToISO(end),
      label: offset === 0 ? 'This Month' : d.toLocaleDateString('en-US', { month: 'long' }),
      sublabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  const year = now.getFullYear() + offset;
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: offset === 0 ? 'This Year' : String(year),
    sublabel: String(year),
  };
}
