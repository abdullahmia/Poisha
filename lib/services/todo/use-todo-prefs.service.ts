import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, DEFAULT_TODO_PREFS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TTodoCardFields, TTodoPrefs } from '@/lib/types';
import { loadTodoPrefs, syncTodoReminders } from '@/lib/utils/todo-notification.util';

/**
 * A patch may touch a single card field without restating the other five, so
 * `cardFields` is partial here where it is total on `TTodoPrefs`.
 */
export type TTodoPrefsPatch = Partial<Omit<TTodoPrefs, 'cardFields'>> & {
  cardFields?: Partial<TTodoCardFields>;
};

export function useTodoPrefs() {
  return useQuery({
    queryKey: QUERY_KEYS.todo.prefs,
    queryFn: (): Promise<TTodoPrefs> => loadTodoPrefs(),
  });
}

/**
 * Patches preferences rather than replacing them, so a settings row only has to
 * know about its own field. The merge happens against what is currently on
 * disk — not against a cached copy — so two rows toggled in quick succession
 * can't have the second write clobber the first.
 */
export function useSetTodoPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: TTodoPrefsPatch): Promise<TTodoPrefs> => {
      const current = await loadTodoPrefs();
      const next: TTodoPrefs = {
        ...current,
        ...patch,
        cardFields: { ...current.cardFields, ...(patch.cardFields ?? {}) },
      };
      await storage.setItem(ASYNC_STORAGE_KEYS.todoPrefs, JSON.stringify(next));
      return next;
    },
    onSuccess: next => {
      queryClient.setQueryData(QUERY_KEYS.todo.prefs, next);
      // `defaultReminderTime` decides when every todo without its own time
      // fires, so changing it re-dates the whole pending schedule.
      syncTodoReminders();
    },
  });
}

export function useResetTodoPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<TTodoPrefs> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.todoPrefs, JSON.stringify(DEFAULT_TODO_PREFS));
      return DEFAULT_TODO_PREFS;
    },
    onSuccess: next => {
      queryClient.setQueryData(QUERY_KEYS.todo.prefs, next);
      syncTodoReminders();
    },
  });
}
