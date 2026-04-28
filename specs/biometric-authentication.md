# Feature: Biometric Authentication

## Overview

Layer biometric unlock on top of the existing PIN lock (spec: `app-lock-pin.md`). PIN remains mandatory — biometrics are **optional and supplemental**. After the PIN onboarding wizard completes, the user is offered a prompt to enable biometrics. On the lock screen, if biometrics are enabled, authentication triggers automatically on arrival; the user can always fall back to PIN.

Platform behaviour:
- **iOS** — Face ID (or Touch ID on older devices); determined at runtime via `LocalAuthentication`.
- **Android** — Fingerprint (or device biometric as available); same API.

---

## Scope

- Post-PIN onboarding step: "Enable Face ID / Fingerprint?" prompt
- Automatic biometric prompt on lock screen when enabled
- PIN fallback always available from the lock screen
- Settings > Security rows for enabling, disabling, and re-enrolling biometrics
- Runtime detection of biometric type for correct labelling and icon
- No changes to the PIN storage model; biometric preference is a separate flag

---

## Package

```bash
npx expo install expo-local-authentication
```

`expo-local-authentication` wraps `LocalAuthentication` (iOS) and `BiometricPrompt` (Android). No additional native setup required for Expo managed workflow.

---

## Storage Keys (additions to `pin.data.ts`)

| Key | Value |
|---|---|
| `ledger_biometric_enabled` | `'1'` when biometric unlock is active, absent or `'0'` otherwise |

One new SecureStore key. The enrolled biometric credential itself lives in the OS — the app only stores the user's preference.

---

## Types

**File:** `lib/types/biometric.type.ts`

```ts
export type BiometricType = 'faceId' | 'fingerprint' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string; // OS-level error code/message on failure
}
```

All files that reference `BiometricType` import from here — never re-declare it locally.

---

## Biometric Service

**File:** `lib/services/biometric.service.ts`

Implemented as a class; a single instance is exported for use throughout the app. Centralises all `expo-local-authentication` calls and SecureStore preference reads/writes.

```ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { BiometricType, BiometricAuthResult } from '@/lib/types/biometric.type';

class BiometricService {
  /**
   * Detects what biometric capability the device supports and has enrolled.
   * Returns 'none' when hardware is absent or no credential is enrolled.
   * Call once at app boot; cache the result in LockContext.
   */
  async getSupportedType(): Promise<BiometricType> {
    // 1. LocalAuthentication.hasHardwareAsync()        — false → 'none'
    // 2. LocalAuthentication.isEnrolledAsync()         — false → 'none'
    // 3. LocalAuthentication.supportedAuthenticationTypesAsync()
    //    AuthenticationType.FACIAL_RECOGNITION → 'faceId'
    //    AuthenticationType.FINGERPRINT        → 'fingerprint'
    //    fallback                              → 'none'
  }

  /**
   * Triggers the OS biometric prompt.
   * promptMessage is shown inside the system dialog (required on Android).
   */
  async authenticate(promptMessage: string): Promise<BiometricAuthResult> {
    // LocalAuthentication.authenticateAsync({ promptMessage, fallbackLabel: '' })
    // Map result.success / result.error into BiometricAuthResult
  }

  /**
   * Returns true when the user has opted in to biometric unlock
   * (SecureStore key: ledger_biometric_enabled === '1').
   */
  async isEnabled(): Promise<boolean> {
    // SecureStore.getItemAsync('ledger_biometric_enabled') === '1'
  }

  /**
   * Persists the biometric-enabled preference.
   */
  async setEnabled(enabled: boolean): Promise<void> {
    // SecureStore.setItemAsync('ledger_biometric_enabled', enabled ? '1' : '0')
  }
}

export const biometricService = new BiometricService();
```

**Usage rule:** import `biometricService` (the instance), never instantiate `BiometricService` directly elsewhere.

The file naming follows the project convention: `[name].service.ts` inside `lib/services/`.

---

## Biometric Utility

**File:** `lib/utils/biometric.utils.ts`

