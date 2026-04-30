# Feature: Entry Search

## Status

> **Not started**

---

## Overview

Add a search bar to the Browse (Entries) screen that filters entries by note text in real time. Filtering runs entirely in memory against the already-loaded entries array — no database query or debounce needed. When search is active the period selector is hidden and results span all time.

---

## Scope

- Search bar at the top of the Browse screen
- Case-insensitive partial-match filter on the `note` field
- Stats grid recalculates for the filtered result set
- Period selector and date navigator hidden while search query is non-empty
- Clear (×) button inside the input to reset search
- Empty state for no-match results
- Out of scope: searching by amount, searching by date, persisting the last query, search history

---

## Package

No new packages required.

---

## State

Search state is local to `app/(tabs)/explore.tsx` using `useState`. It is **not** added to `EntriesContext`.

```ts
const [query, setQuery] = useState('');
```

---

## Filtering Logic

```ts
const searchActive = query.trim().length > 0;

const filtered = searchActive
  ? entries.filter(e =>
      e.note.toLowerCase().includes(query.trim().toLowerCase())
    )
  : periodEntries; // existing period-filtered list
```

`filtered` replaces `periodEntries` as the input to the stats grid and the sorted/grouped list.

---

## Search Bar Component (inline in `explore.tsx`)

### Visual spec

- Positioned below the "Browse Entries" header, above the period pills
- Container: `theme.surface` background, `borderRadius: 12`, horizontal padding 14, vertical padding 10, `borderWidth: 1`, `borderColor: theme.line`
- Left icon: `Search01Icon` from `@hugeicons/core-free-icons`, 18 px, `theme.inkMuted` color
- `TextInput`: `DMSans_400Regular`, 15 px, `theme.ink` color, flex 1, `placeholderTextColor: theme.inkMuted`, placeholder `"Search notes…"`
- `returnKeyType="search"`, `autoCorrect={false}`, `autoCapitalize="none"`
- Right: clear button — visible only when `query.length > 0`
  - Icon: `Cancel01Icon` (or `MultiplicationSignIcon`), 18 px, `theme.inkMuted`
  - `Pressable` hitSlop `{ top: 8, bottom: 8, left: 8, right: 8 }`
  - On press: `setQuery('')` + `inputRef.current?.focus()` to keep keyboard open

### Focus behaviour

- Search bar is always visible (not collapsible) — no toggle button
- Tapping outside the input (scrolling) dismisses the keyboard but keeps the query

---

## Period Selector Visibility

When `searchActive === true`:
- Period selector pill row is hidden (`display: 'none'` or conditional render)
- Date range navigator (prev / next arrows + date label) is hidden
- Sort control row remains visible so the user can still sort search results

When `searchActive === false`:
- Restore normal period/navigator UI

---

## Stats Grid During Search

The stats grid recalculates using `filtered` as the input:

| Stat | Search-active label | Value |
|---|---|---|
| Total Spent | "Total Spent" | sum of all amounts in `filtered` |
| Avg / Item | "Avg / Item" | total / item count |
| Entries | "Results" | `filtered.length` |
| Highest | "Highest" | max single-entry total in `filtered` |

The period label above the stats (e.g. "April 2025") is replaced with `"Search results"` while search is active.

---

## Empty State

When `searchActive && filtered.length === 0`:

```
[Search01Icon, large, inkMuted]
No entries match "{query}"
Try a different word or clear the search.
[Clear Search] — text button that calls setQuery('')
```

The standard period empty state is used when `!searchActive && periodEntries.length === 0`.

---

## File Checklist

```
app/
  (tabs)/
    explore.tsx     # all changes — search state, bar UI, filtering, stats, empty state
```

No new files required.

---

## Acceptance Criteria

1. Search bar is visible at all times on the Browse screen.
2. Typing in the search bar immediately filters the entry list to notes containing the query (case-insensitive).
3. The period pills and date navigator are hidden while the query is non-empty.
4. Stats grid values reflect the filtered set, not the full period set.
5. The clear (×) button appears only when the query is non-empty; tapping it resets the list to the current period view.
6. No-match state shows the "No entries match" message with a clear-search action.
7. Tapping an entry in search results opens the edit sheet as normal.
8. `npx tsc --noEmit` passes with no errors.
