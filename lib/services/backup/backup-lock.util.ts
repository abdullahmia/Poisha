/**
 * One module-scope mutex shared by backup and restore.
 *
 * Module scope, not component state: the auto-backup trigger runs from an
 * AppState listener outside React, and a backup that starts during a restore's
 * wipe window would upload a half-empty snapshot — which retention pruning
 * could then keep in place of a good one.
 */
let busy = false;

export function isBackupBusy(): boolean {
  return busy;
}

/**
 * Runs `task` if nothing else holds the lock, otherwise returns `null`
 * immediately. The flag is set synchronously before any await, so two callers
 * in the same tick cannot both pass.
 */
export async function withBackupLock<T>(task: () => Promise<T>): Promise<T | null> {
  if (busy) return null;
  busy = true;
  try {
    return await task();
  } finally {
    busy = false;
  }
}
