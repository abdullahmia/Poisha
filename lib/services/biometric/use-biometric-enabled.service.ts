import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';

async function fetchBiometricEnabled(): Promise<boolean> {
  const val = await secureStorage.getItem(SECURE_STORAGE_KEYS.biometricEnabled);
  return val === '1';
}

export function useBiometricEnabled() {
  // No initialData: the app-bootstrap gate needs a real isPending signal,
  // matching use-pin-status.service.ts.
  return useQuery({ queryKey: QUERY_KEYS.biometric.enabled, queryFn: fetchBiometricEnabled });
}

export function useSetBiometricEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) =>
      secureStorage.setItem(SECURE_STORAGE_KEYS.biometricEnabled, enabled ? '1' : '0'),
    onSuccess: (_data, enabled) => queryClient.setQueryData(QUERY_KEYS.biometric.enabled, enabled),
  });
}
