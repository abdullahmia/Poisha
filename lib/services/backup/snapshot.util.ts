import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ASYNC_STORAGE_KEYS, BACKED_UP_SETTING_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import { BACKUP_SCHEMA_VERSION, type TBackupSnapshot } from '@/lib/types';

/**
 * Reads the full app state into a snapshot ready to upload.
 *
 * Categories come from `loadAllCategories()`, not `loadCategories()` — the
 * latter hides archived rows, which would orphan every entry pointing at one.
 */
export async function buildSnapshot(): Promise<TBackupSnapshot> {
  const settings = await storage.multiGet(BACKED_UP_SETTING_KEYS);

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    app: {
      version: Constants.expoConfig?.version ?? 'unknown',
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    },
    data: {
      entries: sqliteStorage.loadEntries(),
      categories: sqliteStorage.loadAllCategories(),
      // Always captured, even with the Todo module switched off: the flag is
      // just a flag, and someone who turns it off, backs up, and restores onto
      // a new phone must still find their todos waiting when they turn it on.
      todo: sqliteStorage.loadTodoBundle(),
      settings,
    },
  };
}

/**
 * Writes a validated snapshot over local state. Call `parseBackupSnapshot`
 * first — this deliberately takes an already-validated shape so there is no
 * path where unvalidated data reaches SQLite.
 *
 * Ordering is load-bearing: SQLite first (atomic, and the slow part), then
 * settings, and only then may callers fire the post-restore side effects.
 * `writeWidgetSnapshot` reads the locale straight from AsyncStorage, so
 * running it before the settings write publishes the old currency symbol.
 */
export async function applySnapshot(snapshot: TBackupSnapshot): Promise<void> {
  const { entries, categories, todo, settings } = snapshot.data;

  // `todo` is undefined for a v1 backup, and `replaceAll` leaves the local todo
  // tables alone in that case — restoring a pre-Todo file must not wipe todos
  // the file never knew existed.
  sqliteStorage.replaceAll(entries, categories, todo);

  // Restrict to the allowlist even on the way in: a snapshot from a future
  // build (or a hand-edited file) must not be able to write arbitrary keys.
  const allowed: Record<string, string | null> = {};
  for (const key of BACKED_UP_SETTING_KEYS) {
    if (key in settings) allowed[key] = settings[key];
  }
  await storage.multiSet(allowed);

  // Device-local alert state that must not survive a restore: whatever month
  // the old device had already warned about says nothing about this one, and
  // the same goes for whether it had already carried overdue todos forward.
  await storage.removeItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);
  await storage.removeItem(ASYNC_STORAGE_KEYS.todoCarryOverDate);
}
