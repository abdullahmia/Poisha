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
    // placeholderData, not initialData — see use-theme-preference.service.ts.
    // This one mattered most: the toggle could read false while AsyncStorage
    // still said 'true', and plan-notification.util.ts / budget-notification.
    // util.ts read AsyncStorage directly — so alerts kept firing that the UI
    // claimed were off.
    placeholderData: false,
  });
}
