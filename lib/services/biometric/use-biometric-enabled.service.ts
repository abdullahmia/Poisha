import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useBiometricEnabled() {
  return useQuery({ queryKey: QUERY_KEYS.biometric.enabled, queryFn: async () => {
    const enabled = await secureStorage.getItem(SECURE_STORAGE_KEYS.biometricEnabled);
    return enabled === '1';
  } });
}

export function useSetBiometricEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) =>
      secureStorage.setItem(SECURE_STORAGE_KEYS.biometricEnabled, enabled ? '1' : '0'),
    onSuccess: (_data, enabled) => queryClient.setQueryData(QUERY_KEYS.biometric.enabled, enabled),
  });
}
