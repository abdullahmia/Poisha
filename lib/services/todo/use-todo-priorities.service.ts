import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodoPriority } from '@/lib/types';

export function useTodoPriorities() {
  return useQuery({
    queryKey: QUERY_KEYS.todo.priorities,
    queryFn: async (): Promise<TTodoPriority[]> => sqliteStorage.loadTodoPriorities(),
  });
}

export function useSaveTodoPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priority: TTodoPriority) => sqliteStorage.upsertTodoPriority(priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.priorities });
      // A level or colour change re-ranks and re-tints the list, both of which
      // are derived from priorities at render time.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}

export function useDeleteTodoPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => sqliteStorage.removeTodoPriority(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.priorities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}

export function useReorderTodoPriorities() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => sqliteStorage.reorderTodoPriorities(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.priorities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}
