import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';

/**
 * The row is kept, not deleted — its hash is the only thing stopping the same
 * message being re-detected and re-offered on every subsequent scan. Its body
 * is cleared by `resolveSmsItem`, so nothing of the message text survives the
 * dismissal.
 */
export function useDismissSmsItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      sqliteStorage.resolveSmsItem(id, 'dismissed', null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
    },
  });
}
