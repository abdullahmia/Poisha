import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';
import { deletePinCredentials } from './pin-storage.util';

export function useDisableLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await secureStorage.setItem(SECURE_STORAGE_KEYS.pinEnabled, '0');
      await deletePinCredentials();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin.status }),
  });
}
