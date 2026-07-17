import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useCategoriesEnabled() {
  // No initialData: with the app-wide staleTime: Infinity, seeding a value here
  // would make the query look "already fetched" and skip reading the real
  // persisted flag from AsyncStorage on a fresh app start — it would silently
  // reset to this default on every cold launch instead of the saved value.
  return useQuery({
    queryKey: QUERY_KEYS.categories.enabled,
    queryFn: async (): Promise<boolean> => {
      const val = await storage.getItem(ASYNC_STORAGE_KEYS.categoriesEnabled);
      return val === 'true';
    },
  });
}
