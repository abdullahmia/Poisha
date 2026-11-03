import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { useSaveEntry } from '@/lib/services/entries';
import { sqliteStorage } from '@/lib/storages';
import type { TDraft, TSmsItem } from '@/lib/types';
import { smsItemToDraft } from '@/lib/utils/sms-item.util';

export interface TAcceptSmsInput {
  item: TSmsItem;
  /** From the edit sheet. Omitted means accept the parse as-is. */
  draft?: TDraft;
}

/**
 * Turns one reviewed message into an entry.
 *
 * Routes through `useSaveEntry` rather than calling `sqliteStorage.upsertEntry`
 * directly, and that is not incidental: `useSaveEntry.onSuccess` is what
 * refreshes the home-screen widget snapshot, re-syncs plan notifications and
 * fires the budget alert. Writing the row straight to SQLite would produce an
 * entry that is correct in the database and invisible to all three, with no
 * error anywhere to explain why.
 */
export function useAcceptSmsItem() {
  const queryClient = useQueryClient();
  const saveEntry = useSaveEntry();

  return useMutation({
    mutationFn: async ({ item, draft }: TAcceptSmsInput): Promise<void> => {
      const payload = draft ?? smsItemToDraft(item);
      if (payload.amounts.length === 0) return;

      // Provenance is forced here rather than trusted from the caller — an
      // accepted item must always be traceable back to the message it came from.
      const entry = await saveEntry.mutateAsync({ ...payload, source: 'sms', sourceRef: item.id });
      sqliteStorage.resolveSmsItem(item.id, 'accepted', entry.id);
    },
    onSuccess: () => {
      // The entries query is already invalidated by useSaveEntry; these are the
      // queue-side views that nothing else knows to refresh.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
    },
  });
}
