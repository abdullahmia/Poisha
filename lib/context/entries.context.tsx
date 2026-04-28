import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useEffect, useState } from 'react';
import { SEED_ENTRIES, STORAGE_KEY } from '@/lib/data/seed.data';
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
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetEntry, setSheetEntry] = useState<Entry | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) setEntries(JSON.parse(raw));
        else { setEntries(SEED_ENTRIES); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_ENTRIES)); }
      })
      .catch(() => setEntries(SEED_ENTRIES))
      .finally(() => setLoading(false));
  }, []);

  const saveEntry = useCallback((draft: Draft) => {
    setEntries(prev => {
      const next = draft.id
        ? prev.map(e => e.id === draft.id ? { ...draft, id: draft.id } as Entry : e)
        : [...prev, { ...draft, id: `e_${Date.now()}` } as Entry];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const openAdd = useCallback(() => { setSheetEntry(null); setSheetOpen(true); }, []);
  const openEdit = useCallback((e: Entry) => { setSheetEntry(e); setSheetOpen(true); }, []);
  const closeSheet = useCallback(() => { setSheetOpen(false); setSheetEntry(null); }, []);

  return (
    <EntriesCtx.Provider value={{ entries, loading, saveEntry, deleteEntry, sheetOpen, sheetEntry, openAdd, openEdit, closeSheet }}>
      {children}
    </EntriesCtx.Provider>
  );
}
