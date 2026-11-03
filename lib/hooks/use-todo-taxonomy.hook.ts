import { useCallback } from 'react';
import {
  useArchiveTodoList,
  useDeleteTodoPriority,
  useDeleteTodoTag,
  useReorderTodoLists,
  useReorderTodoPriorities,
  useSaveTodoList,
  useSaveTodoPriority,
  useSaveTodoTag,
  useTodoLists as useTodoListsQuery,
  useTodoPriorities as useTodoPrioritiesQuery,
  useTodoTags as useTodoTagsQuery,
} from '@/lib/services/todo';
import type { TTodoList, TTodoPriority, TTodoTag } from '@/lib/types';

/**
 * The three user-curated vocabularies a todo is described with. They are
 * fetched together because every surface that renders a todo needs all three to
 * resolve its ids into names and colours — splitting them into separate hooks
 * would just mean three imports at every call site.
 */
export function useTodoTaxonomy() {
  const listsQuery = useTodoListsQuery();
  const prioritiesQuery = useTodoPrioritiesQuery();
  const tagsQuery = useTodoTagsQuery();

  const saveListMutation = useSaveTodoList();
  const archiveListMutation = useArchiveTodoList();
  const reorderListsMutation = useReorderTodoLists();
  const savePriorityMutation = useSaveTodoPriority();
  const deletePriorityMutation = useDeleteTodoPriority();
  const reorderPrioritiesMutation = useReorderTodoPriorities();
  const saveTagMutation = useSaveTodoTag();
  const deleteTagMutation = useDeleteTodoTag();

  const lists = listsQuery.data ?? [];
  const priorities = prioritiesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];

  const saveList = useCallback((list: TTodoList) => saveListMutation.mutate(list), [saveListMutation]);
  const archiveList = useCallback((id: string) => archiveListMutation.mutate(id), [archiveListMutation]);
  const reorderLists = useCallback((ids: string[]) => reorderListsMutation.mutate(ids), [reorderListsMutation]);

  const savePriority = useCallback((p: TTodoPriority) => savePriorityMutation.mutate(p), [savePriorityMutation]);
  const deletePriority = useCallback((id: string) => deletePriorityMutation.mutate(id), [deletePriorityMutation]);
  const reorderPriorities = useCallback(
    (ids: string[]) => reorderPrioritiesMutation.mutate(ids),
    [reorderPrioritiesMutation],
  );

  const saveTag = useCallback((tag: TTodoTag) => saveTagMutation.mutate(tag), [saveTagMutation]);
  const deleteTag = useCallback((id: string) => deleteTagMutation.mutate(id), [deleteTagMutation]);

  return {
    lists,
    priorities,
    tags,
    saveList,
    archiveList,
    reorderLists,
    savePriority,
    deletePriority,
    reorderPriorities,
    saveTag,
    deleteTag,
  };
}
