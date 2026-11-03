import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodo, TTodoDraft } from '@/lib/types';
import { syncTodoReminders } from '@/lib/utils/todo-notification.util';

export function useSaveTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: TTodoDraft): Promise<TTodo> => {
      const now = new Date().toISOString();
      const existing = draft.id ? sqliteStorage.loadTodos().find(t => t.id === draft.id) : undefined;

      const todo: TTodo = {
        ...draft,
        // Random, not `Date.now()`: ids travel in Drive backups that outlive the
        // install, and two devices creating a todo in the same millisecond would
        // collide — which INSERT OR REPLACE resolves by destroying a row.
        id: draft.id ?? `todo_${Crypto.randomUUID()}`,
        // An edit must not reset the creation stamp; 'created' sort reads it.
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        sortOrder: draft.sortOrder ?? existing?.sortOrder ?? sqliteStorage.nextTodoSortOrder(),
      };

      sqliteStorage.upsertTodo(todo);
      return todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
      syncTodoReminders();
    },
  });
}
