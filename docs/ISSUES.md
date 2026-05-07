# Open Issues

---

## BUG-001 — Monthly target not reflecting on home page after update

**Status:** Open  
**Severity:** High  
**Affected screen:** Home (`app/(tabs)/index.tsx`)

### Description

When the user sets or updates the monthly target in Settings, the home page `BudgetBar` does not reflect the new value until the app is restarted or the screen is fully remounted.

### Root cause

`useBudget()` (`lib/hooks/use-budget.hook.ts`) is a plain React hook — each call site creates its own independent state. Settings and Home each hold a separate instance. When Settings calls `setBudget()`, it updates AsyncStorage **and** its own local state (line 34), but the Home instance has no way to observe that change. Home only reads AsyncStorage once on mount (line 19–26 `useEffect([], [])`), so it stays stale until remounted.

```
settings.tsx   →  useBudget() instance A  ← saves to AsyncStorage + updates A's state
index.tsx      →  useBudget() instance B  ← only reads AsyncStorage on mount, never notified
```

### Steps to reproduce

1. Open the app on the Home tab.
2. Navigate to Settings and set or change the monthly target.
3. Navigate back to Home.
4. The `BudgetBar` still shows the old value (or is missing if newly set).

### Expected behaviour

The home page reflects the updated target immediately after returning from Settings.

### Fix direction

Lift budget state into a shared context (same pattern as `EntriesCtx`) so a single source of truth is shared across all consumers, or use an `AppState`/focus listener in the Home hook instance to re-read AsyncStorage on screen focus.

---

## BUG-002 — Date picker reopens immediately after being closed

**Status:** Open  
**Severity:** Medium  
**Affected screen:** Add / Edit entry sheet (`lib/components/add-entry-sheet.component.tsx`)

### Description

In the new/edit entry sheet, tapping the "Done" button or the backdrop to dismiss the date picker causes it to close and then instantly reopen.

### Root cause

The date picker is rendered inside a transparent `Modal` (line 412). When the user taps **Done** (line 424), `setPickerVisible(false)` is called and the Modal dismisses. However, because the modal is transparent and uses `animationType="fade"`, the touch event that triggered "Done" is not fully consumed before the modal unmounts. The residual touch event propagates to the `Pressable` date field underneath (line 334), which calls `setPickerVisible(true)` — reopening the picker.

```
User taps "Done"
  → setPickerVisible(false)   ← modal starts to dismiss
  → modal fade-out begins
  → touch event falls through to date-field Pressable beneath
  → setPickerVisible(true)    ← picker reopens
```

### Steps to reproduce

1. Open the Add entry sheet.
2. Tap the date field to open the date picker.
3. Tap "Done" (or tap the backdrop).
4. The picker closes for a frame and immediately reopens.

### Expected behaviour

Tapping "Done" or the backdrop dismisses the picker and keeps it closed.

### Fix direction

- Add a short `disabled` guard: set a boolean ref (`closingRef`) to `true` when closing begins, and ignore the `Pressable` `onPress` on the date field while it is true.
- Alternatively, replace the transparent `Modal` + `Pressable` pattern with a non-modal inline picker or a `BottomSheet`-style container that does not have the touch bleed-through problem.
- On iOS specifically, wrapping the "Done" press handler with `InteractionManager.runAfterInteractions` before the state update can also prevent the residual touch from reaching the view below.
