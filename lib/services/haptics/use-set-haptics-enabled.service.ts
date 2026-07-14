import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';

export function useSetHapticsEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => storage.setItem(ASYNC_STORAGE_KEYS.haptics, enabled ? '1' : '0'),
    onSuccess: (_data, enabled) => queryClient.setQueryData(QUERY_KEYS.haptics, enabled),
  });
}
