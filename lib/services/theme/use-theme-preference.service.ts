import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TColorScheme } from '@/lib/types';

async function fetchThemePreference(): Promise<TColorScheme> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.theme);
  return raw === 'light' ? 'light' : 'dark';
}

export function useThemePreference() {
  return useQuery({
    queryKey: QUERY_KEYS.theme,
    queryFn: fetchThemePreference,
    initialData: 'dark' as TColorScheme,
  });
}
