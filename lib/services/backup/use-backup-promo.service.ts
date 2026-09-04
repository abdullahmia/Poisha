import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

/**
 * Whether the user has dismissed the Home-screen banner announcing Drive
 * backup. Deliberately not in `BACKED_UP_SETTING_KEYS`: it is a one-off
 * "you've seen this" nudge for a single release, not a preference worth
 * carrying to another device.
 *
 * No `initialData` — see use-plan-mode-enabled.service.ts. `placeholderData`
 * is `true` rather than `false` so the banner cannot flash in for a frame on
 * every cold start before AsyncStorage answers.
 */
export function useBackupPromoDismissed() {
  return useQuery({
    queryKey: QUERY_KEYS.backup.promoDismissed,
    queryFn: async (): Promise<boolean> => {
      const val = await storage.getItem(ASYNC_STORAGE_KEYS.backupPromoDismissed);
      return val === 'true';
    },
    placeholderData: true,
  });
}

export function useDismissBackupPromo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.backupPromoDismissed, 'true');
    },
    // Optimistic: the banner should disappear on the tap, not after the write.
    onMutate: () => queryClient.setQueryData(QUERY_KEYS.backup.promoDismissed, true),
  });
}
