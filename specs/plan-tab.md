# Plan Tab — a dedicated screen for planned entries

> **Status:** `[ ] Planned`
> **Effort:** Medium (one tab-bar refactor, one new screen with five blocks, one derivation hook — ~12 files, no schema change)
> **Depends on:** [`upcoming-entries.md`](./upcoming-entries.md), [`plan-mode-toggle.md`](./plan-mode-toggle.md) (both implemented)

## Why

Planned entries currently live in two thin slices: a five-item preview on Home and a filter chip in Browse. Neither answers the questions a person actually has once they've scheduled a few things — *how much am I committed to over the next three months? does September's rent plus subscriptions still fit my budget? what categories is my future money going to?*

This spec gives Plan Mode its own bottom tab: a full screen that shows every planned entry grouped by month, with a summary, per-month budget projections, and a category breakdown. The tab appears only when Plan Mode is on, so a user who hasn't opted in sees today's three-tab bar unchanged.

**Supersedes** the "No second row" decision in [`plan-mode-toggle.md`](./plan-mode-toggle.md#settings-ui) — that spec argued planned entries had no management surface worth navigating to. They do; it's just a reporting surface rather than a CRUD one, and it belongs in the tab bar rather than buried in Settings.

## Scope decisions

1. **A tab, not a Settings sub-screen.** Planned money is something you check, not something you configure. The Categories precedent (`Settings › Manage Categories → /category-management`) is the wrong shape here: that screen edits a list of objects you rarely touch, this one reports on money you'll want to glance at repeatedly.
2. **The tab is conditional on Plan Mode.** Off → today's exact four-slot bar (Home, Entries, Add, Settings). On → five slots (Home, Entries, Add, Plan, Settings). As a bonus, five slots put the Add button dead centre, which four never did.
3. **Every number on the screen is shown next to its actual-spend counterpart.** A planned total in isolation isn't decision-useful — "৳3,000 planned" means something very different against ৳2,000 already spent than against ৳14,000. So the summary and the per-month rows both read `spent + planned = projected`. This is the one place in the app where actual and planned money appear in the same figure, and it's safe here precisely because the screen's whole subject is the future.
4. **The screen is read-and-edit, not create.** No "add planned entry" button — the existing `+` in the tab bar already opens the entry sheet, where picking a future date is the documented gesture. Tapping a row opens the same edit sheet; swiping deletes. No new mutation paths.
5. **Home's `UpcomingSection` stays.** It's the glanceable version and the tab is the detailed one — the same relationship Home's `RecentEntries` already has with Browse. Its `+N more in Browse › Upcoming` line becomes `+N more in Plan`, since that copy is now pointing at the wrong place.

## The real work — un-hardcoding the tab bar

`app/(tabs)/_layout.tsx` renders four `TabButton`s with **positional indices baked into every one of them**:

```tsx
<TabButton label={TABS[0].label} active={state.index === 0} onPress={() => handleTabPress(0, state.routes[0])} />
<TabButton label={TABS[1].label} active={state.index === 1} onPress={() => handleTabPress(1, state.routes[1])} />
<TabButton label="Add" ... />
<TabButton label={TABS[2].label} active={state.index === 2} onPress={() => handleTabPress(2, state.routes[2])} />
```

The `name` field on each `TABS` entry is declared and **never read**. That's the whole bug waiting to happen: expo-router registers every file in `app/(tabs)/` as a screen, so the moment `plan.tsx` exists, `state.routes` contains it **whether or not its button renders**. Declared between `explore` and `settings`, it shifts `settings` from index 2 to index 3 — and the hardcoded `state.index === 2` would then light up the Settings tab while the user is on Plan, and `handleTabPress(2, state.routes[2])` would navigate to Plan when they tap Settings. Silent, and exactly the kind of thing that survives a quick manual test on the happy path.

So the refactor is not optional dressing — it's the prerequisite. Look tabs up **by name**:

```tsx
const ALL_TABS = [
  { name: 'index', label: 'Home', icon: Home01Icon },
  { name: 'explore', label: 'Entries', icon: ListViewIcon },
  { name: 'plan', label: 'Plan', icon: Calendar01Icon },
  { name: 'settings', label: 'Settings', icon: Settings01Icon },
];

const { enabled: planEnabled } = usePlanMode();
const tabs = useMemo(
  () => (planEnabled ? ALL_TABS : ALL_TABS.filter(t => t.name !== 'plan')),
  [planEnabled],
);

function renderTab(tab: (typeof ALL_TABS)[number]) {
  const i = state.routes.findIndex(r => r.name === tab.name);
  if (i === -1) return null;                       // route not registered — skip, never crash
  return (
    <TabButton
      key={tab.name}
      label={tab.label}
      icon={tab.icon}
      active={state.index === i}
      colors={colors}
      onPress={() => handleTabPress(i, state.routes[i])}
    />
  );
}
```

And the Add button keeps its position by splitting the list rather than by index arithmetic:

```tsx
{tabs.slice(0, 2).map(renderTab)}
<TabButton label="Add" icon={Add01Icon} active={false} colors={colors} onPress={...} />
{tabs.slice(2).map(renderTab)}
```

**Always after the first two tabs** — which reproduces today's layout exactly when Plan Mode is off (Home, Entries, Add, Settings) and centres Add when it's on (Home, Entries, Add, Plan, Settings). No `Math.floor(length / 2)` cleverness that happens to be right for two cases and wrong for a third.

`TabLayout` gains `<Tabs.Screen name="plan" />` between `explore` and `settings`. Declaration order now only affects `state.routes` ordering, which nothing reads positionally any more.

## Route guard — `app/(tabs)/plan.tsx`

The route exists even when its button doesn't, so it must guard itself against deep links and against being left focused when the flag flips:

```tsx
const { enabled, loading } = usePlanMode();
if (loading) return <LoadingSplash />;
if (!enabled) return <Redirect href="/" />;
return <PlanScreen />;
```

**The `loading` check is not defensive padding — without it the guard is wrong.** `usePlanModeEnabled` is a `useQuery` with no `initialData` (deliberately — see [`plan-mode-toggle.md`](./plan-mode-toggle.md#the-flag-itself--mirroring-categoriesenabled-exactly)), so `data` is `undefined` on the first render while AsyncStorage resolves, and `enabled` falls back to `false`. A cold start deep-linked to `/plan` with Plan Mode genuinely **on** would redirect the user to Home before the flag ever loaded.

This requires `usePlanMode()` to expose the pending state, which it currently swallows:

```ts
return { enabled, setEnabled, loading: enabledQuery.isPending };
```

Only the route guard consumes `loading`. The tab-bar button has the same one-frame gap but it's a harmless flicker there — a button that appears a frame late, not a navigation to the wrong screen.

## Data — `lib/hooks/use-plan-summary.hook.ts`

One hook derives everything the screen needs, so the five blocks never each re-scan `entries`:

```ts
export function usePlanSummary() {
  const { entries } = useEntries();
  const cutoff = usePlanCutoff();
  const { budget } = useBudget();
  ...
}
```

Returning:

| Field | Meaning |
|---|---|
| `planned` | every `date > cutoff` entry, ascending |
| `plannedTotal`, `count` | totals across all future dates |
| `nextDue` | `{ entry, daysAway }` for the soonest, or `null` |
| `thisMonth` | `{ actual, planned, projected }` for the current month — the scope-decision-3 figure |
| `months` | one row per month that has planned entries: `{ key, label, entries, planned, actual, projected, percentOfBudget }` |

Two notes on the month rows:

- **`actual` is only ever non-zero for the current month.** A future month has no recorded spend by definition. It's still computed per-month rather than special-cased, because the alternative is a branch that silently breaks the day someone back-dates an entry into a month they'd also planned into.
- **`percentOfBudget` uses `projected`, not `planned`.** The question is "will I blow September's budget", and for the current month that has to include what's already gone.

`daysAway` is computed from `cutoff`, not a fresh `todayISO()`, so it can't disagree with the planned/actual split rendered beside it.

## The screen — `lib/components/plan/`

Five blocks in a `SectionList` (the entries list is the scrolling body; everything above it is `ListHeaderComponent`, the same composition `explore.tsx` already uses).

### 1. `plan-header.component.tsx`
Eyebrow `PLANNING` + title `Plan`, matching `ExploreHeader`'s type ramp exactly (11px/letterSpacing 2 uppercase over 30px SpaceGrotesk_700Bold).

### 2. `plan-summary.component.tsx`
The hero. Big number is `plannedTotal` across all future dates, in the `MonthHero` type ramp (56px SpaceGrotesk_300Light). Under it, a chip row: `{count} planned · next {note or category} in {daysAway} days`.

Then the scope-decision-3 block — three figures for **this month**, side by side:

```
  SPENT          PLANNED         PROJECTED
  ৳12,000        ৳3,000          ৳15,000
```

`Spent` in `ink`, `Planned` in `ink-soft` (the same muting `EntryCard` uses for planned amounts), `Projected` in `accent`. The colour assignment is the whole explanation: real money reads solid, planned money reads soft, and the sum reads as the thing to pay attention to.

### 3. `plan-month-budget.component.tsx`
One row per month from `months`, each with label, `{projected} of {budget}`, and a two-segment bar — solid `accent` for `actual`, 30%-opacity `accent` for `planned` stacked on top. This is deliberately the **same visual language `BudgetBar` already uses** for its projected fill, so a user who has seen the Home budget bar reads this without a legend.

Over-budget months render the percentage in `danger`; the bar segments stay accent-coloured. (`BudgetBar` turns its fill `danger` when actual spend exceeds — here the overrun is a forecast, and the parent spec's rule that a forecast must not read as already-exceeded still applies.)

**The entire block is omitted when `budget === null`** — there's nothing to compare against, and a bar with no denominator is noise.

### 4. `plan-category-breakdown.component.tsx`
Planned spend grouped by category: emoji, name, total, and a share bar in `category.color`. Uncategorized folds into a synthetic `❔ Uncategorized` row rather than being dropped, or the percentages wouldn't sum to the total.

**Omitted entirely when the Categories feature is off**, read via `useCategories().enabled` — the same all-or-nothing gating `CategoryFilterChips` already uses on Browse.

Note: `specs/categories.md` specified a `use-category-breakdown.hook.ts` for a Browse breakdown card that was never built, so the grouping is net-new. Build it inside `use-plan-summary.hook.ts` scoped to planned entries; if the Browse card ever ships it can lift the logic out then, rather than this spec building a shared abstraction for one caller.

### 5. `plan-entries-list.component.tsx`
`SectionList` grouped **by month** — section header is the month label with its planned subtotal, rows are `SwipeableEntryCard` (so tap-to-edit and swipe-to-delete come free and behave identically to Browse).

A new component rather than reusing `explore/entries-list.component.tsx`: that one groups by *date* and renders `formatDateShort(section.title)` in its header, so feeding it month keys would print garbage. Generalizing it to accept pre-built sections was considered and rejected for now — it would mean churning the working Browse list to serve a second caller, and the shared surface that actually matters (`SwipeableEntryCard`) is already reused directly.

**Empty state** — Plan Mode on with nothing scheduled is a real and common state (it's what every user sees the moment they flip the toggle). The screen renders the header and an empty state explaining the gesture: *"Nothing planned yet. Tap + and pick a future date to schedule an expense."* The summary, budget, and category blocks are all omitted at zero, so the screen is a title and one sentence rather than a wall of `৳0`.

## Open question — Browse's Upcoming chip is now redundant

With a whole tab for planned entries, Browse's `upcoming` period does much the same job. **Recommendation: keep it.** It composes with the sort chips and the category filter, which the Plan tab deliberately doesn't offer ("highest planned expense", "only planned Food") — and removing it would mean re-deleting a period from `TPeriod`, `getPeriodRange`, `PeriodSelector`, `StatsGrid`, and the empty-state ladder, for a feature that costs nothing to leave in place.

Flagging rather than silently deciding: if the chip feels like clutter once the tab exists, deleting it is a clean follow-up and this spec doesn't depend on it either way.

## Edge cases to handle explicitly

- **Plan Mode toggled off while the user is on the Plan tab.** `freezeOnBlur: true` means the screen isn't unmounted, but Settings and Plan can't be foregrounded at once — so the flag flips on Settings, and the redirect fires when Plan is next focused. Bounded, and the user lands on Home rather than a frozen empty screen.
- **Cold start deep-linked to `/plan`** — handled by the `loading` gate above. This is the case the naive guard gets wrong.
- **A planned entry maturing while the Plan tab is open** — `usePlanCutoff` revalidates on AppState resume, so the entry leaves the list and rejoins Home's totals together. No partial state where it's in both.
- **Editing a planned entry's date into the past from this screen** — it disappears from the list on save, because the list is derived. Correct, and worth stating because the row vanishing could otherwise look like a failed delete.
- **Every planned entry deleted while on the screen** — falls through to the empty state; the summary and breakdown blocks unmount at zero rather than rendering `৳0` rows.
- **A month with planned entries but no budget set** — the budget block is omitted wholesale (not per-row), so there's no mixed list where some months show bars and others don't.
- **Planned entries far in the future** (`2099-01-01`) — produce a month row each. Accepted, same as the parent spec's position: they sort last and are as harmless as an equally-distant past entry.

## Deliberately out of scope

- **Creating entries from this screen** (scope decision 4).
- **Marking a planned entry "paid" early.** That's the confirm-on-due-date step the parent spec ruled out; nothing here revives it.
- **Editing the budget from the month rows** — Settings › Budget stays the one place a budget is set.
- **Recurring entries.** Still the natural successor, and this screen is where they'd surface when specced.

## Files touched (summary)

| File | Change |
|---|---|
| `app/(tabs)/_layout.tsx` | name-based tab lookup; conditional `plan` tab; `<Tabs.Screen name="plan" />` |
| `app/(tabs)/plan.tsx` | **new** — route + `loading`/`enabled` guard |
| `lib/hooks/use-plan-mode.hook.ts` | expose `loading` |
| `lib/hooks/use-plan-summary.hook.ts` | **new** — all screen derivations |
| `lib/components/plan/plan-screen.component.tsx` | **new** — composition |
| `lib/components/plan/plan-header.component.tsx` | **new** |
| `lib/components/plan/plan-summary.component.tsx` | **new** — hero + spent/planned/projected |
| `lib/components/plan/plan-month-budget.component.tsx` | **new** — per-month projection bars |
| `lib/components/plan/plan-category-breakdown.component.tsx` | **new** |
| `lib/components/plan/plan-entries-list.component.tsx` | **new** — month-grouped list |
| `lib/components/home/upcoming-section.component.tsx` | `+N more` copy points at Plan, not Browse |
| `README.md` | Plan Mode bullet mentions the tab |

No changes to: `lib/utils/*`, `lib/storages/*`, `lib/types/*`, `lib/services/*`, `lib/components/explore/*`, `lib/hooks/use-entries-list.hook.ts`, `lib/hooks/use-monthly-summary.hook.ts`.
