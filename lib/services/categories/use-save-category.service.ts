import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TCategory } from '@/lib/types';

export function useSaveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: TCategory) => sqliteStorage.upsertCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories.all });
    },
  });
}
