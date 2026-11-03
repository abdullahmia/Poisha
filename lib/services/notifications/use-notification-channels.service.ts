import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';
import { syncBackgroundAlerts } from '@/lib/utils/sms-alerts.util';

// The two sub-channels under the master notifications permission. Both default
// to ON: the master switch used to gate everything by itself, so anyone who had
// notifications on must keep receiving exactly what they were receiving before
// the split. Only an explicit 'false' turns a channel off.
async function readChannel(key: string): Promise<boolean> {
  return (await storage.getItem(key)) !== 'false';
}

export function useBudgetAlertsEnabled() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.budgetAlerts,
    queryFn: () => readChannel(ASYNC_STORAGE_KEYS.budgetAlertsEnabled),
  });
}

export function useSetBudgetAlertsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.budgetAlertsEnabled, String(value));
      return value;
    },
    onSuccess: value => queryClient.setQueryData(QUERY_KEYS.notifications.budgetAlerts, value),
  });
}

export function usePlanRemindersEnabled() {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.planReminders,
    queryFn: () => readChannel(ASYNC_STORAGE_KEYS.planRemindersEnabled),
  });
}

export function useSetPlanRemindersEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.planRemindersEnabled, String(value));
      return value;
    },
    onSuccess: value => {
      queryClient.setQueryData(QUERY_KEYS.notifications.planReminders, value);
      // Turning this off must clear the already-scheduled reminders, not just
      // stop future ones being made.
      syncPlanDueNotifications();
    },
  });
}

export function useSmsAlertsEnabled() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.alerts,
    queryFn: () => readChannel(ASYNC_STORAGE_KEYS.smsAlertsEnabled),
  });
}

export function useSetSmsAlertsEnabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.smsAlertsEnabled, String(value));
      // Unlike the other two channels, this one is enforced in native code, so
      // the flag has to be pushed across rather than merely stored.
      await syncBackgroundAlerts();
      return value;
    },
    onSuccess: value => queryClient.setQueryData(QUERY_KEYS.sms.alerts, value),
  });
}
