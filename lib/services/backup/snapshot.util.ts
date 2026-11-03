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
      smsRules: sqliteStorage.loadSmsRules(),
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
  const { entries, categories, smsRules, settings } = snapshot.data;

  sqliteStorage.replaceAll(entries, categories);

  // Separate from replaceAll: rules are independent of the entries/categories
  // pair that has to land atomically, and a v1 snapshot carries an empty list,
  // which should clear local rules just as any other restore would.
  sqliteStorage.replaceSmsRules(smsRules);

  // Restrict to the allowlist even on the way in: a snapshot from a future
  // build (or a hand-edited file) must not be able to write arbitrary keys.
  const allowed: Record<string, string | null> = {};
  for (const key of BACKED_UP_SETTING_KEYS) {
    if (key in settings) allowed[key] = settings[key];
  }
  await storage.multiSet(allowed);

  // Device-local alert state that must not survive a restore: whatever month
  // the old device had already warned about says nothing about this one.
  await storage.removeItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);

  // Same category of state, and the more consequential one. `replaceAll` has
  // just emptied the SMS queue; if the cursor were left where it was, the next
  // scan would re-detect every message behind the entries the restore just
  // brought back and offer the user hundreds of duplicates. Forward-only is the
  // safe reset — deliberate backfill stays an explicit action in Settings.
  await storage.setItem(ASYNC_STORAGE_KEYS.smsScanCursor, String(Date.now()));
  await storage.removeItem(ASYNC_STORAGE_KEYS.smsLastScanAt);
}
