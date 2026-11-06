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
    // Applied synchronously in onMutate (not onSuccess) so the UI flips the
    // moment the transition commits, while its cover is still opaque — not
    // some time later, after the AsyncStorage write, when it may be fading.
    onMutate: preference => queryClient.setQueryData(QUERY_KEYS.theme, preference),
  });
}
