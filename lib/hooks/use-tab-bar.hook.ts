import { useCallback, useMemo } from 'react';
import { DEFAULT_TAB_BAR_PREFS, MAX_TAB_ITEMS } from '@/lib/constants';
import { useTabBarPrefs, useUpdateTabBarPrefs } from '@/lib/services/tab-bar';
import type { TTabItem } from '@/lib/types';
import {
  admitTabItem,
  moveTabItem,
  resetTabBar,
  resolveTabBar,
  setTabItemShown,
  type TTabAvailability,
} from '@/lib/utils/tab-bar.util';
import { usePlanMode } from './use-plan-mode.hook';
import { useTodo } from './use-todo.hook';

export function useTabBar() {
  const prefsQuery = useTabBarPrefs();
  const updateMutation = useUpdateTabBarPrefs();
  const { enabled: planEnabled, loading: planLoading } = usePlanMode();
  const { enabled: todoEnabled, loading: todoLoading } = useTodo();

  const prefs = prefsQuery.data ?? DEFAULT_TAB_BAR_PREFS;

  const isAvailable = useCallback<TTabAvailability>(
    item => {
      if (item === 'plan') return planEnabled;
      if (item === 'todo') return todoEnabled;
      return true;
    },
    [planEnabled, todoEnabled],
  );

  const items = useMemo(() => resolveTabBar(prefs, isAvailable), [prefs, isAvailable]);

  const setShown = useCallback(
    (item: TTabItem, shown: boolean) =>
      updateMutation.mutate(current => setTabItemShown(current, item, shown, isAvailable)),
    [updateMutation, isAvailable],
  );

  const move = useCallback(
    (item: TTabItem, direction: -1 | 1) =>
      updateMutation.mutate(current => moveTabItem(current, item, direction, isAvailable)),
    [updateMutation, isAvailable],
  );

  const reset = useCallback(
    () => updateMutation.mutate(() => resetTabBar(isAvailable)),
    [updateMutation, isAvailable],
  );

  /**
   * Call before switching Plan or Todo on. Resolves false when the bar was
   * already full, in which case the feature still turns on but its tab stays
   * out of the bar until the user makes room.
   */
  const admit = useCallback(
    async (item: TTabItem): Promise<boolean> => {
      let fits = false;
      await updateMutation.mutateAsync(current => {
        const result = admitTabItem(current, item, isAvailable);
        fits = result.fits;
        return result.prefs;
      });
      return fits;
    },
    [updateMutation, isAvailable],
  );

  return {
    /** What the bar shows right now, in order. */
    items,
    /** Every item, including hidden ones, in their saved order. */
    order: prefs.order,
    isAvailable,
    isFull: items.length >= MAX_TAB_ITEMS,
    // The Home route waits on this before deciding whether to send the user to
    // another tab. Plan and Todo count too, since they decide which tab is first.
    loading: prefsQuery.isPending || planLoading || todoLoading,
    setShown,
    move,
    reset,
    admit,
  };
}
