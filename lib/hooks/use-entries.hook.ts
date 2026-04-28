import { useContext } from 'react';
import { EntriesCtx } from '@/lib/context/entries.context';

export function useEntries() {
  const ctx = useContext(EntriesCtx);
  if (!ctx) throw new Error('useEntries must be within EntriesProvider');
  return ctx;
}
