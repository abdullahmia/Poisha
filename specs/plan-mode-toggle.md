# Plan Mode — feature toggle for Upcoming Entries

> **Status:** `[x] Implemented`
> **Effort:** Small (one flag, one derived hook, one Settings section — ~11 files, no schema change, no new UI surfaces)
> **Depends on:** [`upcoming-entries.md`](./upcoming-entries.md) (implemented)

## Why

[`upcoming-entries.md`](./upcoming-entries.md) shipped planned entries as always-on: the date picker is uncapped for everyone, every spend total silently cuts at today, and Home/Browse grew Upcoming surfaces whether or not the user wants to think about the future. For a user who only ever logs what they've already spent, that's a behaviour change they never asked for and a chip in Browse that is permanently empty.

This spec puts the whole thing behind a **Plan Mode** switch in Settings, defaulting **off** — mirroring the `Enable Categories` flag that already exists (`lib/components/settings/categories-section.component.tsx`), so a second feature toggle reads as a familiar pattern rather than a one-off.

## Scope decisions

1. **Off means *exactly* how Poisha behaved before the Upcoming Entries feature.** Not "hidden but still special-cased" — genuinely reverted. Future-dated entries count as ordinary spend, appear in normal lists, sit in Recent, and feed the budget bar. The date picker re-caps at today.
2. **Consequence: flipping Plan Mode off raises your month total.** Any planned entries that already existed become spend the instant the toggle flips. This is the deliberate trade against the alternative (keep excluding them, just hide the surfaces), which would leave money both **invisible and uncounted** — stranded in a limbo the user has no UI to inspect. Given the choice between "your total changed and you can see exactly why" and "money vanished from every screen", the first is the only honest one.
3. **Nothing is written, migrated, or deleted when the toggle flips.** Entries are untouched; planned-ness was never stored (scope decision 1 of the parent spec), so there is no state to convert. Flipping off and back on restores the exact prior view.
4. **Default off** (`val === 'true'`, same as `useCategoriesEnabled`). Existing users see zero change until they opt in.
5. **One switch, no sub-settings.** No "hide upcoming from Home but keep it in Browse", no per-surface granularity. The feature is one idea and gets one control.

## The mechanism — a cutoff, not a flag scattered everywhere

The parent feature reduced to a single comparison against `today`, threaded through five consumers via `useToday()`. So gating it does **not** mean adding `if (enabled)` to five call sites — it means changing what those call sites compare *against*.

New `lib/hooks/use-plan-cutoff.hook.ts`:

```ts
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { useToday } from '@/lib/hooks/use-today.hook';

// A date no real entry can exceed. With Plan Mode off, every `date <= cutoff`
// test passes and every `isUpcomingISO(date, cutoff)` is false — so the entire
// planned-entry model collapses to "everything is actual" with no branching at
// any consumer.
export const NO_CUTOFF = '9999-12-31';

export function usePlanCutoff(): string {
  const { enabled } = usePlanMode();
  const today = useToday();
  return enabled ? today : NO_CUTOFF;
}
```

Every existing consumer swaps `useToday()` → `usePlanCutoff()` and changes **nothing else**:

| Consumer | With Plan Mode on | With Plan Mode off, automatically |
|---|---|---|
| `use-monthly-summary.hook.ts` | month cut at today; `plannedTotal` > 0 | `splitByUpcoming` returns everything as actual → `plannedTotal` 0, `plannedByDay` all zeros |
| `month-hero.component.tsx` | planned chip shown | `plannedTotal === 0` → chip not rendered |
| `budget-bar.component.tsx` | ghost fill + projection line | `planned === 0` → both already conditional, not rendered |
| `daily-flow-chart.component.tsx` | ghost bars + legend | `hasPlanned` false → no ghosts, no legend |
| `upcoming-section.component.tsx` | Upcoming list on Home | upcoming list empty → already returns `null` |
| `recent-entries.component.tsx` | planned excluded from Recent | `e.date <= NO_CUTOFF` passes → future entries back in Recent |
| `entry-card.component.tsx` | PLANNED pill, muted amount | `isUpcomingISO` false → renders exactly as it did pre-feature |
| `add-entry-sheet.component.tsx` | planned hint, "Schedule entry" | `planned` false → hint gone, button back to "Log entry" |
| `use-entries-list.hook.ts` | periods cut at today | `<= NO_CUTOFF` passes → Month/Year/All include future rows again |

