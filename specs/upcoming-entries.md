# Upcoming (Planned) Entries

> **Status:** `[x] Implemented` (all three phases)
> **Gated by:** [`plan-mode-toggle.md`](./plan-mode-toggle.md) — everything below is behind the **Plan Mode** switch in Settings › Planning, off by default. Where this spec says "today", the implementation compares against the plan cutoff (`usePlanCutoff()`), which is today when Plan Mode is on and `NO_CUTOFF` when it's off.
> **Effort:** Medium (no schema migration, one new derived concept, ~14 files touched across 3 phases)

## Why

Today the date field is hard-capped at today — `add-entry-sheet.component.tsx` passes `maximumDate={new Date()}` to `DatePicker`, and `use-calendar-grid.hook.ts` disables every cell past it. So there is no way to write down "rent is ৳3,000 on the 20th" or "the Netflix charge hits Friday" ahead of time. The only workaround is to remember it and log it on the day.

The ask is to let a date in the future be entered — but a future-dated row is **not spend that happened**. If it were simply allowed through as-is, it would immediately corrupt every number the app reports: the month hero total, the budget bar percentage, the daily-flow chart, avg/day, Browse's "Total Spent", and — worst — `checkBudgetAndNotify` would fire a "you've crossed your budget" notification the moment you *plan* a big expense.

So the feature is not "unblock the picker." It's a second class of entry — **planned** — that is stored the same way, browsable and editable the same way, but excluded from actual-spend arithmetic until its date arrives.

## Scope decisions

