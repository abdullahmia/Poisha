import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TBackupFrequency, TBackupStatus } from '@/lib/types';

export interface TBackupSettings {
  enabled: boolean;
  frequency: TBackupFrequency;
  /** ISO timestamp of the last successful upload, or null if never. */
  lastBackupAt: string | null;
  lastStatus: TBackupStatus | null;
}

function toFrequency(raw: string | null): TBackupFrequency {
  return raw === 'daily' || raw === 'weekly' || raw === 'manual' ? raw : 'daily';
}

/** No `initialData` — see use-plan-mode-enabled.service.ts for why that matters here. */
export function useBackupSettings() {
  return useQuery({
    queryKey: QUERY_KEYS.backup.settings,
    queryFn: async (): Promise<TBackupSettings> => {
      const values = await storage.multiGet([
        ASYNC_STORAGE_KEYS.backupEnabled,
        ASYNC_STORAGE_KEYS.backupFrequency,
        ASYNC_STORAGE_KEYS.backupLastAt,
        ASYNC_STORAGE_KEYS.backupLastStatus,
      ]);

      const status = values[ASYNC_STORAGE_KEYS.backupLastStatus];

      return {
        enabled: values[ASYNC_STORAGE_KEYS.backupEnabled] === 'true',
        frequency: toFrequency(values[ASYNC_STORAGE_KEYS.backupFrequency]),
        lastBackupAt: values[ASYNC_STORAGE_KEYS.backupLastAt],
        lastStatus: status === 'ok' || status === 'failed' ? status : null,
      };
    },
  });
}

export function useSetBackupEnabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean): Promise<boolean> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.backupEnabled, String(enabled));
      return enabled;
    },
    onSuccess: enabled =>
      queryClient.setQueryData<TBackupSettings>(QUERY_KEYS.backup.settings, prev =>
        prev ? { ...prev, enabled } : prev,
      ),
  });
}

export function useSetBackupFrequency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frequency: TBackupFrequency): Promise<TBackupFrequency> => {
      await storage.setItem(ASYNC_STORAGE_KEYS.backupFrequency, frequency);
      return frequency;
    },
    onSuccess: frequency =>
      queryClient.setQueryData<TBackupSettings>(QUERY_KEYS.backup.settings, prev =>
        prev ? { ...prev, frequency } : prev,
      ),
  });
}

/**
 * Records the outcome of a run. Written from outside React by the auto-backup
 * trigger as well as from the mutation, so it always pushes the new value into
 * the cache — with `staleTime: Infinity` the query would otherwise keep showing
 * the timestamp it read at mount, forever.
 */
export async function stampBackupResult(status: TBackupStatus, at: string | null): Promise<void> {
  await storage.setItem(ASYNC_STORAGE_KEYS.backupLastStatus, status);
  if (at) await storage.setItem(ASYNC_STORAGE_KEYS.backupLastAt, at);
}
