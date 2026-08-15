import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';

export function useSetPlanModeEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.planModeEnabled, String(value));
      // Toggling changes this month's total in one direction or the other, so a
      // stamped "already alerted" month can end up lying — most sharply when
      // turning Plan Mode on drops the total back under budget and the stamp
      // then suppresses a later, genuine overrun. Clearing it risks one repeat
      // notification; not clearing it risks silently swallowing a real one.
      await storage.removeItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);
      return value;
    },
    onSuccess: enabled => {
      queryClient.setQueryData(QUERY_KEYS.planMode.enabled, enabled);
      queryClient.setQueryData(QUERY_KEYS.budget.exceededMonth, null);
      // Turning Plan Mode off must clear the pending due-date notifications;
      // turning it on schedules them. syncPlanDueNotifications reads the flag
      // itself, so one call covers both directions.
      syncPlanDueNotifications();
    },
  });
}
