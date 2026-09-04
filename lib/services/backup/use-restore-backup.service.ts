import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { parseBackupSnapshot } from '@/lib/schemas/backup.schemas';
import { sqliteStorage } from '@/lib/storages';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';
import { writeWidgetSnapshot } from '@/lib/utils/widget-snapshot.util';
import { withBackupLock } from './backup-lock.util';
import { downloadBackup } from './drive.client';
import { applySnapshot } from './snapshot.util';

export type TRestoreResult =
  | { ok: true; entryCount: number }
  | { ok: false; reason: 'busy' | 'too-new' | 'invalid' | 'failed'; message: string };

export function useRestoreBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string): Promise<TRestoreResult> => {
      const result = await withBackupLock(async (): Promise<TRestoreResult> => {
        let raw: unknown;
        try {
          raw = await downloadBackup(fileId);
        } catch (e: unknown) {
          return { ok: false, reason: 'failed', message: e instanceof Error ? e.message : 'Download failed.' };
        }

        // Validate before anything touches SQLite: a truncated or corrupt file
        // must fail loudly rather than half-apply and leave the user worse off
        // than before they tapped Restore.
        const parsed = parseBackupSnapshot(raw);
        if (!parsed.ok) return { ok: false, reason: parsed.reason, message: parsed.message };

        try {
          await applySnapshot(parsed.snapshot);
          return { ok: true, entryCount: parsed.snapshot.data.entries.length };
        } catch (e: unknown) {
          return { ok: false, reason: 'failed', message: e instanceof Error ? e.message : 'Restore failed.' };
        }
      });

      return result ?? { ok: false, reason: 'busy', message: 'A backup is already running.' };
    },
    onSuccess: result => {
      if (!result.ok) return;

      // Unfiltered on purpose. A restore moves theme, locale, haptics, budget,
      // categories.enabled, planMode.enabled and all three notification flags
      // as well as entries and categories — nine live queries reading
      // AsyncStorage under mounted components. Enumerating them would drift as
      // keys are added; this cannot.
      queryClient.invalidateQueries();

      // Write-only cache with no useQuery behind it, so invalidation is a no-op
      // for it. The stamp is device-local and cleared by applySnapshot.
      queryClient.setQueryData(QUERY_KEYS.budget.exceededMonth, null);

      // Both read AsyncStorage directly, so they must run after applySnapshot
      // has written the restored settings — not in parallel with it.
      writeWidgetSnapshot(sqliteStorage.loadEntries()).catch(() => {});
      syncPlanDueNotifications();
    },
  });
}
