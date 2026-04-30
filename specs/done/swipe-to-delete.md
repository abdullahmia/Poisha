# Feature: Swipe to Delete on Entry Cards

## Status

> **Completed** — 2026-04-30

---

## Overview

Allow the user to swipe an entry card left on the Browse screen to reveal a red delete action. Swiping past the threshold auto-completes the deletion with a collapse animation. Both `react-native-gesture-handler` and `react-native-reanimated` are already installed — no new dependencies needed.

---

## Scope

- Swipe-left gesture on entry cards in the Browse (Entries) screen only
- Reveal a red delete action area on the right
- Auto-complete deletion when swipe exceeds threshold
- Collapse animation when entry is deleted
- Only one card open at a time
- Home screen "Recent entries" cards remain non-swipeable (they open the edit sheet on tap)
- Out of scope: swipe-right actions, swipe on Home screen cards, undo after swipe-delete (covered by the separate Shake to Undo spec)

---

## Packages

No new installation required.

```ts
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
```

---

## Architecture

Create a new `SwipeableEntryCard` wrapper component. The existing `EntryCard` is rendered inside it unchanged. This keeps `EntryCard` reusable on the Home screen without swipe behavior.

**File:** `lib/components/swipeable-entry-card.component.tsx`

---

## Swipe Mechanics

### Constants

```ts
const ACTION_WIDTH = 80;       // px — width of the revealed delete area
const THRESHOLD = ACTION_WIDTH; // px — swipe past this to auto-complete
```

### Shared values

```ts
const translateX = useSharedValue(0); // card horizontal offset
const cardHeight = useSharedValue<number | null>(null); // measured on layout
const isDeleting = useSharedValue(false);
```

### Pan gesture

```ts
const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])      // ignore tiny vertical scrolls
  .failOffsetY([-5, 5])          // yield to scroll view on vertical movement
  .onUpdate((e) => {
    if (isDeleting.value) return;
    translateX.value = Math.min(0, e.translationX); // left-only
  })
  .onEnd((e) => {
    if (isDeleting.value) return;
    if (translateX.value < -THRESHOLD) {
      // auto-complete: slide fully out then delete
      translateX.value = withTiming(-500, { duration: 220 }, () => {
        runOnJS(handleDelete)();
      });
    } else if (translateX.value < -ACTION_WIDTH / 2) {
      // snap open to reveal action
      translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 200 });
    } else {
      // snap closed
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    }
  });
```

### Card animated style

```ts
const cardStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
}));
```

### Delete action area

Positioned absolutely behind the card, right-aligned, width = `ACTION_WIDTH`, full card height.

```
background: #e84040
[Trash icon (white, 20px)]
["Delete" label (white, DMSans_500Medium, 12px)]
centered vertically and horizontally
```

### Collapse animation (after auto-complete swipe)

```ts
function handleDelete() {
  if (!cardHeight.value) { deleteEntry(entry.id); return; }
  // animate height to 0 then call delete
  cardHeight.value = withTiming(0, { duration: 240 }, () => {
    runOnJS(deleteEntry)(entry.id);
  });
}
```

`cardHeight` drives an `Animated.View` wrapper height so the list collapses smoothly without a jump.

---

## One-Card-at-a-Time

Manage an open card ref at the Browse screen level:

```ts
// in explore.tsx
const openCardId = useSharedValue<string | null>(null);
```

Pass `openCardId` as a prop to each `SwipeableEntryCard`. When a new card starts panning, set `openCardId.value = entry.id` and animate any previously open card back to `translateX = 0`.

---

## Tap-to-Close

When a card is open (translateX < 0) and the user taps the card body, snap it closed instead of opening the edit sheet:

```ts
const tap = Gesture.Tap().onEnd(() => {
  if (translateX.value < 0) {
    translateX.value = withSpring(0);
  } else {
    runOnJS(openEdit)(entry);
  }
});
const composed = Gesture.Simultaneous(pan, tap);
```

---

## Browse Screen Integration

**File:** `app/(tabs)/explore.tsx`

Replace `<EntryCard ... />` with `<SwipeableEntryCard ... />` only in the list rendered on the Browse screen. The Home screen (`index.tsx`) continues using `<EntryCard>` directly.

---

## File Checklist

```
lib/
  components/
    swipeable-entry-card.component.tsx   # new wrapper with swipe logic

app/
  (tabs)/
    explore.tsx                          # swap EntryCard → SwipeableEntryCard, add openCardId ref
```

`entry-card.component.tsx` — **no changes**.

---

## Acceptance Criteria

1. Swiping an entry card left on the Browse screen reveals an 80 px red delete area.
2. Releasing below the threshold snaps the card back to closed.
3. Swiping past the threshold (or releasing past it) slides the card off-screen and collapses its height, then calls `deleteEntry`.
4. Only one card can be open at a time; opening a second card closes the first.
5. Tapping a swiped-open card (without swiping further) snaps it closed instead of opening the edit sheet.
6. Entry cards on the Home screen are unaffected and still open the edit sheet on tap.
7. Vertical scrolling in the list is not blocked by the swipe gesture.
8. `npx tsc --noEmit` passes with no errors.
