import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodo } from '@/lib/types';
import { todayISO } from '@/lib/utils/date.util';
import { syncTodoReminders } from '@/lib/utils/todo-notification.util';
import { rolledForward } from '@/lib/utils/todo-recurrence.util';

export interface TToggleResult {
  todo: TTodo;
  /** The freshly spawned next occurrence, when completing a recurring todo. */
  spawned: TTodo | null;
}

/**
 * Ticks a todo off or back on.
 *
 * Completing a recurring todo keeps the completed row and inserts a *new* open
 * todo at the next due date, rather than moving the original forward. That
 * preserves a record of each run — "Clear completed" and the done count would
 * otherwise have nothing to show for a weekly chore kept up for a year.
 */
export function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<TToggleResult | null> => {
      const todo = sqliteStorage.loadTodos().find(t => t.id === id);
      if (!todo) return null;

      const now = new Date().toISOString();
      const completing = !todo.completed;

      const updated: TTodo = {
        ...todo,
        completed: completing,
        completedAt: completing ? now : null,
        updatedAt: now,
      };
      sqliteStorage.upsertTodo(updated);

      if (!completing || !todo.repeat) return { todo: updated, spawned: null };

      const next = rolledForward(todo, todayISO(), now);
      if (!next) return { todo: updated, spawned: null };

      const spawned: TTodo = {
        ...next,
        id: `todo_${Crypto.randomUUID()}`,
        createdAt: now,
        sortOrder: sqliteStorage.nextTodoSortOrder(),
      };
      sqliteStorage.upsertTodo(spawned);

      return { todo: updated, spawned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
      syncTodoReminders();
    },
  });
}
