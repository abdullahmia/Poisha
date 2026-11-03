import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TEntry, TSmsItem } from '@/lib/types';
import { checkBudgetAndNotify } from '@/lib/utils/budget-notification.util';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';
import { smsItemToDraft } from '@/lib/utils/sms-item.util';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

/**
 * "Add all" — accepts the whole queue in one pass.
 *
 * Deliberately shaped like `use-import-entries.service.ts` rather than looping
 * `useAcceptSmsItem`: the per-entry side effects fire once at the end instead
 * of N times. N widget-snapshot writes are N file writes, N plan re-syncs each
 * cancel and rebuild the entire notification schedule, and N budget checks
 * would each schedule a notification for any month boundary they crossed.
 *
 * `checkBudgetAndNotify` still runs once, with the newest entry — a bulk accept
 * can absolutely push the month over budget, and that is worth saying.
 */
export function useAcceptSmsItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: TSmsItem[]): Promise<TEntry | null> => {
      let last: TEntry | null = null;

      for (const item of items) {
        const draft = smsItemToDraft(item);
        if (draft.amounts.length === 0) continue;

        const entry: TEntry = {
          ...draft,
          id: `e_${Crypto.randomUUID()}`,
          source: 'sms',
          sourceRef: item.id,
        };
        sqliteStorage.upsertEntry(entry);
        sqliteStorage.resolveSmsItem(item.id, 'accepted', entry.id);
        last = entry;
      }

      return last;
    },
    onSuccess: last => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });

      if (!last) return;
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
      syncPlanDueNotifications();
      checkBudgetAndNotify(last, queryClient).catch(() => {});
    },
  });
}