Nine surfaces revert correctly and **not one of them needs an `enabled` check**. That is the entire argument for the sentinel: the failure mode this feature must avoid is *one forgotten call site* leaving entries excluded from a total with no UI to find them, and a design where forgetting is impossible beats a design where it's merely unlikely.

**Alternative rejected:** `usePlanCutoff(): string | null` with `null` meaning "no cut", forcing every site to write `cutoff === null || e.date <= cutoff`. More explicit to read at each site, but it reintroduces exactly the per-site branch the sentinel removes — nine chances to get it wrong, in the one place where getting it wrong hides money.

The sentinel's only real cost is that `'9999-12-31'` is a magic value. Mitigated by exporting it as a named constant with the comment above, and by the fact that string-comparison-on-ISO-dates is already the parent feature's stated foundation.

## The three places that *do* need the flag directly

Everything else falls out of the cutoff. These three genuinely need `enabled`, because they gate *authoring* or *chrome* rather than arithmetic:

### 1. Re-cap both date pickers

`add-entry-sheet.component.tsx` and `date-filter-sheet.component.tsx`:

```ts
const { enabled } = usePlanMode();
...
<DatePicker value={dateISO} onChange={setDateISO} maximumDate={enabled ? undefined : new Date()} />
```

`use-calendar-grid.hook.ts` already treats an absent `maximumDate` as "nothing disabled", so this needs no changes there — it's the same prop the parent spec removed, restored conditionally.

(Deriving the cap from the cutoff instead — `cutoff === NO_CUTOFF ? new Date() : undefined` — would avoid a second hook call but reads backwards. Two lines of clarity beat one line of cleverness.)

### 2. Drop the Upcoming chip from `period-selector.component.tsx`

The chip must not render when off, or it's a filter that can only ever show an empty list. It reads the flag itself rather than taking a prop, because `PERIODS` is module-level and the parent screen has no other reason to know:

```ts
const { enabled } = usePlanMode();
const periods = useMemo(
  () => (enabled ? PERIODS : PERIODS.filter(p => p.key !== 'upcoming')),
  [enabled],
);
```

### 3. Reset a stranded `upcoming` period in `use-entries-list.hook.ts`

If the user is sitting on Browse › Upcoming and turns Plan Mode off from Settings, `period` is left pointing at a filter whose chip no longer exists and whose list is now permanently empty. Reset during render, using the **exact pattern already in this hook** for `categoryFilter` (`prevCategoriesEnabled`), so it lands in the same commit rather than flashing an empty list for a frame:

```ts
const [prevPlanEnabled, setPrevPlanEnabled] = useState(planEnabled);
if (planEnabled !== prevPlanEnabled) {
  setPrevPlanEnabled(planEnabled);
  if (!planEnabled && period === 'upcoming') {
    setPeriod('month');
    setOffset(0);
    setSort('date-desc');
  }
}
```

Sort is restored alongside the period because `handlePeriodChange` is what normally pairs those two (it flips to `date-asc` on entering `upcoming`), and this path bypasses it.

## Outside React — `budget-notification.util.ts`

`checkBudgetAndNotify` runs from `use-save-entry.service.ts`'s `onSuccess`, so it can't use hooks and must read the flag from AsyncStorage directly, next to the existing `loadLocale()` helper:

```ts
async function loadPlanModeEnabled(): Promise<boolean> {
  return (await storage.getItem(ASYNC_STORAGE_KEYS.planModeEnabled)) === 'true';
}
```

Both guards the parent spec added become conditional on it:

```ts
const planMode = await loadPlanModeEnabled();
if (planMode && isUpcomingISO(entry.date)) return;   // skip planned saves — only when planning
...
const cutoff = planMode ? todayISO() : NO_CUTOFF;
const total = sumEntries(
  sqliteStorage.loadEntries().filter(e => e.date.startsWith(monthKey) && e.date <= cutoff),
);
```

With Plan Mode off this is byte-for-byte the pre-feature behaviour: every row in the month counts, and a future-dated save is evaluated like any other. Which is correct — if future entries are spend, a future entry crossing the budget *should* alert.

## The flag itself — mirroring `categoriesEnabled` exactly

