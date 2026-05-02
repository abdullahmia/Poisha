# Feature: Keyboard Avoiding on Entry Sheet

## Status

> **Completed**

---

## Overview

When the add / edit entry sheet opens and the user taps a text input (amount or note), the software keyboard slides up and covers the focused field. The sheet does not scroll or shift to keep the input visible.

A `KeyboardAvoidingView` is already imported in `add-entry-sheet.component.tsx` but it is nested inside the `Animated.View` that slides up from the bottom, so it has no effect in practice. The fix uses `react-native-keyboard-controller`'s `KeyboardAvoidingView` (a reliable cross-platform drop-in) and restructures the modal layout so it wraps at the correct level.

---

## Scope

- Amount `TextInput` fields in `SheetContent` stay visible when the keyboard is open.
- Note `TextInput` stays visible when focused.
- Works on both iOS and Android.
- The backdrop tap-to-dismiss still works after the fix.
- The slide-up animation is unaffected.
- Uses `react-native-keyboard-controller` (`react-native-keyboard-controller@1.18.5`).

Out of scope: PIN screen inputs, search inputs, any screen outside the add/edit sheet.

---

## Root Cause

The current structure is:

```
Modal (transparent)
  View (modalRoot — flex:1, justifyContent:'flex-end')
    Animated.View (backdrop, absoluteFill)
    Animated.View (sheet, translateY animation)
      SheetContent
        KeyboardAvoidingView   ← too deep, sees no usable space above it
          ScrollView
```

`KeyboardAvoidingView` needs to own the full-height container so it can shrink/pad itself when the keyboard appears. Nested inside the already-positioned sheet `Animated.View`, it has no room to move.

---

## Fix

### 1. Install `react-native-keyboard-controller`

```bash
npx expo install react-native-keyboard-controller
```

The library requires `react-native-reanimated` (already present) and manages Android's `windowSoftInputMode` internally — no `app.json` changes needed.

### 2. `app/_layout.tsx` — add `KeyboardProvider`

Wrap the provider tree with `KeyboardProvider` (inside `SafeAreaProvider`):

```tsx
import { KeyboardProvider } from 'react-native-keyboard-controller';

<SafeAreaProvider>
  <KeyboardProvider>
    <ThemeProvider>
      ...
    </ThemeProvider>
  </KeyboardProvider>
</SafeAreaProvider>
```

### 3. `lib/components/add-entry-sheet.component.tsx` — restructure `AddEntrySheet`

Import `KeyboardAvoidingView` from the library (not `react-native`) and move it to wrap the entire `Modal` content. Use `behavior="padding"` for both platforms — the library handles cross-platform differences internally.

```tsx
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

<Modal visible transparent animationType="none" onRequestClose={handleClose}>
  <KeyboardAvoidingView style={styles.modalRoot} behavior="padding">
    <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
    </Animated.View>
    <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
      <SheetContent onClose={handleClose} />
    </Animated.View>
  </KeyboardAvoidingView>
</Modal>
```

### 4. `SheetContent` — replace `KeyboardAvoidingView` root with `View`

Avoidance is now handled one level up; demote `SheetContent`'s root to a plain `View`.

```tsx
return (
  <View style={styles.sheetInner}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* content unchanged */}
    </ScrollView>
    {/* date picker Modal unchanged */}
  </View>
);
```

---

## Styles

No style changes needed. `modalRoot` already has `flex: 1` and `justifyContent: 'flex-end'`, which is exactly what `KeyboardAvoidingView` requires as its container style.

---

## File Checklist

```
package.json
  react-native-keyboard-controller@1.18.5         # new dependency

app/_layout.tsx
  KeyboardProvider                                # wraps SafeAreaProvider children

lib/components/
  add-entry-sheet.component.tsx
    KeyboardAvoidingView import → react-native-keyboard-controller
    AddEntrySheet   — wraps Modal content with KeyboardAvoidingView behavior="padding"
    SheetContent    — root demoted from KeyboardAvoidingView to plain View
```

---

## Acceptance Criteria

1. On iOS: tapping the first amount input when the sheet opens scrolls/pads the sheet so the input sits above the keyboard.
2. On iOS: tapping the note input when the keyboard is already open keeps the note field visible.
3. On Android: same behaviour as iOS items 1–2.
4. Tapping the backdrop while the keyboard is open dismisses the sheet (keyboard closes first, then sheet animates away).
5. `keyboardShouldPersistTaps="handled"` remains on the `ScrollView` so tapping the "Add another amount" button while the keyboard is open works without first dismissing the keyboard.
6. The slide-up spring animation plays identically before and after this change.
7. `npx tsc --noEmit` passes with no errors.
