import { useCallback } from 'react';
import { useNotificationsEnabled as useNotificationsEnabledQuery, useSetNotificationsEnabled } from '@/lib/services/notifications';

export function useNotifications() {
  const notificationsEnabledQuery = useNotificationsEnabledQuery();
  const setNotificationsEnabledMutation = useSetNotificationsEnabled();

  const setNotificationsEnabled = useCallback(async (value: boolean) => {
    return setNotificationsEnabledMutation.mutateAsync(value);
  }, [setNotificationsEnabledMutation]);

  return { notificationsEnabled: notificationsEnabledQuery.data ?? false, setNotificationsEnabled };
}
