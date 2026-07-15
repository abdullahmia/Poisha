import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';
import { setPinCredentials } from './pin-storage.util';

export function useEnableLock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pin: string) => {
      await setPinCredentials(pin);
      await secureStorage.setItem(SECURE_STORAGE_KEYS.pinEnabled, '1');
      await secureStorage.setItem(SECURE_STORAGE_KEYS.pinOnboarded, '1');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin.status }),
  });
}
