import { useCallback } from 'react';
import { useSetTodoEnabled, useTodoEnabled } from '@/lib/services/todo';

export function useTodo() {
  const enabledQuery = useTodoEnabled();
  const setEnabledMutation = useSetTodoEnabled();

  const enabled = enabledQuery.data ?? false;

  const setEnabled = useCallback(async (value: boolean) => {
    await setEnabledMutation.mutateAsync(value);
  }, [setEnabledMutation]);

  // `loading` matters to the /todo route guard: the query has no initialData,
  // so `enabled` is false for the first render while AsyncStorage resolves.
  // Redirecting on that would bounce a cold-start deep link off its own tab.
  return { enabled, setEnabled, loading: enabledQuery.isPending };
}
