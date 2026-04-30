# Issue: Biometric Authentication Bugs

## Status
> **Fixed** — 2026-04-30

## Reported
2026-04-30

## Summary
Three critical bugs found in the biometric authentication flow affecting both Android and iOS.

---

## Bug 1 — Android shows Face ID icon instead of fingerprint

### Description
On Android devices, the app detects `FACIAL_RECOGNITION` in the supported types and returns `'faceId'`, causing the UI to display the Face ID icon and label. Most Android devices use fingerprint as their primary biometric method; Face ID is an Apple-specific term.

### Root Cause
`biometric.service.ts → getSupportedType()` checks `FACIAL_RECOGNITION` before `FINGERPRINT` regardless of platform. On Android, a device can report both types — fingerprint should be preferred.

### Fix
Use `Platform.OS` to set priority order: on iOS prefer `FACIAL_RECOGNITION` (Face ID), on Android prefer `FINGERPRINT`.

### File
`lib/services/biometric.service.ts`

---

## Bug 2 — "Enable Biometric" button does nothing on onboarding

### Description
On the biometric step of onboarding, tapping the "Enable" button does not trigger a biometric prompt. The user expects to verify their biometric at this point, but the app silently saves the preference and navigates away (which itself leads into Bug 3 — blank screen).

### Root Cause
`pin-onboarding.component.tsx → handleEnableBiometric()` calls `enableBiometric()` and `enableLock()` directly without first calling `biometricService.authenticate()`. No native biometric prompt is shown.

### Fix
Call `biometricService.authenticate()` before enabling — if the user cancels or fails, stay on the biometric step.

### File
`lib/components/pin-onboarding.component.tsx`

---

## Bug 3 — Blank screen shown after biometric unlock

### Description
After successfully authenticating with biometrics (either from onboarding or the lock screen), the app shows a blank white/parchment screen instead of navigating to the home screen.

### Root Cause
`AppGate` in `app/_layout.tsx` conditionally mounts the Expo Router `<Stack>` only when the app is unlocked. When `isLocked` or `showOnboarding` transitions to `false`, the `<Stack>` is mounted for the first time — Expo Router needs at least one render cycle to initialise and route to `(tabs)`, producing a blank frame.

### Fix
Always render the `<Stack>` and `<AddEntrySheet />`. Use a native `<Modal>` (not an absoluteFill `<View>`) to show `<LockScreen />` or `<PinOnboarding />` on top. A Modal renders in a separate native window layer, completely outside the React Navigation tree, so Expo Router's linking configuration is set up exactly once and never sees a "second navigator mounting". The Stack is always initialised and ready; closing the Modal reveals the already-rendered app instantly with no blank frame.

### File
`app/_layout.tsx`
