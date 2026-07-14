import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';
import { deletePinCredentials } from './pin-storage.util';

async function disableLock(): Promise<void> {
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinEnabled, '0');
  await deletePinCredentials();
}

export function useDisableLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableLock,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin.status }),
  });
}