Pure UI helpers — no async, no SecureStore, no `expo-local-authentication`. Takes a `BiometricType` and returns display values.

```ts
import type { BiometricType } from '@/lib/types/biometric.type';

export function biometricLabel(type: BiometricType): string;
// 'faceId'      → 'Face ID'
// 'fingerprint' → 'Fingerprint'
// 'none'        → ''

export function biometricIcon(type: BiometricType): IconComponent | null;
// 'faceId'      → FaceIdIcon        (from @hugeicons/core-free-icons)
// 'fingerprint' → FingerPrintIcon   (from @hugeicons/core-free-icons)
// 'none'        → null
```

---

## LockContext Changes

**File:** `lib/context/lock.context.tsx` — extend the existing interface.

Import `BiometricType` from `@/lib/types/biometric.type`. Call `biometricService` methods; never call `expo-local-authentication` directly from the context.

```ts
import type { BiometricType } from '@/lib/types/biometric.type';
import { biometricService } from '@/lib/services/biometric.service';

export interface LockCtxValue {
  // --- existing ---
  lockEnabled: boolean;
  isLocked: boolean;
  pinOnboarded: boolean;
  showOnboarding: boolean;
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;

  // --- new ---
  biometricType: BiometricType;           // 'faceId' | 'fingerprint' | 'none'
  biometricEnabled: boolean;
  enableBiometric: () => Promise<void>;   // biometricService.setEnabled(true)
  disableBiometric: () => Promise<void>;  // biometricService.setEnabled(false)
  unlockWithBiometric: () => Promise<boolean>; // biometricService.authenticate(...)
}
```

### Boot sequence additions

After resolving `hasOnboarded` and `isLockEnabled`, call `biometricService.getSupportedType()` and `biometricService.isEnabled()` in the same initialisation block. Store both in context state.

If `biometricType === 'none'`, all biometric UI is hidden regardless of the stored preference.

---

## Onboarding Flow Changes

**File:** `lib/components/pin-onboarding.component.tsx` — add Step 4.

After the user completes PIN confirmation (current Step 3 success path), **before** calling `markOnboarded()`:

```
Step 4 — Biometric Opt-in   (only shown if biometricType !== 'none')

  Icon:    FaceIdIcon  |  FingerPrintIcon   (from @hugeicons/core-free-icons)
           resolved via biometricIcon(biometricType) from biometric.utils.ts

  Heading: "Enable Face ID"  |  "Enable Fingerprint"
           resolved via biometricLabel(biometricType)

  Body:    "Unlock faster with Face ID."  |  "Unlock faster with your fingerprint."

  CTA (primary):   "Enable"   → enableBiometric() → markOnboarded() → app opens
  CTA (secondary): "Not now"  → markOnboarded() → app opens (PIN-only lock)

  No back button on this step — PIN is already committed.
```

If `biometricType === 'none'`, skip Step 4 and call `markOnboarded()` at the end of Step 3 as before.

---

## Lock Screen Changes

**File:** `lib/components/lock-screen.component.tsx`

### Auto-prompt on arrival

When the lock screen mounts and `biometricEnabled === true`:
1. Wait 400 ms (lets the screen animate in before the OS dialog appears).
2. Call `unlockWithBiometric()` from context (which delegates to `biometricService.authenticate`).
3. On success: dismiss the lock screen.
4. On failure or cancellation: do nothing — keypad remains available.

### Biometric button on keypad

The bottom-left key of the numeric keypad (currently empty per `pin-input.component.tsx`) becomes the biometric shortcut **when `biometricEnabled === true`**:

```
[ FaceIdIcon | FingerPrintIcon ]   ← 32 × 32 icon, `inkSoft` color
```

Pressing it calls `unlockWithBiometric()` (user-initiated retry).

When `biometricEnabled === false`, the key remains empty — no change from the PIN spec.

### Fallback label

Below the 4-dot PIN input, show a small tappable label:

```
"Use Face ID"  |  "Use Fingerprint"
```

