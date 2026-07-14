import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';

export interface TPinStatus {
  onboarded: boolean;
  lockEnabled: boolean;
}

async function fetchPinStatus(): Promise<TPinStatus> {
  const [onboarded, enabled] = await Promise.all([
    secureStorage.getItem(SECURE_STORAGE_KEYS.pinOnboarded),
    secureStorage.getItem(SECURE_STORAGE_KEYS.pinEnabled),
  ]);
  return { onboarded: onboarded === '1', lockEnabled: enabled === '1' };
}

export function usePinStatus() {
  // No initialData: the app-bootstrap gate needs a real isPending signal
  // (see use-app-bootstrap.hook.ts) so it never flashes an unlocked or
  // onboarding screen before the real lock state is known.
  return useQuery({ queryKey: QUERY_KEYS.pin.status, queryFn: fetchPinStatus });
}
