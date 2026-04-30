# Feature: Haptic Feedback

## Status

> **Not started**

---

## Overview

Add tactile feedback to key interactions throughout the app. `expo-haptics` is already listed in `package.json` — this feature requires zero new dependencies. Haptics make the PIN keypad feel like a real keypad, reinforce success/error states, and bring the tab bar to life without any visual change.

---

## Scope

- PIN keypad digit and backspace taps
- Wrong PIN / PIN mismatch shake
- Lockout triggered
- Entry saved successfully
- Entry deleted
- Tab bar navigation taps
- Add (+) button tap
- Out of scope: scroll momentum, long-press preview, any animation-only interactions

---

## Package

No installation needed. `expo-haptics` is already in `package.json`.

```ts
import * as Haptics from 'expo-haptics';
```

---

## Haptic Map

| Interaction | API call | Notes |
|---|---|---|
| PIN keypad digit tap | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | Every digit 0–9 |
| PIN keypad backspace tap | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | Same as digit |
| Wrong PIN / mismatch | `Haptics.notificationAsync(NotificationFeedbackType.Error)` | Fire at the start of the shake sequence |
| Lockout triggered (5th wrong attempt) | `Haptics.notificationAsync(NotificationFeedbackType.Error)` | Fire once when lockout state activates |
| Entry saved (Log Entry / Save Changes) | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | Fire after `saveEntry()` resolves |
| Entry deleted | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` | Fire after `deleteEntry()` resolves |
| Tab bar tab switch | `Haptics.selectionAsync()` | Fire on the `onPress` of each tab button |
| Add (+) FAB tap | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | Fire on `onPress` before sheet opens |

---

## Implementation Details

### `lib/components/pin-input.component.tsx`

Call `Haptics.impactAsync(ImpactFeedbackStyle.Light)` inside the keypad digit handler before appending to the current PIN value. Call the same for backspace. No state change required.

```ts
const handleKey = (key: string) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // existing logic...
};
```

### `lib/components/lock-screen.component.tsx`

In the wrong-PIN branch (before `triggerShake()`):

```ts
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
triggerShake();
```

When `attempts >= MAX_ATTEMPTS` and lockout is set:

```ts
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
// existing lockout logic
```

### `lib/components/pin-onboarding.component.tsx` & `lib/components/pin-setup-sheet.component.tsx`

Same pattern as lock screen — error haptic + shake on PIN mismatch in the confirm step.

### `lib/components/add-entry-sheet.component.tsx`

After `await saveEntry(draft)` resolves successfully:

```ts
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
closeSheet();
```

After `await deleteEntry(sheetEntry.id)` resolves:

```ts
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
closeSheet();
```

### `app/(tabs)/_layout.tsx`

Inside the tab `onPress` handler (the custom tab bar):

```ts
Haptics.selectionAsync();
// existing navigation logic
```

Inside the Add (+) button `onPress`:

```ts
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
openAdd();
```

---

## File Checklist

```
lib/
  components/
    pin-input.component.tsx          # digit + backspace taps
    lock-screen.component.tsx        # wrong PIN, lockout
    pin-onboarding.component.tsx     # PIN mismatch in confirm step
    pin-setup-sheet.component.tsx    # PIN mismatch in change/enable flow
    add-entry-sheet.component.tsx    # save success, delete warning

app/
  (tabs)/
    _layout.tsx                      # tab switch, add button
```

No new files required.

---

## Acceptance Criteria

1. Every PIN keypad key press produces a light impact haptic.
2. Entering a wrong PIN fires an error notification haptic at the same moment the dots begin to shake.
3. The 5th wrong attempt fires an error haptic and then the keypad locks.
4. Saving a new or edited entry fires a success haptic before the sheet closes.
5. Deleting an entry fires a warning haptic before the sheet closes.
6. Switching tabs fires a selection haptic.
7. Tapping the Add (+) button fires a medium impact haptic.
8. No haptic is fired on interactions not listed in the Haptic Map above.
9. `npx tsc --noEmit` passes with no errors.
