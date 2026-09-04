import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { withBackupLock } from './backup-lock.util';
import { deleteBackup, listBackups, uploadBackup, type TDriveBackupFile } from './drive.client';
import { buildSnapshot } from './snapshot.util';
import { stampBackupResult, type TBackupSettings } from './use-backup-settings.service';

/** How many snapshots to keep in Drive. Tiny payloads, so a corrupt one is survivable. */
const KEEP_REVISIONS = 3;

export type TRunBackupResult =
  | { ok: true; file: TDriveBackupFile }
  /** Another backup or a restore already holds the lock. */
  | { ok: false; reason: 'busy' }
  | { ok: false; reason: 'failed'; message: string };

/**
 * Deletes everything past the newest `KEEP_REVISIONS`.
 *
 * Skipped entirely when the snapshot just uploaded holds fewer entries than the
 * one before it. A shrinking backup is either a genuine mass deletion or a bug,
 * and in both cases the older, larger snapshots are exactly what the user would
 * want back — so retention must not quietly evict them.
 */
async function prune(justUploaded: TDriveBackupFile): Promise<void> {
  const files = await listBackups();

  const previous = files.find(f => f.id !== justUploaded.id);
  const shrank =
    previous?.entryCount != null &&
    justUploaded.entryCount != null &&
    justUploaded.entryCount < previous.entryCount;
  if (shrank) return;

  for (const file of files.slice(KEEP_REVISIONS)) {
    await deleteBackup(file.id).catch(() => {
      // A failed prune leaves an extra file behind — harmless, and far better
      // than failing a backup that has already been stored successfully.
    });
  }
}

export function useRunBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<TRunBackupResult> => {
      const result = await withBackupLock(async (): Promise<TRunBackupResult> => {
        try {
          const snapshot = await buildSnapshot();
          const file = await uploadBackup(JSON.stringify(snapshot), {
            createdAt: snapshot.createdAt,
            entryCount: snapshot.data.entries.length,
            schemaVersion: snapshot.schemaVersion,
            appVersion: snapshot.app.version,
          });

          await prune(file);
          await stampBackupResult('ok', snapshot.createdAt);
          return { ok: true, file };
        } catch (e: unknown) {
          await stampBackupResult('failed', null);
          return { ok: false, reason: 'failed', message: e instanceof Error ? e.message : 'Backup failed.' };
        }
      });

      return result ?? { ok: false, reason: 'busy' };
    },
    onSuccess: result => {
      if (result.ok) {
        // Push the new timestamp straight into cache — staleTime: Infinity means
        // the settings query will not re-read AsyncStorage on its own.
        queryClient.setQueryData<TBackupSettings>(QUERY_KEYS.backup.settings, prev =>
          prev ? { ...prev, lastBackupAt: result.file.modifiedTime, lastStatus: 'ok' } : prev,
        );
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.backup.list });
        return;
      }

      if (result.reason === 'failed') {
        queryClient.setQueryData<TBackupSettings>(QUERY_KEYS.backup.settings, prev =>
          prev ? { ...prev, lastStatus: 'failed' } : prev,
        );
      }
    },
  });
}
