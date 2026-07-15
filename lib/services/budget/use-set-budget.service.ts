import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useSetBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: number | null): Promise<number | null> => {
      if (value === null) {
        await storage.removeItem(ASYNC_STORAGE_KEYS.budget);
      } else {
        await storage.setItem(ASYNC_STORAGE_KEYS.budget, String(value));
      }
      return value;
    },
    onSuccess: value => queryClient.setQueryData(QUERY_KEYS.budget.value, value),
  });
}
