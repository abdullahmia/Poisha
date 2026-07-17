# Entry Date Filter

> **Status:** `[x] Implemented`
> **Effort:** Small (one hook, two new components, no schema/storage change)

## Why

The Browse screen (`app/(tabs)/explore.tsx`) already has period filters (Day/Week/Month/Year/All) that step through *relative* windows of time, but there's no way to jump straight to one specific arbitrary day (e.g. "what did I spend on March 3rd") without repeatedly tapping the Day period's prev/next nav. A calendar-driven date filter fills that gap: tap a filter control, pick a date off a calendar, see that day's entries, clear it to go back to whatever period view was active.

This supersedes an earlier free-text search spec that lived at this path — search was explicitly ruled out in favor of this date-filter approach.

## Scope decisions

1. **Single date, not a range.** The ask is "pick a date, show entries for that date," not a from/to range picker. Keeps the UI to the existing single-select `DatePicker` (`lib/ui/date-picker.ui.tsx`) with no new component needed for the calendar itself.
2. **Reuse the existing calendar UI.** `lib/ui/date-picker.ui.tsx` + `lib/hooks/use-calendar-grid.hook.ts` already power the date field in `AddEntrySheet` — no new calendar dependency, no new grid logic.
3. **Date filter overrides period filtering, not sort or category filter.** While a date is selected, the result set is every entry on that exact date, regardless of the selected period — mirroring how period filters already override each other. Sort orders and the category filter chips keep applying on top, since "highest entry that day" or "only Food entries that day" are still meaningful.
4. **Filter state lives in `use-entries-list.hook.ts`, not local `useState` in the screen.** Period/sort/category filter/stats/grouping all already live in that hook and the date filter needs to interact with all of them (override period, feed `stats`, feed `grouped`) the same way they do.
5. **Clearing the filter does not reset period/offset/sort/category filter.** Returning to no-date-filter restores exactly the period view the user had before picking a date, rather than snapping back to a default. This is why `dateFilter` is independent state, not folded into `handlePeriodChange`'s reset logic.
6. **Icon button, not a full-width bar.** Lives to the right of the "Entries" title in `ExploreHeader`, matching the small round icon-button style used elsewhere (e.g. the prev/next controls in `DatePicker`'s month nav) rather than the always-visible text row originally sketched for search. An accent-colored dot badges the calendar icon when a filter is active, since there's no room for a date label at that size.
7. **Two ways to clear:** a dedicated "x" icon button that appears next to the calendar button only while a filter is active (fast path, no sheet needed), and a "Clear filter" button inside the calendar sheet itself (for when the user already opened it to change their mind). Both call the same `setDateFilter(null)`.
8. **Picking a date auto-applies and closes the sheet** — no separate "Apply"/"Done" step, since there's only one value to set.

## Hook changes — `lib/hooks/use-entries-list.hook.ts`

Added `dateFilter` state and a derived `isDateFiltering` flag:

```ts
const [dateFilter, setDateFilter] = useState<string | null>(null);
const isDateFiltering = dateFilter !== null;
```

`filtered` memo — when a date filter is active, skip the period/`range` filter entirely and match on exact date; category filter and sort still apply after:

```ts
let base = isDateFiltering
  ? entries.filter(e => e.date === dateFilter)
  : period === 'all'
    ? [...entries]
    : entries.filter(e => e.date >= range.start && e.date <= range.end);
```

`stats` and `grouped` are already derived from `filtered`, so they need no changes.

Exposed from the hook: `dateFilter, setDateFilter, isDateFiltering`.

## New component — `lib/components/explore/date-filter-button.component.tsx`

A row of one or two small round icon buttons (`h-11 w-11 rounded-full border border-line bg-surface-alt`, matching the calendar month-nav buttons in `DatePicker`). The calendar button (`Feather name="calendar"`) always renders; when a date is selected, its icon switches to the accent color, a small accent dot badges its top-right corner, and a second "x" icon button (`Feather name="x"`) renders to its left for one-tap clearing without opening the sheet. Rendered via `ExploreHeader`'s new `right` slot, so it sits inline with the "Entries" title instead of occupying its own row.

## New component — `lib/components/explore/date-filter-sheet.component.tsx`

Wraps the existing `BottomSheet` + `DatePicker`. Selecting a day calls `onSelect` and closes the sheet immediately. When a filter is already active, a "Clear filter" button appears below the calendar grid.

## Screen wiring — `app/(tabs)/explore.tsx`

Placement: passed to `ExploreHeader`'s `right` prop, so the icon button sits beside the "Entries" title rather than below it. When `isDateFiltering` is true:
- Hide `PeriodSelector` and `PeriodRangeNav` (a specific date supersedes the period nav, same principle as the `all` period already hiding `PeriodRangeNav`).
- Keep `CategoryFilterChips`, `StatsGrid`, `CategoryBreakdown`, and `SortSelector` mounted — all already operate on the (now date-filtered) `filtered`/`stats`.
- Pass `period="day"` to `StatsGrid` while filtering (regardless of the actual underlying period) so it shows the per-item average framing that already exists for the Day period, since the result set is a single day either way.
- `ResultsSummary` continues to work unmodified.

The `DateFilterSheet` is rendered as a sibling of `EntriesList` (not inside `ListHeaderComponent`) since it's a full-screen modal, not part of the scrolling content.

## Empty state — `lib/components/explore/entries-list.component.tsx`

Added an optional `dateFilter?: string | null` prop; when present, the empty-state copy becomes `No entries on {formatDateLong(dateFilter)}`, ahead of the existing period-based copy.

## Edge cases

- **Future dates** — `DatePicker`'s `maximumDate={new Date()}` (same as the `AddEntrySheet` date field) disables picking a day that hasn't happened yet.
- **Switching sort/category filter while date-filtering** — supported for free; both filters run after the date-vs-period branch in the `filtered` memo, same as they already do for period.
- **Navigating away from Browse mid-filter** — filter state lives in the hook, which is re-instantiated from `explore.tsx` on mount, so leaving and returning to the tab clears it. This matches how `period`/`sort`/`categoryFilter` already behave.

## Files touched

**New:** `lib/components/explore/date-filter-button.component.tsx`, `lib/components/explore/date-filter-sheet.component.tsx`

**Modified:** `lib/hooks/use-entries-list.hook.ts`, `app/(tabs)/explore.tsx`, `lib/components/explore/entries-list.component.tsx`
