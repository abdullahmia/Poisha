# Feature: SQLite Local Database

## Overview

Replace the `AsyncStorage` JSON-blob approach with a proper **SQLite** database using `expo-sqlite`. Each `Entry` becomes a row with its `amounts` array stored as a JSON string. The existing `EntriesContext` API surface stays identical so no screen code needs to change.

---

## Why

- Structured queries (filter by date range, sort) without deserialising the whole store.
- Atomic row-level writes instead of overwriting the entire array on every mutation.
- Foundation for the CSV import/export feature (direct SQL scan vs JSON parse).

---

## Package

```bash
npx expo install expo-sqlite
```

`expo-sqlite` ships with Expo SDK 54 and supports the New Architecture. Do not use `expo-sqlite/legacy`.

---

## Database File

**Name:** `ledger.db`  
Opened with `SQLite.openDatabaseSync('ledger.db')` (synchronous API, safe on the JS thread via JSI in New Architecture).

---

## Schema

```sql
CREATE TABLE IF NOT EXISTS entries (
  id        TEXT PRIMARY KEY NOT NULL,
  date      TEXT NOT NULL,
  amounts   TEXT NOT NULL,   -- JSON array, e.g. "[12.5, 8.00]"
  note      TEXT NOT NULL DEFAULT ''
);
```

No migrations framework needed yet — a single `CREATE TABLE IF NOT EXISTS` on open is sufficient.

---

## Database Module

**File:** `lib/data/database.ts`

Expose four functions that map 1-to-1 with the context operations:

```ts
export function openDb(): SQLiteDatabase;

export function seedIfEmpty(db: SQLiteDatabase): void;
// Inserts SEED_ENTRIES only when the entries table is empty.

export function loadEntries(db: SQLiteDatabase): Entry[];
// SELECT id, date, amounts, note FROM entries ORDER BY date DESC

export function upsertEntry(db: SQLiteDatabase, entry: Entry): void;
// INSERT OR REPLACE INTO entries ...

export function removeEntry(db: SQLiteDatabase, id: string): void;
// DELETE FROM entries WHERE id = ?
```

All functions are **synchronous** — use `db.execSync`, `db.runSync`, and `db.getAllSync` from `expo-sqlite`.

`amounts` is serialised with `JSON.stringify` on write and `JSON.parse` on read.

---

## Context Migration

**File:** `lib/context/entries.context.tsx`

1. Remove the `AsyncStorage` import and all `AsyncStorage.*` calls.
2. Open the database once at module level (or inside a `useRef` on first render):
   ```ts
   const db = useMemo(() => openDb(), []);
   ```
3. Replace the `useEffect` load with `loadEntries(db)` called synchronously (wrapped in a try/catch, `setLoading(false)` in finally).
4. Replace `saveEntry` body: call `upsertEntry(db, newEntry)` then `setEntries(...)`.
5. Replace `deleteEntry` body: call `removeEntry(db, id)` then `setEntries(...)`.
6. The public `EntriesCtxValue` interface is **unchanged** — no screen touches needed.

---

## Seed Data

`lib/data/seed.data.ts` keeps `SEED_ENTRIES` and `STORAGE_KEY` (keep the constant for any legacy checks, but it is no longer read). `seedIfEmpty` is called once after `openDb()`.

---

## Data Migration (first launch after upgrade)

On the first run after swapping to SQLite, AsyncStorage will still hold the old data. Add a one-time migration in `openDb()`:

```ts
const migrated = await AsyncStorage.getItem('ledger_sqlite_migrated');
if (!migrated) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw) {
    const old: Entry[] = JSON.parse(raw);
    for (const e of old) upsertEntry(db, e);
  }
  await AsyncStorage.setItem('ledger_sqlite_migrated', '1');
}
```

Because `openDb` is otherwise synchronous, run this migration as a `useEffect` inside `EntriesProvider` before the normal load, guarded by a `migrated` state flag so `loadEntries` only fires after migration completes.

> If targeting a clean install (no existing AsyncStorage data), the migration block can be omitted and the guard simplified.

---

## Acceptance Criteria

1. App boots, seed entries appear, and no AsyncStorage reads/writes occur during normal CRUD.
2. Adding, editing, and deleting entries persist across a full app restart.
3. Existing entries from the old AsyncStorage store are migrated on the first upgraded launch.
4. `npx tsc --noEmit` passes with no errors.
5. The `EntriesCtxValue` interface is byte-for-byte identical to the pre-migration version.
