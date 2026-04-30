# Feature: Monthly Budget Indicator

## Status

> **Not started**

---

## Overview

Let the user set an optional monthly spending budget in Settings. When a budget is set, the Home screen displays a horizontal progress bar below the hero total showing how much of the budget has been spent. The indicator turns red when spend exceeds the budget. No categories — just one global number per month.

---

## Scope

- Settings row to set/clear a monthly budget (numeric input, optional)
- Progress bar on the Home screen showing `spent / budget`
- Color change at 100% threshold
- One-time in-app alert when the monthly budget is first exceeded
- Budget persisted in AsyncStorage
- Budget is compared against the **currently viewed month** on the Home screen, not just the current calendar month
- Out of scope: per-category budgets, push notifications, budget history

---

## Package

No new packages required. Uses `@react-native-async-storage/async-storage` which is already installed.

---

## Storage

| Key | Value | Notes |
|---|---|---|
| `poisha_monthly_budget` | Numeric string e.g. `"5000"` | Absent or empty string = no budget set |
| `poisha_budget_exceeded_month` | `"YYYY-MM"` | Tracks which month the exceeded-alert was last shown, to avoid repeat alerts |

All reads/writes go through `lib/hooks/use-budget.hook.ts`.

---

## Hook

**File:** `lib/hooks/use-budget.hook.ts`

```ts
interface UseBudgetReturn {
  budget: number | null;          // null when not set
  setBudget: (value: number | null) => Promise<void>;
  getProgress: (spent: number) => {
    percent: number;              // 0–100+ (can exceed 100)
    exceeded: boolean;
    isSet: boolean;
  };
}

export function useBudget(): UseBudgetReturn;
```

**Behaviour:**
- On mount: read `poisha_monthly_budget` from AsyncStorage; parse as float; set to `null` if absent or NaN.
- `setBudget(null)`: deletes the AsyncStorage key.
- `setBudget(n)`: writes `String(n)` to the key.
- `getProgress(spent)`: returns `{ percent: (spent / budget) * 100, exceeded: spent > budget, isSet: budget !== null }`.

---

## Home Screen Integration

**File:** `app/(tabs)/index.tsx`

### Layout change

Below the existing hero total block, conditionally render a `<BudgetBar>` inline component when `budget !== null`.

```
[ Hero total: ৳ 12,400 ]
[ ██████████░░░░░░░░░  62%  of ৳ 20,000 ]   ← new
[ Stats row ]
[ Bar chart ]
[ Recent entries ]
```

### BudgetBar (inline component within `index.tsx`)

```tsx
// Props
interface BudgetBarProps {
  spent: number;
  budget: number;
  colors: typeof ledger; // theme colors
}
```

**Visual spec:**
- Container: full-width, height 6 px track, `theme.line` background, `borderRadius: 3`
- Fill: height 6 px, `borderRadius: 3`, animated width using `react-native-reanimated` `withTiming` (400 ms, ease-out) when the viewed month changes
- Fill color: `theme.accent` when `percent ≤ 100`; `#e84040` when `percent > 100`
- Label row below track: left-aligned `"৳{fmtFull(spent)} spent"` in `inkMuted`, right-aligned `"{percent}% of ৳{fmtFull(budget)}"` in `inkMuted`; both `DMSans_400Regular` 11 px
- When `percent > 100`: label text switches to `#e84040`
- Fill clamps to 100% width visually (bar never overflows the track)

### Exceeded alert

When `percent > 100` and the stored `poisha_budget_exceeded_month` is not the currently viewed month:

```ts
Alert.alert(
  'Budget reached',
  `You've spent ৳${fmtFull(spent)} this month, exceeding your ৳${fmtFull(budget)} budget.`,
  [{ text: 'OK' }]
);
await AsyncStorage.setItem('poisha_budget_exceeded_month', currentMonth); // e.g. '2025-04'
```

This fires at most once per month per viewed month.

### Entrance animation

`BudgetBar` is added as the 6th item in the existing staggered animation sequence in `index.tsx`. Use the same fade + slide-up pattern with a 70 ms stagger offset after the hero section.

---

## Settings Integration

**File:** `app/(tabs)/settings.tsx`

Add a new **Budget** section (between Appearance and Data, or below Data — consistent with current section order):

```
Section: Budget
  Row: Monthly Budget
    Left:   "Monthly Budget"
    Right:  current value (e.g. "৳ 5,000") or "Not set" in inkMuted
    Press:  opens BudgetInputSheet
```

### BudgetInputSheet (inline bottom sheet within `settings.tsx`)

Reuse the existing animated sheet pattern (`useSharedValue` + `withSpring` slide-up, same as `AddEntrySheet`).

**Content:**
- Heading: "Monthly Budget"
- Subtext: "Leave empty to disable the budget indicator."
- Single numeric `TextInput`, `keyboardType="numeric"`, pre-filled with current budget value
- "Save" button: validates input is a positive number, calls `setBudget(parsed)`, closes sheet
- "Remove Budget" button (only when a budget is already set): calls `setBudget(null)`, closes sheet
- "Cancel" link: closes sheet without saving

---

## File Checklist

```
lib/
  hooks/
    use-budget.hook.ts             # load/save/compute budget logic

app/
  (tabs)/
    index.tsx                      # BudgetBar inline component + integration
    settings.tsx                   # Budget section + BudgetInputSheet
```

No new top-level files required.

---

## Acceptance Criteria

1. Settings > Budget row shows "Not set" when no budget has been saved.
2. Entering a budget and saving shows the formatted value in the Settings row.
3. Home screen shows the progress bar only when a budget is set.
4. Progress bar fill animates from the previous value when the viewed month changes.
5. Fill color is `theme.accent` at 0–100% and red at > 100%.
6. An alert fires the first time spend exceeds the budget for a given month; it does not repeat on re-opens or month navigation.
7. Setting budget to empty/null hides the progress bar on the Home screen.
8. Budget comparison uses the same `spent` total already computed for the hero section — no duplicate calculation.
9. `npx tsc --noEmit` passes with no errors.
