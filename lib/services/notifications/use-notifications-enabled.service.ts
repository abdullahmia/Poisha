import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useNotificationsEnabled() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.enabled,
    queryFn: async (): Promise<boolean> => {
      const val = await storage.getItem(ASYNC_STORAGE_KEYS.notificationsEnabled);
      return val === 'true';
    },
    initialData: false,
  });
}
