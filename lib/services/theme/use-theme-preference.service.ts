import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TColorScheme } from '@/lib/types';

export function useThemePreference() {
  return useQuery({
    queryKey: QUERY_KEYS.theme,
    queryFn: async (): Promise<TColorScheme> => {
      const raw = await storage.getItem(ASYNC_STORAGE_KEYS.theme);
      return raw === 'light' ? 'light' : 'dark';
    },
    initialData: 'dark' as TColorScheme,
  });
}
