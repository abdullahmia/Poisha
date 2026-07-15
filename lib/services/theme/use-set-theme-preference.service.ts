import { useMutation, useQueryClient } from '@tanstack/react-query';
import { colorScheme as nativeWindColorScheme } from 'nativewind';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TColorScheme } from '@/lib/types';

export function useSetThemePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheme: TColorScheme): Promise<TColorScheme> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.theme, scheme);
      nativeWindColorScheme.set(scheme);
      return scheme;
    },
    onSuccess: scheme => queryClient.setQueryData(QUERY_KEYS.theme, scheme),
  });
}
