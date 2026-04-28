import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { LedgerDatabase } from '@/lib/storage/database';
import {
  deleteEntry as dbDeleteEntry,
  getEntries,
  migrateFromAsyncStorage,
  saveEntry as dbSaveEntry,
  seedIfEmpty,
} from '@/lib/services/entries.service';
import type { Draft, Entry } from '@/lib/types/entry.type';

export interface EntriesCtxValue {
  entries: Entry[];
  loading: boolean;
  saveEntry: (e: Draft) => void;
  deleteEntry: (id: string) => void;
  sheetOpen: boolean;
  sheetEntry: Entry | null;
  openAdd: () => void;
  openEdit: (e: Entry) => void;
  closeSheet: () => void;
}

export const EntriesCtx = createContext<EntriesCtxValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const db = useMemo(() => new LedgerDatabase(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<Entry | null>(null);

  useEffect(() => {
    migrateFromAsyncStorage(db)
      .then(() => {
        seedIfEmpty(db);
        setEntries(getEntries(db));
      })
      .catch(() => {
        seedIfEmpty(db);
        setEntries(getEntries(db));
      })
      .finally(() => setLoading(false));
  }, [db]);

  const saveEntry = useCallback((draft: Draft) => {
    const entry = dbSaveEntry(db, draft);
    setEntries(prev =>
      draft.id ? prev.map(e => (e.id === entry.id ? entry : e)) : [...prev, entry]
    );
  }, [db]);

  const deleteEntry = useCallback((id: string) => {
    dbDeleteEntry(db, id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }, [db]);

  const openAdd = useCallback(() => { setSheetEntry(null); setSheetOpen(true); }, []);
  const openEdit = useCallback((e: Entry) => { setSheetEntry(e); setSheetOpen(true); }, []);
  const closeSheet = useCallback(() => { setSheetOpen(false); setSheetEntry(null); }, []);

  return (
    <EntriesCtx.Provider value={{ entries, loading, saveEntry, deleteEntry, sheetOpen, sheetEntry, openAdd, openEdit, closeSheet }}>
      {children}
    </EntriesCtx.Provider>
  );
}
