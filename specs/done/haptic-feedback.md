# Feature: Haptic Feedback

## Status

> **Completed**

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

## Storage

| Key | Value | Notes |
|---|---|---|
| `poisha_haptics_enabled` | `'1'` or `'0'` | Absent = defaults to `'1'` (enabled) |

---

## Hook

**File:** `lib/hooks/use-haptics.hook.ts`

Centralise the preference load/save and wrap every `Haptics.*` call so that nothing fires when haptics are disabled. All components import this hook instead of calling `expo-haptics` directly.

```ts
interface UseHapticsReturn {
  hapticsEnabled: boolean;
  setHapticsEnabled: (value: boolean) => Promise<void>;
  impact: (style?: Haptics.ImpactFeedbackStyle) => void;
  notification: (type: Haptics.NotificationFeedbackType) => void;
  selection: () => void;
}

export function useHaptics(): UseHapticsReturn;
```

**Behaviour:**
- On mount: read `poisha_haptics_enabled` from AsyncStorage; default to `true` when key is absent.
- `setHapticsEnabled(false)`: writes `'0'` to AsyncStorage, updates in-memory state.
- `impact / notification / selection`: no-op when `hapticsEnabled === false`; otherwise delegates to the matching `expo-haptics` call.

```ts
const impact = (style = Haptics.ImpactFeedbackStyle.Light) => {
  if (!hapticsEnabled) return;
  Haptics.impactAsync(style);
};
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

## Settings Integration

**File:** `app/(tabs)/settings.tsx`

Add a **Haptics** row inside the existing **Appearance** section (below the theme toggle, since it is a UI feel preference):

```
Section: Appearance
  Row: Theme          (existing)
  Row: Haptic Feedback
    Left:   "Haptic Feedback"
    Right:  Toggle Switch  (on by default)
```

### Toggle behaviour

```ts
const { hapticsEnabled, setHapticsEnabled } = useHaptics();

<Switch
  value={hapticsEnabled}
  onValueChange={(v) => setHapticsEnabled(v)}
  trackColor={{ true: colors.accent, false: colors.line }}
  thumbColor={colors.surface}
/>
```

When the user turns haptics **off**, fire one final `notification(Success)` haptic as tactile confirmation before the preference is saved — then all subsequent interactions are silent.

---

## Implementation Details

### `lib/components/pin-input.component.tsx`

Replace direct `Haptics` import with `useHaptics()`:

```ts
const { impact } = useHaptics();

const handleKey = (key: string) => {
  impact(Haptics.ImpactFeedbackStyle.Light);
  // existing logic...
};
```

### `lib/components/lock-screen.component.tsx`

```ts
const { notification } = useHaptics();

// wrong PIN:
notification(Haptics.NotificationFeedbackType.Error);
triggerShake();

// lockout triggered:
notification(Haptics.NotificationFeedbackType.Error);
```

### `lib/components/pin-onboarding.component.tsx` & `lib/components/pin-setup-sheet.component.tsx`

Same pattern as lock screen — `notification(Error)` + shake on PIN mismatch in the confirm step.

### `lib/components/add-entry-sheet.component.tsx`

```ts
const { notification } = useHaptics();

// after saveEntry resolves:
notification(Haptics.NotificationFeedbackType.Success);
closeSheet();

// after deleteEntry resolves:
notification(Haptics.NotificationFeedbackType.Warning);
closeSheet();
```

### `app/(tabs)/_layout.tsx`

```ts
const { impact, selection } = useHaptics();

// tab switch:
selection();

// Add (+) button:
impact(Haptics.ImpactFeedbackStyle.Medium);
openAdd();
```

---

## File Checklist

```
lib/
  hooks/
    use-haptics.hook.ts              # new — preference load/save + guarded wrappers
  components/
    pin-input.component.tsx          # swap Haptics.* → useHaptics()
    lock-screen.component.tsx        # swap Haptics.* → useHaptics()
    pin-onboarding.component.tsx     # swap Haptics.* → useHaptics()
    pin-setup-sheet.component.tsx    # swap Haptics.* → useHaptics()
    add-entry-sheet.component.tsx    # swap Haptics.* → useHaptics()

app/
  (tabs)/
    _layout.tsx                      # swap Haptics.* → useHaptics()
    settings.tsx                     # new Haptic Feedback toggle row
```

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
9. Settings > Appearance shows a "Haptic Feedback" toggle; it defaults to on.
10. Turning the toggle off silences all haptics app-wide immediately; the preference persists across restarts.
11. Turning the toggle back on re-enables all haptics immediately.
12. Toggling haptics off fires one final success haptic as confirmation before going silent.
13. `npx tsc --noEmit` passes with no errors.