**`lib/constants/storage-keys.constants.ts`** — `planModeEnabled: 'poisha_plan_mode_enabled'`
**`lib/constants/query-keys.constants.ts`** — `planMode: { enabled: ['planMode', 'enabled'] }`

**New `lib/services/plan-mode/`** (barrel `index.ts`, one file per operation, same shape as `lib/services/categories/`):

- `use-plan-mode-enabled.service.ts` — `useQuery`, reads the `'true'`/`'false'` string. **No `initialData`** — and this is not a stylistic copy: `use-categories-enabled.service.ts` carries a comment explaining that with the app-wide `staleTime: Infinity`, seeding `initialData` makes the query look already-fetched and skips reading the persisted value on cold start, silently resetting the flag on every launch. The same trap applies here verbatim.
- `use-set-plan-mode-enabled.service.ts` — `useMutation`, writes the string, `queryClient.setQueryData` on success.

**New `lib/hooks/use-plan-mode.hook.ts`** — wraps the pair, exposes `{ enabled, setEnabled }`, `enabled = query.data ?? false`. Mirrors the `enabled`/`setEnabled` half of `use-categories.hook.ts`; there's no list or CRUD to carry alongside it, so the hook stays two fields wide.

### One extra job for `setEnabled`: clear the budget stamp

`ASYNC_STORAGE_KEYS.budgetExceededMonth` records the month whose "over budget" alert already fired, so it never fires twice. Toggling Plan Mode changes the current month's total in one direction or the other, which can leave that stamp lying about the current state — most sharply when turning Plan Mode **on** drops the total back under budget: the month stays stamped, so when real spending later crosses the line for genuine reasons, the alert is suppressed.

So `use-set-plan-mode-enabled.service.ts`'s `mutationFn` also clears the stamp (and the mirrored `QUERY_KEYS.budget.exceededMonth` cache entry). The cost is that a user who toggles twice in an over-budget month can see the alert a second time; the benefit is that the alert can never be silently swallowed for a month the user is still spending in. A repeated notification is noise, a missing one is a broken feature.

## Settings UI — `lib/components/settings/planning-section.component.tsx`

New section, structurally a trimmed `CategoriesSection` (same `SectionHeader` + `Card` + `rowClass` + `Switch` composition, same `trackColor`/`thumbColor` wiring):

```
□ PLANNING
┌────────────────────────────┐
│ 🗓  Enable Plan Mode   [●] │
│     Schedule future entries│
└────────────────────────────┘
```

- `SectionHeader` icon `calendar`, label `Planning`.
- Row: `RowIcon` `calendar`, label **Enable Plan Mode**, sub-label `Schedule future entries` when off and `On` when on — the off state is where the explanatory copy earns its place, since that's when the user is deciding whether to flip it.
- **No second row.** ~~`CategoriesSection` gains a "Manage Categories" row when enabled because categories are editable objects; Plan Mode has nothing to manage.~~ **Superseded by [`plan-tab.md`](./plan-tab.md)** — planned entries do warrant a surface; it's a reporting one rather than a CRUD one, and it landed as a conditional bottom tab instead of a Settings row. The Planning section itself remains toggle-only. A row that merely counted planned entries was considered and dropped — it can't deep-link to Browse › Upcoming (that period lives in `useEntriesList` local state, not the router), so it would be a dead-end stat in the wrong screen.

Mounted in [app/(tabs)/settings.tsx](<../app/(tabs)/settings.tsx>) between `BudgetSection` and `CategoriesSection`, with `useFadeIn(300)` — the existing sections run 0 / 70 / 140 / 210 / 280 / 315 / 350 / 420, so 300 slots cleanly into the gap and keeps the two feature toggles (Plan Mode, Categories) adjacent to each other.

## Rollout

**Single phase.** The flag, the cutoff hook, the three direct gates, the notification change, and the Settings section all ship together — a flag with no switch is unreachable, and a switch with no gating is a lie. This is the same argument that put the Categories toggle in that feature's Phase 1 rather than a later one.

Note that this ships a *behaviour change for anyone already running the current build*: Upcoming surfaces disappear until they opt in via Settings. That's the intended outcome of defaulting off, and the parent feature has not been released, so no shipped user loses anything.

## Edge cases to handle explicitly

