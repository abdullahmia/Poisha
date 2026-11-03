import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import { syncTodoReminders } from '@/lib/utils/todo-notification.util';

export function useSetTodoEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.todoEnabled, String(value));
      return value;
    },
    onSuccess: enabled => {
      queryClient.setQueryData(QUERY_KEYS.todo.enabled, enabled);
      // Turning the module off must clear its pending reminders, not merely
      // stop new ones being made — a notification for a tab the user can no
      // longer see is the worst kind. syncTodoReminders reads the flag itself,
      // so the one call covers both directions.
      syncTodoReminders();
    },
  });
}
