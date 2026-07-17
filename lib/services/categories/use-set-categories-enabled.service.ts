import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useSetCategoriesEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.categoriesEnabled, String(value));
      return value;
    },
    onSuccess: enabled => queryClient.setQueryData(QUERY_KEYS.categories.enabled, enabled),
  });
}
