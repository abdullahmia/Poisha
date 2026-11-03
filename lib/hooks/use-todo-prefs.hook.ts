import { useCallback } from 'react';
import { DEFAULT_TODO_PREFS } from '@/lib/constants';
import {
  type TTodoPrefsPatch,
  useResetTodoPrefs,
  useSetTodoPrefs,
  useTodoPrefs as useTodoPrefsQuery,
} from '@/lib/services/todo';

export function useTodoPreferences() {
  const prefsQuery = useTodoPrefsQuery();
  const setPrefsMutation = useSetTodoPrefs();
  const resetPrefsMutation = useResetTodoPrefs();

  // Falling back to the shipped defaults rather than to a blank object means
  // the first render before AsyncStorage resolves looks like the real thing,
  // not like a list with every optional field switched off.
  const prefs = prefsQuery.data ?? DEFAULT_TODO_PREFS;

  const setPrefs = useCallback(
    (patch: TTodoPrefsPatch) => setPrefsMutation.mutate(patch),
    [setPrefsMutation],
  );

  const resetPrefs = useCallback(() => resetPrefsMutation.mutate(), [resetPrefsMutation]);

  return { prefs, setPrefs, resetPrefs };
}
