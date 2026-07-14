import { createContext, useCallback, useState } from 'react';
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

  return (
    <EntriesSheetCtx.Provider value={{ sheetOpen, sheetEntry, openAdd, openEdit, closeSheet }}>
      {children}
    </EntriesSheetCtx.Provider>
  );
}
