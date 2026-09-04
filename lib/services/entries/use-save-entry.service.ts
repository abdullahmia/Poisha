import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TDraft, TEntry } from '@/lib/types';
import { checkBudgetAndNotify } from '@/lib/utils/budget-notification.util';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

export function useSaveEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: TDraft): Promise<TEntry> => {
      // Random, not `Date.now()`: ids are written into Drive backups that
      // outlive the install, and two devices creating an entry in the same
      // millisecond would collide — which INSERT OR REPLACE resolves by
      // silently destroying a row rather than erroring.
      const entry: TEntry = draft.id
        ? ({ ...draft, id: draft.id } as TEntry)
        : ({ ...draft, id: `e_${Crypto.randomUUID()}` } as TEntry);
      sqliteStorage.upsertEntry(entry);
      return entry;
    },
    onSuccess: entry => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries.all });
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
      syncPlanDueNotifications();
      checkBudgetAndNotify(entry, queryClient).catch(() => {});
    },
  });
}
