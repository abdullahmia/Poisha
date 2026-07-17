import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';

export function useCategories() {
  // No initialData — same reasoning as use-categories-enabled.service.ts:
  // it would mask the real SQLite read behind the app-wide staleTime: Infinity
  // and show an empty list until some unrelated mutation forced a refetch.
  return useQuery({
    queryKey: QUERY_KEYS.categories.all,
    queryFn: async () => sqliteStorage.loadCategories(),
  });
}
