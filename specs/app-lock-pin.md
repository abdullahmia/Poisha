# Feature: App Lock with PIN

## Overview

Users can protect the app with a 4-digit PIN. On the very first launch, an **onboarding flow** walks the user through setting a PIN before they see any data. On every subsequent launch (or when returning from background), a **lock screen** gate requires the correct PIN. The feature can be toggled off or the PIN changed from the Settings screen.

---

## Scope

- Onboarding PIN-setup flow shown once on first launch
- Lock screen shown on every cold launch and foreground-resume when lock is enabled
- Settings > Security section to enable/disable lock and change PIN
- PIN stored securely via `expo-secure-store`
- Wrong-PIN feedback with a brief shake animation and attempt counter
- No biometrics in this iteration (can be layered on later)

---

## Package

```bash
npx expo install expo-secure-store
```

`expo-secure-store` encrypts values using the device keychain (iOS) / Keystore (Android). Do not use AsyncStorage for PIN storage.

---

## Storage Keys

| Key | Value |
|---|---|
| `ledger_pin` | 4-digit PIN string, or absent if lock is disabled |
| `ledger_pin_enabled` | `'1'` when lock is active, absent or `'0'` otherwise |
| `ledger_pin_onboarded` | `'1'` after the user has completed the onboarding PIN setup |

All reads/writes go through `lib/data/pin.data.ts` (see below) — nothing else touches SecureStore directly.

---

## Data Module

**File:** `lib/data/pin.data.ts`

```ts
export async function getPin(): Promise<string | null>;
// SecureStore.getItemAsync('ledger_pin')

export async function setPin(pin: string): Promise<void>;
// SecureStore.setItemAsync('ledger_pin', pin)

export async function deletePin(): Promise<void>;
// SecureStore.deleteItemAsync('ledger_pin')

export async function isLockEnabled(): Promise<boolean>;
// SecureStore.getItemAsync('ledger_pin_enabled') === '1'

export async function setLockEnabled(enabled: boolean): Promise<void>;
// SecureStore.setItemAsync('ledger_pin_enabled', enabled ? '1' : '0')

export async function hasOnboarded(): Promise<boolean>;
// SecureStore.getItemAsync('ledger_pin_onboarded') === '1'

export async function markOnboarded(): Promise<void>;
// SecureStore.setItemAsync('ledger_pin_onboarded', '1')
```

---

## LockContext

**File:** `lib/context/lock.context.tsx`

```ts
export interface LockCtxValue {
  lockEnabled: boolean;
  isLocked: boolean;           // true when the lock screen gate is active
  pinOnboarded: boolean;       // false on first ever launch
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>; // returns false on wrong PIN
  showOnboarding: boolean;     // true when pinOnboarded is false
}
```

### Boot sequence (inside `LockProvider`)

1. Read `hasOnboarded()`, `isLockEnabled()` from SecureStore in a single `useEffect` on mount.
2. If `!hasOnboarded` → set `showOnboarding = true`, `isLocked = false` (lock screen is not shown during setup).
3. If `hasOnboarded && lockEnabled` → set `isLocked = true`.
4. If `hasOnboarded && !lockEnabled` → `isLocked = false`, app opens normally.

### App background / foreground

Listen to `AppState` change events. When the app transitions from `active` → `background`/`inactive` and `lockEnabled` is true, set `isLocked = true` so re-entering foreground triggers the lock screen.

### Wire up in `app/_layout.tsx`

Wrap the tree with `<LockProvider>` **outside** `<ThemeProvider>` and `<EntriesProvider>`. Render either the onboarding flow or the lock screen gate before the tab navigator based on context flags.

Expose a `useLock()` hook in `lib/hooks/use-lock.hook.ts`.

---

## Onboarding Flow

Shown when `showOnboarding === true`. Renders **instead of** the tab navigator (full-screen takeover via a conditional in `app/_layout.tsx`).

### Screens (two-step wizard, no navigation stack needed — local state in one component)

**File:** `lib/components/pin-onboarding.component.tsx`

```
Step 1 — Welcome
  Heading:  "Secure your ledger"
  Body:     "Set a 4-digit PIN to keep your data private."
  CTA:      "Set PIN"  → advance to step 2

Step 2 — Create PIN
  Heading:  "Choose a PIN"
  PIN input (4 dots)
  Numeric keypad (see PIN Input below)
  Auto-advances to step 3 when 4 digits entered

Step 3 — Confirm PIN
  Heading:  "Confirm your PIN"
  PIN input (4 dots)
  Numeric keypad
  On 4th digit:
    - If match → call enableLock(pin) + markOnboarded() → showOnboarding becomes false → app opens
    - If mismatch → shake animation on dots + "PINs don't match" error, reset both steps to step 2
```

