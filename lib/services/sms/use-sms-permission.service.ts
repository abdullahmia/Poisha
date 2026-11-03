import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { isSmsReaderAvailable, smsReader } from '@/modules/expo-sms-reader/src';

/**
 * - `unavailable` no SMS stack at all (iOS, web, tablets) — the feature hides
 * - `granted`     ready to scan
 * - `denied`      refused, but asking again is still allowed
 * - `blocked`     refused permanently; only system settings can undo it
 */
export type TSmsPermissionState = 'unavailable' | 'granted' | 'denied' | 'blocked';

export function useSmsPermission() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.permission,
    queryFn: async (): Promise<TSmsPermissionState> => {
      if (!smsReader || !isSmsReaderAvailable()) return 'unavailable';

      const response = await smsReader.getPermissionsAsync();
      if (response.granted) return 'granted';
      // `canAskAgain === false` is the only signal that an in-app prompt would
      // do nothing — the UI has to offer system settings instead of a button
      // that silently fails.
      return response.canAskAgain ? 'denied' : 'blocked';
    },
  });
}

/**
 * The raw request. Callers must wrap this in `runWithoutAutoLock` — the Android
 * permission dialog is a separate window, and with App Lock on it would
 * otherwise arm the lock and unmount the screen that started the request. That
 * wrapping lives in `use-sms.hook.ts`, because `useLock` is a hook and this
 * mutationFn is not a component.
 */
export function useRequestSmsPermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<TSmsPermissionState> => {
      if (!smsReader || !isSmsReaderAvailable()) return 'unavailable';

      const response = await smsReader.requestPermissionsAsync();
      if (response.granted) return 'granted';
      return response.canAskAgain ? 'denied' : 'blocked';
    },
    onSuccess: state => queryClient.setQueryData(QUERY_KEYS.sms.permission, state),
  });
}
