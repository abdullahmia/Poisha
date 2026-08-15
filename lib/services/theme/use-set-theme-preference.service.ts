import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TThemePreference } from '@/lib/types';

export function useSetThemePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preference: TThemePreference): Promise<TThemePreference> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.theme, preference);
      return preference;
    },
    // Applied synchronously in onMutate (not onSuccess) so the UI flips
    // the instant the toggle is pressed, in step with the crossfade
    // overlay — not delayed by the AsyncStorage write's latency.
    onMutate: preference => queryClient.setQueryData(QUERY_KEYS.theme, preference),
  });
}
