import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => sqliteStorage.removeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.entries.all });
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
      syncPlanDueNotifications();
    },
  });
}
