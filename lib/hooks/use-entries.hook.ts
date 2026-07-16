import { useCallback } from 'react';
import { useEntriesSheet } from '@/lib/context/entries-sheet.context';
import {
  useDeleteEntry,
  useEntries as useEntriesQuery,
  useImportEntries,
  useSaveEntry,
} from '@/lib/services/entries';
import type { TDraft, TEntry } from '@/lib/types';

export function useEntries() {
  const sheet = useEntriesSheet();

  const entriesQuery = useEntriesQuery();
  const saveEntryMutation = useSaveEntry();
  const deleteEntryMutation = useDeleteEntry();
  const importEntriesMutation = useImportEntries();

  const saveEntry = useCallback((draft: TDraft) => {
    saveEntryMutation.mutate(draft);
  }, [saveEntryMutation]);

  const deleteEntry = useCallback((id: string) => {
    deleteEntryMutation.mutate(id);
  }, [deleteEntryMutation]);

  const importEntries = useCallback((imported: TEntry[], replace: boolean) => {
    importEntriesMutation.mutate({ imported, replace });
  }, [importEntriesMutation]);

  return {
    entries: entriesQuery.data ?? [],
    loading: entriesQuery.isPending,
    saveEntry,
    deleteEntry,
    importEntries,
    ...sheet,
  };
}
