import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';
import { setPinCredentials } from './pin-storage.util';

async function enableLock(pin: string): Promise<void> {
  await setPinCredentials(pin);
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinEnabled, '1');
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinOnboarded, '1');
}

export function useEnableLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableLock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin.status }),
  });
}
