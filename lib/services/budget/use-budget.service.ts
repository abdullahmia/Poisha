import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

async function fetchBudget(): Promise<number | null> {
  const val = await storage.getItem(ASYNC_STORAGE_KEYS.budget);
  if (!val) return null;
  const parsed = parseFloat(val);
  return Number.isNaN(parsed) ? null : parsed;
}

export function useBudget() {
  return useQuery({
    queryKey: QUERY_KEYS.budget.value,
    queryFn: fetchBudget,
    initialData: null,
  });
}
