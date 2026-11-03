import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodoList } from '@/lib/types';

export function useTodoLists() {
  return useQuery({
    queryKey: QUERY_KEYS.todo.lists,
    queryFn: async (): Promise<TTodoList[]> => sqliteStorage.loadTodoLists(),
  });
}

export function useSaveTodoList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: TTodoList) => sqliteStorage.upsertTodoList(list),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.lists }),
  });
}

export function useArchiveTodoList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => sqliteStorage.archiveTodoList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.lists });
      // Archiving moves the list's todos to Inbox, so the todo list itself is
      // stale too — invalidating only the lists query would leave every
      // affected card still showing a chip for a list that is now gone.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}

export function useReorderTodoLists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => sqliteStorage.reorderTodoLists(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.lists }),
  });
}
