import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

async function fetchExceededMonth(): Promise<string | null> {
  return storage.getItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);
}

export function useBudgetExceededMonth() {
  return useQuery({
    queryKey: QUERY_KEYS.budget.exceededMonth,
    queryFn: fetchExceededMonth,
    initialData: null,
  });
}

export function useMarkBudgetExceededMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (monthKey: string) => storage.setItem(ASYNC_STORAGE_KEYS.budgetExceededMonth, monthKey),
    onSuccess: (_data, monthKey) => queryClient.setQueryData(QUERY_KEYS.budget.exceededMonth, monthKey),
  });
}
