import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { PoishaDatabase } from '@/lib/storage/database';
import {
  deleteEntry as dbDeleteEntry,
  getEntries,
  migrateFromAsyncStorage,
  saveEntry as dbSaveEntry,
} from '@/lib/services/entries.service';
import type { Draft, Entry } from '@/lib/types/entry.type';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

export interface EntriesCtxValue {
  entries: Entry[];
  loading: boolean;
  saveEntry: (e: Draft) => void;
  deleteEntry: (id: string) => void;
  importEntries: (imported: Entry[], replace: boolean) => void;
  sheetOpen: boolean;
  sheetEntry: Entry | null;
  openAdd: () => void;
  openEdit: (e: Entry) => void;
  closeSheet: () => void;
}

export const EntriesCtx = createContext<EntriesCtxValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const db = useMemo(() => new PoishaDatabase(), []);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<Entry | null>(null);

  useEffect(() => {
    migrateFromAsyncStorage(db)
      .then(() => {
        setEntries(getEntries(db));
      })
      .catch(() => {
        setEntries(getEntries(db));
      })
      .finally(() => setLoading(false));
  }, [db]);

  const saveEntry = useCallback((draft: Draft) => {
    const entry = dbSaveEntry(db, draft);
    setEntries(prev =>
      draft.id ? prev.map(e => (e.id === entry.id ? entry : e)) : [...prev, entry]
    );
    writeWidgetSnapshot(getEntries(db)).catch(() => {});
  }, [db]);

  const deleteEntry = useCallback((id: string) => {
    dbDeleteEntry(db, id);
    setEntries(prev => prev.filter(e => e.id !== id));
    writeWidgetSnapshot(getEntries(db)).catch(() => {});
  }, [db]);

  const importEntries = useCallback((imported: Entry[], replace: boolean) => {
    if (replace) {
      for (const e of db.loadEntries()) db.removeEntry(e.id);
      for (const e of imported) db.upsertEntry(e);
    } else {
      for (const e of imported) db.upsertEntry(e);
    }
    const newEntries = db.loadEntries();
    setEntries(newEntries);
    writeWidgetSnapshot(newEntries).catch(() => {});
  }, [db]);

  const openAdd = useCallback(() => { setSheetEntry(null); setSheetOpen(true); }, []);
  const openEdit = useCallback((e: Entry) => { setSheetEntry(e); setSheetOpen(true); }, []);
  const closeSheet = useCallback(() => { setSheetOpen(false); setSheetEntry(null); }, []);

  return (
    <EntriesCtx.Provider value={{ entries, loading, saveEntry, deleteEntry, importEntries, sheetOpen, sheetEntry, openAdd, openEdit, closeSheet }}>
      {children}
    </EntriesCtx.Provider>
  );
}