- **Turning Plan Mode off with planned entries present** — they become spend immediately, everywhere, in the same commit. The month total rises. Intended (scope decision 2); the entries are visible in the normal lists, so the change is inspectable rather than mysterious.
- **Sitting on Browse › Upcoming when the flag flips off** — handled by the render-phase reset above. Without it the user is parked on an invisible, permanently-empty filter.
- **The add-entry sheet open on a future date when the flag flips off** — can't happen in practice (Settings and the sheet can't both be foregrounded), but harmless if it did: the entry saves as an ordinary entry, the hint disappears on next render, and the picker re-caps the next time it's opened.
- **Toggling on, then off, then on again** — fully non-destructive, because no planned state is ever written. The Upcoming section reappears with the same entries in the same order.
- **CSV import of future-dated rows while off** — they import and count as spend, exactly as they did before the parent feature. Turning Plan Mode on later reclassifies them as planned with no import step to redo.
- **`todayISO()` staleness across midnight** — unchanged and still handled by `useToday()` inside `usePlanCutoff`. The flag layer adds no new staleness surface, since `NO_CUTOFF` is constant.
- **A user who never opens Settings never discovers the feature.** The accepted cost of defaulting off. Not solved here with a promo card or a tooltip — that's a separate discoverability decision, and the README/feature list carries it in the meantime.

## Deliberately out of scope

- **Per-surface granularity** (see scope decision 5).
- **Migrating planned entries to some other representation when the flag flips.** There is nothing to migrate; that's the point of the derived model.
- **An onboarding prompt or "new feature" badge for Plan Mode.**
- **Recurring entries** — still out of scope, still the natural successor, and now with a flag it could hang off (`Plan Mode → Recurring`) whenever it's specced.

## Files touched (summary)

| File | Change |
|---|---|
| `lib/constants/storage-keys.constants.ts` | `planModeEnabled` key |
| `lib/constants/query-keys.constants.ts` | `planMode.enabled` key |
| `lib/services/plan-mode/use-plan-mode-enabled.service.ts` | **new** — query, no `initialData` |
| `lib/services/plan-mode/use-set-plan-mode-enabled.service.ts` | **new** — mutation + budget-stamp clear |
| `lib/services/plan-mode/index.ts` | **new** — barrel |
| `lib/hooks/use-plan-mode.hook.ts` | **new** — `{ enabled, setEnabled }` |
| `lib/hooks/use-plan-cutoff.hook.ts` | **new** — `NO_CUTOFF` sentinel + cutoff |
| `lib/components/settings/planning-section.component.tsx` | **new** — toggle row |
| `app/(tabs)/settings.tsx` | mount `PlanningSection` at `useFadeIn(300)` |
| `lib/hooks/use-monthly-summary.hook.ts` | `useToday` → `usePlanCutoff` |
| `lib/hooks/use-entries-list.hook.ts` | `useToday` → `usePlanCutoff`; stranded-period reset |
| `lib/components/entries/entry-card.component.tsx` | `useToday` → `usePlanCutoff` |
| `lib/components/home/recent-entries.component.tsx` | `useToday` → `usePlanCutoff` |
| `lib/components/home/upcoming-section.component.tsx` | `useToday` → `usePlanCutoff` |
| `lib/components/entries/add-entry-sheet.component.tsx` | `usePlanCutoff` + conditional `maximumDate` |
| `lib/components/explore/date-filter-sheet.component.tsx` | conditional `maximumDate` |
| `lib/components/explore/period-selector.component.tsx` | filter the `upcoming` chip |
| `lib/utils/budget-notification.util.ts` | read flag; both guards conditional |
| `README.md` | note the Upcoming Entries bullet is opt-in via Settings › Planning |
| `specs/upcoming-entries.md` | status line points at this spec as its gate |

No changes to: `lib/utils/date.util.ts`, `lib/utils/entries.util.ts`, `lib/hooks/use-today.hook.ts`, `lib/components/home/month-hero.component.tsx`, `lib/components/home/budget-bar.component.tsx`, `lib/components/home/daily-flow-chart.component.tsx`, `lib/components/common/bar-chart.component.tsx`, `lib/components/explore/stats-grid.component.tsx`, `lib/components/explore/entries-list.component.tsx`, `lib/storages/*`, `lib/types/*`, `lib/services/entries/*`.
