import { useCallback, useMemo } from 'react';
import {
  useClearCompletedTodos,
  useDeleteTodo,
  useReorderTodos,
  useSaveTodo,
  useTodos as useTodosQuery,
  useToggleTodo,
} from '@/lib/services/todo';
import type { TTodo, TTodoDraft } from '@/lib/types';
import { useToday } from '@/lib/hooks/use-today.hook';
import { useTodoPreferences } from '@/lib/hooks/use-todo-prefs.hook';
import { useTodoTaxonomy } from '@/lib/hooks/use-todo-taxonomy.hook';
import { buildTodoView, type TTodoFilter, type TTodoView } from '@/lib/utils/todo-view.util';

/**
 * The todo module's single read surface: raw rows, the mutations, and the
 * filtered/sorted/grouped view the screen actually renders.
 *
 * `filter` is passed in rather than held here because it is ephemeral UI state
 * owned by the screen, while everything else is persisted. Callers that only
 * need counts can pass EMPTY_TODO_FILTER.
 */
export function useTodos(filter: TTodoFilter) {
  const todosQuery = useTodosQuery();
  const saveTodoMutation = useSaveTodo();
  const toggleTodoMutation = useToggleTodo();
  const deleteTodoMutation = useDeleteTodo();
  const clearCompletedMutation = useClearCompletedTodos();
  const reorderTodosMutation = useReorderTodos();

  const { prefs } = useTodoPreferences();
  const { lists, priorities, tags } = useTodoTaxonomy();
  const today = useToday();

  const todos = useMemo(() => todosQuery.data ?? [], [todosQuery.data]);

  const view: TTodoView = useMemo(
    () => buildTodoView(todos, prefs, filter, { lists, priorities, tags, today }),
    [todos, prefs, filter, lists, priorities, tags, today],
  );

  const saveTodo = useCallback((draft: TTodoDraft) => saveTodoMutation.mutate(draft), [saveTodoMutation]);
  const toggleTodo = useCallback((id: string) => toggleTodoMutation.mutate(id), [toggleTodoMutation]);
  const deleteTodo = useCallback((id: string) => deleteTodoMutation.mutate(id), [deleteTodoMutation]);
  const clearCompleted = useCallback(() => clearCompletedMutation.mutate(), [clearCompletedMutation]);

  /**
   * Manual reordering persists positions for the *whole* table, not just the
   * visible slice — the filtered-out todos keep their existing order and are
   * appended, so dragging inside one list can't scramble another.
   */
  const reorderVisible = useCallback(
    (visibleIds: string[]) => {
      const visible = new Set(visibleIds);
      const rest = todos.filter(t => !visible.has(t.id)).map(t => t.id);
      reorderTodosMutation.mutate([...visibleIds, ...rest]);
    },
    [todos, reorderTodosMutation],
  );

  const byId = useCallback((id: string): TTodo | undefined => todos.find(t => t.id === id), [todos]);

  return {
    todos,
    view,
    prefs,
    lists,
    priorities,
    tags,
    today,
    loading: todosQuery.isPending,
    saveTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    reorderVisible,
    byId,
  };
}