1. **Planned-ness is derived from the date, never stored.** An entry is upcoming iff `entry.date > todayISO()`. No `status` column, no `is_planned` flag, no SQLite migration, no background job, no "confirm it" step. On the day it's due, it becomes actual spend by the passage of time alone. This is the whole reason the feature is Medium and not Large: there is no second state to keep in sync, so it cannot drift, and nothing has to run while the app is closed.
2. **Consequence: you can't plan an amount you don't know yet.** Because there's no confirm-on-due-date step, a planned entry counts at exactly the amount you typed. If the real bill differs you edit it after the fact, same as any past entry. Accepted deliberately — the alternative (a `planned`/`confirmed` status column plus a due-entry prompt) buys amount-correction at the cost of a migration, a nag surface, and entries that can silently sit unconfirmed forever, quietly under-reporting spend.
3. **"Spent" means `date <= today`, everywhere, without exception.** Every total, average, chart bar, budget percentage, and budget notification filters to actual. There is no setting to include planned spend in the spent number — a mixed number would be unreadable and un-reconcilable against a bank statement.
4. **Planned entries are never hidden — they live in named surfaces.** Home gets an `Upcoming` section; Browse gets an `Upcoming` period. They are never mixed into a list whose header says "spent," which is what makes rule 3 safe to state so absolutely: the user is never left hunting for money that vanished from a total.
5. **The entry itself is unchanged in every other respect.** Same `TEntry`, same table, same edit sheet, same swipe-to-delete, same categories, same CSV row. A planned entry is an entry.
6. **No notifications, no reminders.** Out of scope by explicit decision (see [Deliberately out of scope](#deliberately-out-of-scope)).

## The one primitive

Everything below is one comparison. `TEntry.date` is `YYYY-MM-DD`, so lexicographic string comparison *is* chronological comparison — no `Date` objects, no timezone surface.

Add to `lib/utils/date.util.ts`:

```ts
export function isUpcomingISO(iso: string, today: string = todayISO()): boolean {
  return iso > today;
}
```

The `today` parameter is not decoration — it exists so hooks can pass a **stable** today from `useToday()` (below) and stay referentially correct inside `useMemo`, instead of each call site reading the clock independently and drifting from each other mid-render.

New `lib/utils/entries.util.ts`:

```ts
import type { TEntry } from '@/lib/types';

export function splitByUpcoming(entries: TEntry[], today: string): { actual: TEntry[]; upcoming: TEntry[] } {
  const actual: TEntry[] = [];
  const upcoming: TEntry[] = [];
  for (const e of entries) (e.date > today ? upcoming : actual).push(e);
  return { actual, upcoming };
}

export function sumEntries(entries: TEntry[]): number {
  return entries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
}
```

`sumEntries` is not new logic — the identical `reduce`-inside-`reduce` is currently inlined in six places (`use-entries-list.hook.ts` ×3, `use-monthly-summary.hook.ts`, `entries-list.component.tsx`, `budget-notification.util.ts`). Extracting it here is incidental cleanup that keeps the new upcoming-aware call sites from adding a seventh and eighth copy.

## Staleness — `useToday()`

`todayISO()` is read during render, so a session left open across midnight keeps showing yesterday's answer: an entry dated "tomorrow" stays in Upcoming after it has become today, and the month total under-reports it. The app already has this class of bug in `getPeriodRange` (it calls `new Date()` inside a `useMemo` keyed only on `period`/`offset`), so this is not a regression the feature introduces — but the feature makes it *visible*, because a stuck "Upcoming" row is something the user can point at.

New `lib/hooks/use-today.hook.ts`:

```ts
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayISO } from '@/lib/utils/date.util';

export function useToday(): string {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') setToday(prev => {
        const next = todayISO();
        return next === prev ? prev : next;   // keep the same string ⇒ no re-render, no memo churn
      });
    });
    return () => sub.remove();
  }, []);

  return today;
}
```

`AppState` — not a midnight `setTimeout` and not a polling interval. The overwhelmingly common case is the app being backgrounded overnight and resumed the next day, which `active` catches exactly. The residual case (app held in the foreground *through* midnight) resolves on the next backgrounding, and is not worth a timer that has to be cancelled, re-armed across DST, and kept from firing in the background.

Returning the previous string when the date is unchanged matters: every resume would otherwise produce a new `today` value, invalidating every downstream `useMemo` on every app switch.

## Behaviour changes, surface by surface

### 1. Unblock the picker — `add-entry-sheet.component.tsx`

Drop `maximumDate={new Date()}` from the `DatePicker` at [add-entry-sheet.component.tsx:203](../lib/components/entries/add-entry-sheet.component.tsx#L203). No cap replaces it, matching the calendar's already-unbounded past direction; `use-calendar-grid.hook.ts` needs no change at all, since `maximumDate` is already optional and every disabled-cell / `canGoNext` code path degrades to "nothing is disabled" when it's absent.

Two affordances so a future date is never selected by accident and never ambiguous once selected:

- Under the date row, when `isUpcomingISO(dateISO, today)`: a single muted line — `Planned — won't count toward spending until {formatDateShort(dateISO)}`. This is the entire user-facing explanation of the feature; it must be present at the exact moment the user creates their first planned entry, not buried in Settings.
- The save button label flips `Log entry` → `Schedule entry` (and `Save changes` → `Save planned entry` when editing one).

### 2. Home — `useMonthlySummary` filters to actual

`lib/hooks/use-monthly-summary.hook.ts` gains `useToday()` and cuts `monthEntries` at today:

```ts
const today = useToday();
const monthEntries = useMemo(
  () => entries.filter(e => e.date.startsWith(monthKey) && e.date <= today),
  [entries, monthKey, today],
);
```

That one line makes `total`, `count`, `txCount`, `chartData`, `maxDay`, `avgDay` **and** `progress` (fed by `getProgress(total)`, so the budget bar too) actual-only for free — every one of them is derived from `monthEntries`. For any month before the current one the filter is a no-op, so history is untouched.

The hook additionally returns `upcomingInMonth` (the same month's `date > today` rows) and `plannedTotal`, so `MonthHero` can surface planned spend without a second pass over `entries`.

`MonthHero` gains a fourth stat chip, rendered only when `plannedTotal > 0`: `{fmt(plannedTotal)} planned`. The big hero number stays actual-only.

`MonthNav` keeps its `monthOffset >= 0` forward cap — Home is the record of what has been spent, and next month's plans are reachable through the Upcoming section and Browse's Upcoming period. Lifting the cap would mean a "This Month" hero reading ৳0 for a month that hasn't started, which reads as data loss.

### 3. Home — new `Upcoming` section

New `lib/components/home/upcoming-section.component.tsx`, following `recent-entries.component.tsx` almost exactly (same `useFadeIn`, same header row with an uppercase right-hand caption, same `EntryCard` + `openEdit` wiring):

- Reads all entries via `useEntries()`, takes `date > today`, sorts **ascending** (soonest first — the opposite of Recent, and the whole point of the section), slices to 5.
- Renders nothing at all when the list is empty. No empty state, no placeholder card — a user who never schedules anything should see a Home screen identical to today's.
- Right-hand caption is the count and total (`3 · ৳4,500`) rather than Recent's `last N`, because the aggregate is the reason to glance at the section.
- Each card gets the planned treatment from §5.

Placed **between `DailyFlowChart` and `RecentEntries`** in [app/(tabs)/index.tsx](<../app/(tabs)/index.tsx>), so the screen reads chronologically top-to-bottom: this month's totals → the chart → what's coming → what just happened. (Alternative considered: directly under `BudgetBar`, pairing "spent" with "committed". Rejected — it pushes the chart below the fold on small devices for every user who schedules anything.)

### 4. Home — `RecentEntries` excludes planned

`recent-entries.component.tsx` currently sorts *all* entries by date descending and takes 4 — so the day this ships, a planned entry would sit permanently at the top of "Recent," which is precisely wrong. Filter to `e.date <= today` before sorting.

### 5. `EntryCard` — planned treatment

`entry-card.component.tsx` gains `useToday()` and `const planned = isUpcomingISO(entry.date, today)`. When planned:

- The amount renders in `ink-soft` rather than `ink` — it is not money that has left.
- A small uppercase `PLANNED` pill next to the note line (same 10px/letterSpacing type ramp already used for the `Recent` / `Summary` captions).
- The left stripe, when present, renders at reduced opacity. Category colour and the multi-amount accent still win over each other exactly as they do today — planned only dials the opacity, so a planned Food entry is still visibly Food.

Everything else — tap-to-edit, swipe-to-delete via `swipeable-entry-card.component.tsx`, category icon, multi-amount breakdown — is untouched and needs no prop threading, since the card derives `planned` itself from the entry it already has.

### 6. Browse — a new `upcoming` period

`TPeriod` in `lib/utils/date.util.ts` gains `'upcoming'`, and `getPeriodRange` returns an empty range for it the way `'all'` already does:

```ts
if (period === 'upcoming') return { start: '', end: '', label: 'Upcoming', sublabel: 'planned entries' };
```

`use-entries-list.hook.ts` — the `filtered` memo's base selection becomes:

```ts
const today = useToday();
let base = isDateFiltering
  ? entries.filter(e => e.date === dateFilter)          // exact-day filter: shows planned days too
  : period === 'upcoming'
    ? entries.filter(e => e.date > today)
    : period === 'all'
      ? entries.filter(e => e.date <= today)
      : entries.filter(e => e.date >= range.start && e.date <= range.end && e.date <= today);
```

Three things to note in that ladder:

- **Every non-upcoming period gains `&& e.date <= today`.** Without it, "This Month" and "This Year" would silently include planned rows in `stats.total` — the exact corruption this spec exists to prevent. `'all'` is included: "All Time" means all spending, not all rows.
- **The date filter deliberately does not cut at today.** Picking a future day off the calendar is the natural "what's planned on the 20th" gesture, and it is unambiguous because the day is right there in the header. This requires dropping `maximumDate={new Date()}` from `date-filter-sheet.component.tsx` too — otherwise future days stay unpickable on the very screen that now has an Upcoming period.
- **Sort direction flips for upcoming.** `handlePeriodChange` sets `sort` to `'date-asc'` when switching to `upcoming` and back to `'date-desc'` when leaving it. Soonest-first is the only useful ordering for a list of things that haven't happened; the user can still override with the sort chips.

Also in that hook: `canGoForward` becomes `period !== 'all' && period !== 'upcoming' && offset < 0`.

`explore.tsx` hides `PeriodRangeNav` for `upcoming` exactly as it already does for `isDateFiltering` — there is no previous/next window to step through.

`period-selector.component.tsx` appends `{ key: 'upcoming', label: 'Upcoming' }`. Rendered unconditionally, not gated on having planned entries: a chip that appears only once you've already used the feature can't teach you the feature exists. Its empty state does the teaching (§7).

**Alternative rejected:** leaving planned entries inline in the normal Month/Year lists with just a `PLANNED` badge, and subtracting them from stats. That produces a list whose visible rows demonstrably don't add up to the "Total Spent" card directly above them — the user is left doing arithmetic to find the discrepancy. A separate period keeps every list internally consistent with its own header.

### 7. Browse — label and empty-state copy

- `stats-grid.component.tsx`: `Total Spent` → `Total Planned` when `period === 'upcoming'`, and `Avg / Day` → `Avg / Entry` (a day-average over future dates is meaningless). The component already takes `period`, so no new prop.
- `results-summary.component.tsx`: **no change.** Its copy is already period-neutral (`N results · ৳X`), so it reads correctly under Upcoming without a new prop.
- `entries-list.component.tsx`: the `ListEmptyComponent` ladder gains an upcoming branch — `Nothing planned. Pick a future date when adding an entry to schedule it.` This is the discoverability payload for the always-visible chip.

### 8. Budget notification — a live bug this feature would otherwise trigger

`checkBudgetAndNotify` in `lib/utils/budget-notification.util.ts` sums *every* row in the entry's month:

```ts
.filter(e => e.date.startsWith(monthKey))
```

Schedule ৳3,000 of rent on the 20th and this fires "You've crossed your budget" on the spot — and worse, it stamps `budgetExceededMonth`, permanently suppressing the *real* alert for that month. Fix:

```ts
const today = todayISO();
.filter(e => e.date.startsWith(monthKey) && e.date <= today)
```

This util runs outside React (called from `use-save-entry.service.ts`'s `onSuccess`), so it calls `todayISO()` directly rather than `useToday()`.

Second, related guard in the same function: when the saved entry is itself planned, skip the budget check entirely — `if (isUpcomingISO(entry.date)) return;` right after the notifications-enabled check. Without it, saving a planned entry pointlessly re-reads the whole table and re-evaluates the current month's budget. Cheap, and it keeps the "planned money is not spent money" rule true at the one place that reaches outside the app.

### 9. CSV, widget, and the rest — unchanged

- **`csv.util.ts` — no change.** The format stays `id,date,amounts,note`. Planned entries export as ordinary rows and re-import as planned (their date is still in the future) or as actual (if that date has since passed) — both correct, both automatic. Nothing to version, nothing to validate.
- **`use-csv-export.hook.ts` — no change.** Export keeps writing every entry including planned. They're real user data; a backup that silently drops next month's rent is a broken backup.
- **`use-import-entries.service.ts` — no change.** Future-dated rows already import fine today; this spec is what finally gives them defined behaviour instead of silently poisoning totals.
- **`widget-snapshot.util.ts` — no change.** It filters `e.date === today`, which can never match a planned entry.
- **`use-entries.hook.ts` — no change.** `entries` stays the complete list. Each consumer opts into the split, because the three that need it (`useMonthlySummary`, `RecentEntries`, `useEntriesList`) need it at different granularities, while export and the widget genuinely want everything. Filtering centrally would just force those two to un-filter.

## Rollout

Three independently shippable phases. Phase 1 alone is a complete, honest feature.

**Phase 1 — the model and the guarantee.** `isUpcomingISO`, `splitByUpcoming`/`sumEntries`, `useToday`, unblock both date pickers, the `useMonthlySummary` cut, the `RecentEntries` filter, the `use-entries-list` cut, the `EntryCard` planned treatment, the add-sheet hint and button label, and both budget-notification fixes. After this, future dates are enterable, visibly marked, and provably absent from every spend number — but the only way to see all of them at once is Browse's date filter. Ship it in this order regardless of the phases below: **the §8 notification fix must land in the same release that unblocks the picker**, or the first user to schedule rent gets a false budget alert and loses that month's real one.

**Phase 2 — the surfaces.** Home's `UpcomingSection`, `MonthHero`'s planned chip, Browse's `upcoming` period with its label and empty-state copy. This is where the feature becomes something you'd use on purpose rather than something that merely doesn't break.

**Phase 3 — polish, optional.** Ghost/outlined bars for planned days in `DailyFlowChart`; a projected-spend marker on `BudgetBar` (`planned would put you at 112%`), which is genuinely useful and the most-likely-requested follow-up but needs its own visual design pass to avoid reading as already-exceeded.

## Edge cases to handle explicitly

- **Editing a planned entry's date back into the past** — it becomes actual immediately on save, joins the month total, and the budget check runs against it. Falls out of the derived model with no special handling; listed because it's the obvious thing a reviewer will look for and there is genuinely nothing to write.
- **A planned entry whose day arrives while the app is open** — resolved by `useToday()` on next resume (§ Staleness). Bounded, self-correcting, no data at risk.
- **Deleting a planned entry** — plain delete, no confirmation difference. Nothing was ever counted, so nothing is being reversed.
- **A planned entry in a month the budget check never revisits** — plan ৳5,000 for next month, and no notification fires when next month arrives, because `checkBudgetAndNotify` only runs on save. That's the existing design of budget alerts (they are save-triggered, not time-triggered), not something this feature regresses; noted so it isn't mistaken for a bug introduced here.
- **Timezone / device clock changes** — every comparison is string-vs-string on local-calendar ISO dates produced by the same `dateToISO`, so a traveller crossing a date line sees the boundary move with their device, consistently across every surface at once. There is no UTC/local mismatch to get wrong because no `Date` arithmetic happens.
- **Very distant dates** — the picker is uncapped, so `2099-01-01` is enterable. Accepted: it sorts last in Upcoming, counts toward nothing, and is as harmless as the equally-uncapped `1970` entry you can already create today.
- **CSV round-trip across a due date** — export a planned entry, re-import after its date passes, and it lands as actual spend. Correct, and worth stating because it's the one place "planned" changes meaning without the user editing anything.

## Deliberately out of scope

- **Recurring entries** ("rent, monthly"). The natural next feature and a clean superset — a recurrence rule would generate planned entries, which this spec already knows how to display and settle. Deliberately separate: recurrence needs a rules table, a generation strategy, and an edit-this-vs-edit-all-future decision, none of which this feature needs and all of which would land better on top of a shipped, proven planned layer.
- **Notifications / reminders on the due date.** Chosen against explicitly: the entry counts itself automatically, so a reminder would be informational only, and `expo-notifications` scheduling per entry brings cancellation-on-edit and cancellation-on-delete bookkeeping that a purely date-derived model otherwise avoids entirely.
- **A confirm-on-due-date step** (see scope decision 2).
- **Planned income / positive amounts.** The app models spending only; unchanged here.

## Files touched (summary)

| File | Change | Phase |
|---|---|---|
| `lib/utils/date.util.ts` | `isUpcomingISO`; `'upcoming'` in `TPeriod`; `getPeriodRange` branch | 1 |
| `lib/utils/entries.util.ts` | **new** — `splitByUpcoming`, `sumEntries` | 1 |
| `lib/hooks/use-today.hook.ts` | **new** — AppState-revalidated today | 1 |
| `lib/components/entries/add-entry-sheet.component.tsx` | drop `maximumDate`; planned hint; button label | 1 |
| `lib/components/explore/date-filter-sheet.component.tsx` | drop `maximumDate` | 1 |
| `lib/components/entries/entry-card.component.tsx` | planned pill, muted amount, dimmed stripe | 1 |
| `lib/hooks/use-monthly-summary.hook.ts` | cut at today; return `upcomingInMonth` + `plannedTotal` | 1 |
| `lib/components/home/recent-entries.component.tsx` | exclude planned | 1 |
| `lib/hooks/use-entries-list.hook.ts` | `upcoming` period; `<= today` on all others; sort flip; `canGoForward` | 1 |
| `lib/utils/budget-notification.util.ts` | exclude future dates from the month sum; skip on planned save | 1 |
| `lib/components/home/upcoming-section.component.tsx` | **new** | 2 |
| `app/(tabs)/index.tsx` | mount `UpcomingSection` | 2 |
| `lib/components/home/month-hero.component.tsx` | planned chip | 2 |
| `lib/components/explore/period-selector.component.tsx` | `Upcoming` chip | 2 |
| `app/(tabs)/explore.tsx` | hide `PeriodRangeNav` for `upcoming` | 2 |
| `lib/components/explore/stats-grid.component.tsx` | `Total Planned` / `Avg / Entry` labels | 2 |
| `lib/components/explore/entries-list.component.tsx` | upcoming empty state | 2 |
| `README.md` | "date picker (capped at today)" is no longer true | 2 |
| `lib/components/home/daily-flow-chart.component.tsx` | ghost bars for planned days | 3 |
| `lib/components/home/budget-bar.component.tsx` | projected-spend marker | 3 |

No changes to: `lib/components/explore/results-summary.component.tsx`, `lib/hooks/use-calendar-grid.hook.ts`, `lib/storages/sqlite.storage.ts`, `lib/types/entry.types.ts`, `lib/schemas/entry.schemas.ts`, `lib/utils/csv.util.ts`, `lib/services/entries/*`, `lib/utils/widget-snapshot.util.ts`, `lib/hooks/use-entries.hook.ts`.
