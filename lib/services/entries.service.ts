import AsyncStorage from '@react-native-async-storage/async-storage';
import { LedgerDatabase } from '@/lib/storage/database';
import { SEED_ENTRIES, STORAGE_KEY } from '@/lib/data/seed.data';
import type { Draft, Entry } from '@/lib/types/entry.type';

export function seedIfEmpty(db: LedgerDatabase): void {
  if (db.isEmpty()) {
    for (const entry of SEED_ENTRIES) {
      db.upsertEntry(entry);
    }
  }
}

export function getEntries(db: LedgerDatabase): Entry[] {
  return db.loadEntries();
}

export function saveEntry(db: LedgerDatabase, draft: Draft): Entry {
  const entry: Entry = draft.id
    ? ({ ...draft, id: draft.id } as Entry)
    : ({ ...draft, id: `e_${Date.now()}` } as Entry);
  db.upsertEntry(entry);
  return entry;
}

export function deleteEntry(db: LedgerDatabase, id: string): void {
  db.removeEntry(id);
}

export async function migrateFromAsyncStorage(db: LedgerDatabase): Promise<void> {
  const migrated = await AsyncStorage.getItem('ledger_sqlite_migrated');
  if (migrated) return;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const old: Entry[] = JSON.parse(raw) as Entry[];
    for (const e of old) db.upsertEntry(e);
  }

  await AsyncStorage.setItem('ledger_sqlite_migrated', '1');
}
