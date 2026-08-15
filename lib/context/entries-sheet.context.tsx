import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TEntry } from '@/lib/types';

export interface EntriesSheetCtxValue {
  sheetOpen: boolean;
  sheetEntry: TEntry | null;
  /** Date the form should open on when adding. Null means today. */
  sheetDefaultDate: string | null;
  openAdd: (defaultDate?: string) => void;
  openEdit: (e: TEntry) => void;
  closeSheet: () => void;
}

export const EntriesSheetCtx = createContext<EntriesSheetCtxValue | null>(null);

export function EntriesSheetProvider({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<TEntry | null>(null);
  const [sheetDefaultDate, setSheetDefaultDate] = useState<string | null>(null);

  // `defaultDate` lets a caller open the form already pointed at a day — the
  // Plan screen's "Schedule an expense" needs a future date, or the sheet would
  // open on today and offer to log rather than schedule.
  const openAdd = useCallback((defaultDate?: string) => {
    setSheetEntry(null);
    setSheetDefaultDate(defaultDate ?? null);
    setSheetOpen(true);
  }, []);
  const openEdit = useCallback((e: TEntry) => {
    setSheetEntry(e);
    setSheetDefaultDate(null);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    setSheetEntry(null);
    setSheetDefaultDate(null);
  }, []);

  // Memoized so consumers that only need a stable action (e.g. the always-mounted
  // tab bar's `openAdd`) don't re-render on every provider render — this value is
  // read by every entry row via useEntries(), so an unmemoized object here fans
  // out re-renders repo-wide any time sheetOpen/sheetEntry change.
  const value = useMemo(
    () => ({ sheetOpen, sheetEntry, sheetDefaultDate, openAdd, openEdit, closeSheet }),
    [sheetOpen, sheetEntry, sheetDefaultDate, openAdd, openEdit, closeSheet],
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