---

## Lock Screen

Shown when `isLocked === true` and `showOnboarding === false`. Full-screen overlay rendered in `app/_layout.tsx` above the tab navigator.

**File:** `lib/components/lock-screen.component.tsx`

```
App wordmark / logo (small, top-center)
Heading: "Enter PIN"
PIN input (4 dots)
Numeric keypad
Wrong PIN: shake dots + increment attempt counter
  - After 5 wrong attempts: show "Too many attempts. Try again in 30 seconds."
    Lock the keypad for 30 seconds (countdown label), then re-enable.
Correct PIN: call unlock(pin) → isLocked becomes false → navigator shows
```

---

## PIN Input Component

**File:** `lib/components/pin-input.component.tsx`

Reused by both the onboarding flow and the lock screen.

### Visual design

- 4 circular dots (20 × 20 px), spaced 16px apart, centered horizontally.
- Empty dot: `line` color border, transparent fill.
- Filled dot: `ink` color fill.
- Shake: `react-native-reanimated` `useSharedValue` → `withSequence` of small horizontal offsets (±8px, 3 cycles, 60ms each).

### Numeric keypad

- 3 × 4 grid: digits 1–9, then `[ ]` `[0]` `[⌫]`.
- Each key: 72 × 72 px, `surface` background, `ink` text, `DMSans_500Medium`, 24px font size, `borderRadius: 36` (circular).
- Active press: `surfaceAlt` background (use `Pressable` with `onPressIn`/`onPressOut`).
- Bottom-left key is empty (reserved for future biometric icon).
- Backspace key uses the `Delete02Icon` from `@hugeicons/core-free-icons`.

---

## Settings Integration

Inside `app/(tabs)/settings.tsx`, add a **Security** section below Appearance.

```
Section: Security
  Row: App Lock
    Label:    "App Lock"
    Sub-label: "On" | "Off"
    Right:    Toggle Switch

  Row: Change PIN          ← only visible when lockEnabled === true
    Label:    "Change PIN"
    Right:    chevron icon (navigates to change-PIN sheet)
```

### Enabling lock from Settings

When the user toggles App Lock **on** (and `lockEnabled` was false):
1. Open a bottom sheet (`pin-setup-sheet.component.tsx`) that runs the same 2-step Create → Confirm flow as the onboarding wizard (minus the welcome step).
2. On success: call `enableLock(pin)`.
3. On dismiss without completing: leave toggle off.

### Disabling lock from Settings

When the user toggles App Lock **off**:
1. Show an inline confirmation prompt (no sheet needed): "Disable lock? You'll need your PIN." with "Disable" / "Cancel".
2. On confirm: open a mini lock screen inline (just the 4-dot input + keypad, no full-screen takeover) to verify the current PIN, then call `disableLock()`.

### Changing PIN

Tapping the Change PIN row opens `pin-setup-sheet.component.tsx` in a 3-step flow: Verify current PIN → Create new PIN → Confirm new PIN. On success: call `changePin(newPin)`.

**File:** `lib/components/pin-setup-sheet.component.tsx`

---

## File Checklist

```
lib/
  data/
    pin.data.ts                      # SecureStore helpers
  context/
    lock.context.tsx                 # LockProvider + LockCtx
  hooks/
    use-lock.hook.ts                 # useLock() consumer
  components/
    pin-input.component.tsx          # 4-dot display + numeric keypad
    pin-onboarding.component.tsx     # First-launch wizard
    lock-screen.component.tsx        # Gate shown on launch/resume
    pin-setup-sheet.component.tsx    # Reusable sheet for enable/change PIN flows
```

---

## Acceptance Criteria

1. Fresh install: onboarding wizard appears before any entry data is visible.
2. Completing the wizard persists the PIN and opens the app normally.
3. Cold launch with lock enabled: lock screen appears; correct PIN dismisses it.
4. Backgrounding and re-foregrounding the app re-triggers the lock screen.
5. Five consecutive wrong PINs trigger a 30-second lockout with a countdown.
6. Settings > App Lock toggle correctly enables and disables the lock (requires PIN verification to disable).
7. Change PIN flow requires the current PIN before accepting a new one.
8. Disabling lock deletes the PIN from SecureStore (`ledger_pin` key absent after).
9. `npx tsc --noEmit` passes with no errors.
