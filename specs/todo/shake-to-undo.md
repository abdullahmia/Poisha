# Feature: Shake to Undo Last Entry

## Status

> **Not started**

---

## Overview

After saving or editing an entry, the user can shake the device to trigger a bottom toast offering to undo the last save. Tapping "Undo" deletes the entry. The toast auto-dismisses after 5 seconds. The accelerometer subscription is only active while a "last saved" entry exists in memory, so there is no background battery drain.

---

## Scope

- Accelerometer-based shake detection via `expo-sensors`
- Bottom toast shown after a successful save (new entry or edit)
- "Undo" deletes the last saved entry; "Dismiss" closes the toast
- Toast auto-dismisses after 5 seconds
- `lastSaved` reference cleared on: undo, dismiss, app backgrounded, or any subsequent save
- Toast rendered at root layout level (above all tabs and modals)
- Out of scope: multi-level undo, undo for deletions, shake detection while the entry sheet is open

---

## Package

```bash
npx expo install expo-sensors
```

| Package | Purpose |
|---|---|
| `expo-sensors` | Accelerometer access for shake detection |

---

## Shake Detection Hook

**File:** `lib/hooks/use-shake.hook.ts`

```ts
interface UseShakeOptions {
  threshold?: number;   // g-force magnitude, default 1.8
  consecutiveSamples?: number; // samples above threshold, default 3
  intervalMs?: number;  // polling interval, default 100
  onShake: () => void;
  enabled: boolean;     // subscription only active when true
}

export function useShake(options: UseShakeOptions): void;
```

**Implementation:**

```ts
import { Accelerometer } from 'expo-sensors';

export function useShake({ threshold = 1.8, consecutiveSamples = 3, intervalMs = 100, onShake, enabled }: UseShakeOptions) {
  const count = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    Accelerometer.setUpdateInterval(intervalMs);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude > threshold) {
        count.current += 1;
        if (count.current >= consecutiveSamples) {
          count.current = 0;
          onShake();
        }
      } else {
        count.current = 0;
      }
    });
    return () => sub.remove();
  }, [enabled]);
}
```

The subscription is removed when `enabled` becomes `false` (no `lastSaved` in context), so the accelerometer is never running in the background unnecessarily.

---

## EntriesContext Changes

**File:** `lib/context/entries.context.tsx`

Add to the context value:

```ts
lastSaved: Entry | null;
clearLastSaved: () => void;
```

**Behaviour:**
- After `saveEntry(draft)` resolves successfully: set `lastSaved` to the saved entry.
- On `deleteEntry`: set `lastSaved = null` (including after undo).
- On `importEntries`: set `lastSaved = null`.
- `clearLastSaved()`: sets `lastSaved = null` (called by the toast on dismiss/timeout/background).

The `lastSaved` value is **in-memory only** — not persisted to AsyncStorage or SQLite.

---

## Undo Toast Component

**File:** `lib/components/undo-toast.component.tsx`

### Visual spec

```
[ ↩  Undo last entry?      [Undo]  [×] ]
```

- Container: `theme.ink` background, `borderRadius: 14`, horizontal padding 16, vertical padding 12
- Width: screen width − 32 px horizontal margin
- Positioned: fixed at the bottom of the screen, 16 px above the tab bar (i.e. `bottom: 110 + insets.bottom + 16`)
- Left icon: `UndoIcon` from `@hugeicons/core-free-icons`, 18 px, white
- Label: `"Undo last entry?"`, `DMSans_400Regular`, 14 px, white, flex 1
- "Undo" button: `DMSans_600SemiBold`, 14 px, `theme.accent` color
- "×" button: `Cancel01Icon`, 18 px, `theme.inkMuted` tint

### Entrance / exit animation

- Slide up from `translateY: +80` → `0` with `withSpring({ damping: 22, stiffness: 220 })` on mount
- Slide down `translateY: 0` → `+80` with `withTiming(300ms)` before unmount (use a `hiding` state flag to trigger exit animation before removing from tree)

### Auto-dismiss timer

```ts
useEffect(() => {
  const t = setTimeout(() => handleDismiss(), 5000);
  return () => clearTimeout(t);
}, []);
```

The timer resets if a new `lastSaved` is set (i.e. a second save re-shows the toast with a fresh 5-second window).

### Props

```ts
interface UndoToastProps {
  entry: Entry;
  onUndo: () => void;
  onDismiss: () => void;
}
```

---

## Root Layout Integration

**File:** `app/_layout.tsx`

```tsx
const { lastSaved, clearLastSaved, deleteEntry } = useEntries();

const handleUndo = () => {
  deleteEntry(lastSaved!.id);
  clearLastSaved();
};

// Render above tab navigator, below AddEntrySheet
{lastSaved && (
  <UndoToast
    entry={lastSaved}
    onUndo={handleUndo}
    onDismiss={clearLastSaved}
  />
)}
```

**App background handling:** In the existing `AppState` listener in `LockProvider` (or add one in `_layout.tsx`), call `clearLastSaved()` when the app goes to background so the toast doesn't re-appear on foreground.

---

## Integration with Haptic Feedback

When the shake is recognized (inside `onShake` callback), fire:

```ts
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
```

This ties into the Haptic Feedback spec. If haptics are not yet implemented, skip this line — it is not a dependency.

---

## File Checklist

```
lib/
  hooks/
    use-shake.hook.ts                  # new — accelerometer shake detection
  components/
    undo-toast.component.tsx           # new — bottom toast UI + animation
  context/
    entries.context.tsx                # add lastSaved, clearLastSaved

app/
  _layout.tsx                          # render UndoToast, wire onUndo/onDismiss
```

---

## Acceptance Criteria

1. After saving a new entry, shaking the device shows the undo toast.
2. After editing an existing entry, shaking the device shows the undo toast.
3. Tapping "Undo" deletes the saved entry and dismisses the toast; the entries list updates immediately.
4. Tapping "×" dismisses the toast without deleting the entry.
5. The toast auto-dismisses after 5 seconds with no action.
6. Making a second save while the toast is visible resets the toast to show the newest entry and restarts the 5-second timer.
7. Shake detection does not trigger while the entry sheet is open.
8. Backgrounding the app clears `lastSaved` — the toast does not reappear on foreground.
9. No accelerometer subscription is active when there is no `lastSaved` entry.
10. `npx tsc --noEmit` passes with no errors.
