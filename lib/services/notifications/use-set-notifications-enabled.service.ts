import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useSetNotificationsEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      if (!value) {
        await storage.setItem(ASYNC_STORAGE_KEYS.notificationsEnabled, 'false');
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      await storage.setItem(ASYNC_STORAGE_KEYS.notificationsEnabled, String(granted));
      return granted;
    },
    onSuccess: enabled => queryClient.setQueryData(QUERY_KEYS.notifications.enabled, enabled),
  });
}
