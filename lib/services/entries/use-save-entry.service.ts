import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TDraft, TEntry } from '@/lib/types';
import { checkBudgetAndNotify } from '@/lib/utils/budget-notification.util';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

function saveEntry(draft: TDraft): TEntry {
  const entry: TEntry = draft.id
    ? ({ ...draft, id: draft.id } as TEntry)
    : ({ ...draft, id: `e_${Date.now()}` } as TEntry);
  sqliteStorage.upsertEntry(entry);
  return entry;
}

export function useSaveEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: TDraft) => saveEntry(draft),
    onSuccess: entry => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries.all });
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
      checkBudgetAndNotify(entry, queryClient).catch(() => {});
    },
  });
}
