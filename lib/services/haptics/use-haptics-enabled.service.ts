import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

async function fetchHapticsEnabled(): Promise<boolean> {
  const val = await storage.getItem(ASYNC_STORAGE_KEYS.haptics);
  return val !== '0';
}

export function useHapticsEnabled() {
  return useQuery({
    queryKey: QUERY_KEYS.haptics,
    queryFn: fetchHapticsEnabled,
    initialData: true,
  });
}
