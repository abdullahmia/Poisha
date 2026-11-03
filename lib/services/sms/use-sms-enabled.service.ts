import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import { syncBackgroundAlerts } from '@/lib/utils/sms-alerts.util';
import { initializeScanCursor } from '@/lib/utils/sms-scan.util';

export function useSmsEnabled() {
  // No initialData: with the app-wide staleTime: Infinity, seeding a value here
  // would make the query look "already fetched" and skip reading the real
  // persisted flag from AsyncStorage on a fresh app start.
  return useQuery({
    queryKey: QUERY_KEYS.sms.enabled,
    queryFn: async (): Promise<boolean> => {
      const val = await storage.getItem(ASYNC_STORAGE_KEYS.smsEnabled);
      return val === 'true';
    },
  });
}

export function useSetSmsEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.smsEnabled, String(value));

      if (value) {
        // Start the cursor at *now*, so enabling the feature never surfaces a
        // backlog of months-old messages. Re-enabling after a pause does the
        // same thing: the gap went unread, and silently importing it later
        // would be a surprise.
        await initializeScanCursor();
      } else {
        // Turning the feature off deletes what was waiting for review. The
        // confirmation copy promises exactly this, and leaving the queue to
        // reappear on re-enable would make "off" mean something else.
        sqliteStorage.clearSmsItems();
        await storage.removeItem(ASYNC_STORAGE_KEYS.smsLastScanAt);
      }

      // The background receiver lives in native code and reads a mirrored
      // flag. Without this, switching the feature off would leave it firing.
      await syncBackgroundAlerts();

      return value;
    },
    onSuccess: enabled => {
      queryClient.setQueryData(QUERY_KEYS.sms.enabled, enabled);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.lastScanAt });
    },
  });
}
