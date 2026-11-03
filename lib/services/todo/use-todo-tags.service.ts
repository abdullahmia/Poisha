import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodoTag } from '@/lib/types';

export function useTodoTags() {
  return useQuery({
    queryKey: QUERY_KEYS.todo.tags,
    queryFn: async (): Promise<TTodoTag[]> => sqliteStorage.loadTodoTags(),
  });
}

export function useSaveTodoTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: TTodoTag) => sqliteStorage.upsertTodoTag(tag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.tags });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}

export function useDeleteTodoTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => sqliteStorage.removeTodoTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.tags });
      // Deleting a tag rewrites `tag_ids` on every todo that carried it.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo.all });
    },
  });
}
