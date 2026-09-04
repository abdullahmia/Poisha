import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { listBackups, type TDriveBackupFile } from './drive.client';

/**
 * Backups currently stored in Drive, newest first.
 *
 * Only fetched when `enabled` — listing costs a network round trip and an
 * access-token refresh, so it waits until a connected account exists and the
 * user is actually looking at the restore flow.
 */
export function useBackupList(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.backup.list,
    queryFn: (): Promise<TDriveBackupFile[]> => listBackups(),
    enabled,
  });
}
