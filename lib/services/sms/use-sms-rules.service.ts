import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TSmsPresetPref, TSmsUserRule } from '@/lib/types';
import { loadPresetPrefs, savePresetPrefs, type TSmsPresetPrefs } from '@/lib/utils/sms-rules.util';

export function useSmsRules() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.rules,
    queryFn: async (): Promise<TSmsUserRule[]> => sqliteStorage.loadSmsRules(),
  });
}

export function useSaveSmsRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: TSmsUserRule): Promise<void> => {
      sqliteStorage.upsertSmsRule(rule);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.rules }),
  });
}

export function useDeleteSmsRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      sqliteStorage.removeSmsRule(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.rules }),
  });
}

export function useSmsPresetPrefs() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.presetPrefs,
    queryFn: async (): Promise<TSmsPresetPrefs> => loadPresetPrefs(),
    // placeholderData, never initialData — see use-categories-enabled.service.ts.
    placeholderData: {},
  });
}

export function useSetSmsPresetPref() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pref }: { id: string; pref: Partial<TSmsPresetPref> }): Promise<TSmsPresetPrefs> => {
      // Read-modify-write the whole blob rather than keeping per-preset keys:
      // it's one AsyncStorage entry, one backup key, and one atomic write.
      const current = await loadPresetPrefs();
      const existing = current[id] ?? { enabled: true, categoryId: null };
      const next = { ...current, [id]: { ...existing, ...pref } };
      await savePresetPrefs(next);
      return next;
    },
    onSuccess: next => queryClient.setQueryData(QUERY_KEYS.sms.presetPrefs, next),
  });
}
