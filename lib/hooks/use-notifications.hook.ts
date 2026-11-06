import { useCallback } from 'react';
import { useNotificationsEnabled as useNotificationsEnabledQuery, useSetNotificationsEnabled } from '@/lib/services/notifications';
import { useLock } from './use-lock.hook';

export function useNotifications() {
  const { runWithoutAutoLock } = useLock();
  const notificationsEnabledQuery = useNotificationsEnabledQuery();
  const setNotificationsEnabledMutation = useSetNotificationsEnabled();

  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    // Enabling may raise the OS permission prompt, which takes the app out of
    // 'active' and would otherwise lock it mid-request.
    if (!value) return setNotificationsEnabledMutation.mutateAsync(false);
    return runWithoutAutoLock(() => setNotificationsEnabledMutation.mutateAsync(true));
  }, [runWithoutAutoLock, setNotificationsEnabledMutation]);

  return { notificationsEnabled: notificationsEnabledQuery.data ?? false, setNotificationsEnabled };
}
