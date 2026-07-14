import { ASYNC_STORAGE_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TEntry } from '@/lib/types';

export async function migrateLegacyEntries(): Promise<void> {
  const migrated = await storage.getItem(ASYNC_STORAGE_KEYS.sqliteMigrated);
  if (migrated) return;

  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.legacyEntries);
  if (raw) {
    const legacy = JSON.parse(raw) as TEntry[];
    for (const entry of legacy) sqliteStorage.upsertEntry(entry);
  }

  await storage.setItem(ASYNC_STORAGE_KEYS.sqliteMigrated, '1');
}
