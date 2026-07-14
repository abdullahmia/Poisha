import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TEntry } from '@/lib/types';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

interface TImportEntriesInput {
  imported: TEntry[];
  replace: boolean;
}

function importEntries({ imported, replace }: TImportEntriesInput): void {
  if (replace) {
    for (const e of sqliteStorage.loadEntries()) sqliteStorage.removeEntry(e.id);
  }
  for (const e of imported) sqliteStorage.upsertEntry(e);
}

export function useImportEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TImportEntriesInput) => importEntries(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries.all });
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
    },
  });
}
