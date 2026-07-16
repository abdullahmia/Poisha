import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TEntry } from '@/lib/types';

export interface EntriesSheetCtxValue {
  sheetOpen: boolean;
  sheetEntry: TEntry | null;
  openAdd: () => void;
  openEdit: (e: TEntry) => void;
  closeSheet: () => void;
}

export const EntriesSheetCtx = createContext<EntriesSheetCtxValue | null>(null);

export function EntriesSheetProvider({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<TEntry | null>(null);

  const openAdd = useCallback(() => { setSheetEntry(null); setSheetOpen(true); }, []);
  const openEdit = useCallback((e: TEntry) => { setSheetEntry(e); setSheetOpen(true); }, []);
  const closeSheet = useCallback(() => { setSheetOpen(false); setSheetEntry(null); }, []);

  // Memoized so consumers that only need a stable action (e.g. the always-mounted
  // tab bar's `openAdd`) don't re-render on every provider render — this value is
  // read by every entry row via useEntries(), so an unmemoized object here fans
  // out re-renders repo-wide any time sheetOpen/sheetEntry change.
  const value = useMemo(
    () => ({ sheetOpen, sheetEntry, openAdd, openEdit, closeSheet }),
    [sheetOpen, sheetEntry, openAdd, openEdit, closeSheet],
  );

  return (
    <EntriesSheetCtx.Provider value={value}>
      {children}
    </EntriesSheetCtx.Provider>
  );
}

export function useEntriesSheet() {
  const ctx = useContext(EntriesSheetCtx);
  if (!ctx) throw new Error('useEntriesSheet must be used within EntriesSheetProvider');
  return ctx;
}
