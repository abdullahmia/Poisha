import type { Entry } from '@/lib/types/entry.type';

export const STORAGE_KEY = 'tracker_entries';

export const SEED_ENTRIES: Entry[] = [
  { id: 's1', date: '2026-04-03', amounts: [2667], note: '' },
  { id: 's2', date: '2026-04-03', amounts: [3000], note: '' },
  { id: 's3', date: '2026-04-06', amounts: [890, 500, 1320, 10000], note: '' },
];