Resolved via `biometricLabel(biometricType)`. Visible only when `biometricEnabled === true`. Style: `DMSans_400Regular`, 13px, `accent` color, underlined. Tapping triggers `unlockWithBiometric()`.

---

## Settings Integration

**File:** `app/(tabs)/settings.tsx` — extend the existing Security section.

```
Section: Security
  Row: App Lock
    ...unchanged...

  Row: Change PIN
    ...unchanged...

  Row: Face ID  |  Fingerprint        ← hidden when biometricType === 'none'
    Label:     biometricLabel(biometricType)
    Sub-label: "On" | "Off"
    Right:     Toggle Switch

  Row: Re-enroll Biometric            ← only visible when biometricEnabled === true
    Label:     "Re-enroll " + biometricLabel(biometricType)
    Right:     chevron icon
```

### Enabling biometrics from Settings

When the user toggles the biometric row **on**:
1. Call `biometricService.authenticate(...)` directly to verify the OS credential is working.
2. On success → call `enableBiometric()` from context.
3. On failure/cancel → leave toggle off, show brief inline error: "Biometric verification failed."

### Disabling biometrics from Settings

When the user toggles the biometric row **off**:
1. No PIN re-verification needed (PIN lock is still active, so no security regression).
2. Call `disableBiometric()` from context immediately.

### Re-enroll

Tapping the Re-enroll row runs a fresh `biometricService.authenticate(...)` prompt. On success the preference stays enabled. Purpose: lets the user verify the OS credential after re-registering their face/fingerprint in system settings.

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Device has no biometric hardware | `biometricType === 'none'`; all biometric UI hidden |
| Hardware present but no enrolled credential | `getSupportedType()` returns `'none'`; UI hidden |
| User removes face/fingerprint from OS settings after enabling | `authenticate()` resolves `{ success: false }`; fall through to PIN. Show one-time banner: "Biometric unavailable. Update in device Settings." |
| App backgrounded while OS biometric dialog is open | Dialog is dismissed by the OS; on re-foreground `isLocked` is true, auto-prompt fires again |
| User dismisses the OS dialog manually | Do not auto-retry; wait for user to tap the biometric key/label |

---

## File Checklist

```
lib/
  types/
    biometric.type.ts                # BiometricType, BiometricAuthResult
  services/
    biometric.service.ts             # BiometricService class + biometricService singleton
  utils/
    biometric.utils.ts               # biometricLabel(), biometricIcon() — pure UI helpers
  context/
    lock.context.tsx                 # extend LockCtxValue; call biometricService, import BiometricType
  components/
    pin-onboarding.component.tsx     # add Step 4 biometric opt-in
    lock-screen.component.tsx        # auto-prompt + keypad biometric key + fallback label
    pin-input.component.tsx          # bottom-left key accepts optional biometric icon prop
```

No new files beyond the two in `lib/types/` and `lib/services/`. All other changes are additive edits to files already specified in `app-lock-pin.md`.

---

## Acceptance Criteria

1. On a biometric-capable device, Step 4 appears in the onboarding wizard after PIN confirmation.
2. Tapping "Enable" stores the preference and opens the app.
3. Tapping "Not now" skips biometrics; app opens with PIN-only lock.
4. On a device with no biometric hardware or no enrolled credential, Step 4 is never shown.
5. Lock screen: biometric prompt fires automatically ~400 ms after mount (when enabled).
6. Correct biometric dismisses the lock screen without touching the keypad.
7. Cancelled or failed biometric leaves the keypad fully functional.
8. Lock screen keypad: bottom-left key shows the biometric icon and triggers the prompt (when enabled).
9. Settings > biometric toggle enables and disables biometric unlock.
10. Disabling App Lock also disables biometric unlock (lock screen never shown).
11. Labels and icons adapt at runtime — "Face ID" on iOS Face ID devices, "Fingerprint" on Android.
12. `biometricService` is the only place `expo-local-authentication` is imported — no direct usage elsewhere.
13. `npx tsc --noEmit` passes with no errors.
