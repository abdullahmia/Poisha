import type { TEntry } from '@/lib/types';

// Planned-ness is derived, never stored: an entry is upcoming iff its date is
// past `today`. One pass so the two lists always agree with each other.
export function splitByUpcoming(entries: TEntry[], today: string): { actual: TEntry[]; upcoming: TEntry[] } {
  const actual: TEntry[] = [];
  const upcoming: TEntry[] = [];
  for (const e of entries) (e.date > today ? upcoming : actual).push(e);
  return { actual, upcoming };
}

export function sumEntries(entries: TEntry[]): number {
  return entries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
}
