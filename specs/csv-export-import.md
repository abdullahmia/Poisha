# Feature: CSV Export & Import

## Overview

Let users **export** all journal entries to a CSV file (shareable via the iOS/Android share sheet) and **import** entries from a previously exported CSV. Both actions live in the **Settings** screen under a new "Data" section.

---

## Packages

```bash
npx expo install expo-sharing expo-document-picker expo-file-system
```

| Package | Purpose |
|---|---|
| `expo-file-system` | Write the CSV to a temp file before sharing |
| `expo-sharing` | Invoke the native OS share sheet |
| `expo-document-picker` | Let the user pick a `.csv` file from Files / Drive |

---

## CSV Format

```
id,date,amounts,note
e_1714000000000,2024-04-25,"[12.5,8]",Lunch
s1,2024-04-01,"[45]",Groceries
```

Rules:
- Header row always present.
- `amounts` is a JSON array serialised as a quoted string (so commas inside the array don't break CSV parsing).
- `note` is quoted if it contains a comma, double-quote, or newline; double-quotes inside are escaped as `""`.
- Encoding: UTF-8.
- Line endings: `\n`.

---

## Utility Module

**File:** `lib/utils/csv.util.ts`

### `entriesToCsv(entries: Entry[]): string`

Converts the entry array to a CSV string.

```ts
const HEADER = 'id,date,amounts,note';

function escapeField(val: string): string {
  if (/[,"\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function entriesToCsv(entries: Entry[]): string {
  const rows = entries.map(e =>
    [e.id, e.date, escapeField(JSON.stringify(e.amounts)), escapeField(e.note)].join(',')
  );
  return [HEADER, ...rows].join('\n');
}
```

### `csvToEntries(csv: string): Entry[]`

Parses a CSV string back into entries. Must handle:
- The header row (skip it).
- Quoted fields (including embedded commas and escaped double-quotes).
- Blank `note` fields.
- Invalid rows (log and skip rather than crash).

```ts
export function csvToEntries(csv: string): Entry[] { ... }
```

A minimal hand-rolled parser is fine — no external CSV library needed.

---

## Export Flow

**Trigger:** "Export CSV" row in Settings → Data section.

**Steps:**

1. Call `entries` from `useEntries()`.
2. Generate the CSV string with `entriesToCsv(entries)`.
3. Write to a temp file:
   ```ts
   const path = FileSystem.cacheDirectory + 'ledger-export.csv';
   await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
   ```
4. Check `Sharing.isAvailableAsync()`. If unavailable (web/simulator without share support), show an `Alert` with the message "Sharing is not available on this device."
5. Call `Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Ledger' })`.

**UI state:** disable the row and show a small inline activity indicator while the file is being written/shared.

---

## Import Flow

**Trigger:** "Import CSV" row in Settings → Data section.

**Steps:**

1. Call `DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true })`.
2. If the user cancels (`result.canceled === true`), do nothing.
3. Read the file: `FileSystem.readAsStringAsync(result.assets[0].uri)`.
4. Parse with `csvToEntries(csv)`. Show an `Alert` and abort if the parser returns 0 entries.
5. **Conflict strategy:** prompt the user with an `Alert` offering two options:
   - **Merge** — upsert each imported entry (existing IDs are overwritten, new IDs are added).
   - **Replace** — clear all current entries, then insert the imported set.
6. Call `saveEntry` / `deleteEntry` from `useEntries()` to apply the chosen strategy. After the SQLite feature is merged, direct `upsertEntry` / bulk-delete calls can be used instead.
7. Show a success `Alert`: "Imported N entries."

**UI state:** disable the row during processing; re-enable after the alert is dismissed.

---

## Settings Screen Integration

Add a **Data** section below Appearance in `app/(tabs)/settings.tsx`:

```
Section: Data
  Row: Export CSV       →  chevron / share icon (right-aligned)
  Row: Import CSV       →  chevron / upload icon (right-aligned)
```

Row layout is consistent with the Appearance rows (same padding, divider, font).

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| File write fails | `Alert.alert('Export failed', error.message)` |
| Picked file is not valid CSV | `Alert.alert('Import failed', 'The file could not be parsed.')` |
| Sharing unavailable | `Alert.alert('Not available', 'Sharing is not supported on this device.')` |

---

## Acceptance Criteria

1. Tapping "Export CSV" opens the OS share sheet with a `ledger-export.csv` file containing all entries.
2. The exported file is valid CSV and round-trips through `csvToEntries` without data loss.
3. Tapping "Import CSV" opens the document picker; selecting a valid CSV file prompts for Merge or Replace.
4. After importing, the entries list updates immediately and persists across restart.
5. Cancelling the document picker or sharing sheet leaves app state unchanged.
6. `npx tsc --noEmit` passes with no errors.
