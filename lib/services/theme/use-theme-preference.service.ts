import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TThemePreference } from '@/lib/types';

export function useThemePreference() {
  return useQuery({
    queryKey: QUERY_KEYS.theme,
    queryFn: async (): Promise<TThemePreference> => {
      const raw = await storage.getItem(ASYNC_STORAGE_KEYS.theme);
      // Back-compatible: values written before `system` existed were already
      // 'light' or 'dark', so they keep resolving to themselves. No migration.
      return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'dark';
    },
    initialData: 'dark' as TThemePreference,
  });
}
