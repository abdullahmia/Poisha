import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, DEFAULT_TAB_BAR_PREFS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TTabBarPrefs } from '@/lib/types';
import { normalizeTabBarPrefs } from '@/lib/utils/tab-bar.util';

async function loadTabBarPrefs(): Promise<TTabBarPrefs> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.tabBar);
  if (!raw) return DEFAULT_TAB_BAR_PREFS;
  try {
    return normalizeTabBarPrefs(JSON.parse(raw));
  } catch {
    return DEFAULT_TAB_BAR_PREFS;
  }
}

export function useTabBarPrefs() {
  return useQuery({
    queryKey: QUERY_KEYS.tabBar,
    queryFn: loadTabBarPrefs,
  });
}

/**
 * Takes an updater, applied to what is on disk rather than to a cached copy,
 * and every call shares one scope so they run one at a time. Two quick taps on
 * a reorder arrow must each build on the other's result; started together, both
 * would read the same state and the second write would undo the first.
 */
export function useUpdateTabBarPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: 'tab-bar-prefs' },
    mutationFn: async (update: (current: TTabBarPrefs) => TTabBarPrefs): Promise<TTabBarPrefs> => {
      const next = update(await loadTabBarPrefs());
      await storage.setItem(ASYNC_STORAGE_KEYS.tabBar, JSON.stringify(next));
      return next;
    },
    onSuccess: next => queryClient.setQueryData(QUERY_KEYS.tabBar, next),
  });
}
