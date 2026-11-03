import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import { syncTodoReminders } from '@/lib/utils/todo-notification.util';

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => sqliteStorage.removeTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
      syncTodoReminders();
    },
  });
}

export function useClearCompletedTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<number> => sqliteStorage.removeCompletedTodos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
      // Completed todos hold no pending reminders, but a resync costs one cheap
      // pass and keeps "the schedule always matches the data" unconditional.
      syncTodoReminders();
    },
  });
}

export function useReorderTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => sqliteStorage.reorderTodos(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all }),
  });
}
