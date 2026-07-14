import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { setPinCredentials } from './pin-storage.util';

export function useSetPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setPinCredentials,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pin.status }),
  });
}
