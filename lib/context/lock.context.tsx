import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useBiometricEnabled, useSetBiometricEnabled } from '@/lib/services/biometric';
import { useDisableLock, useEnableLock, usePinStatus, useSetPin, useVerifyPin } from '@/lib/services/pin';
import type { TBiometricType } from '@/lib/types';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export interface BiometricUnlockResult {
  success: boolean;
  unavailable?: boolean;
}

export interface LockCtxValue {
  lockEnabled: boolean;
  isLocked: boolean;
  pinOnboarded: boolean;
  showOnboarding: boolean;
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  biometricType: TBiometricType;
  biometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  unlockWithBiometric: () => Promise<BiometricUnlockResult>;
  runWithoutAutoLock: <T>(task: () => Promise<T>) => Promise<T>;
}

export const LockCtx = createContext<LockCtxValue | null>(null);
const SUPPRESS_GRACE_MS = 1500;

export function LockProvider({ children }: { children: React.ReactNode }) {
  const { getSupportedType, authenticate } = useBiometric();
  const pinStatus = usePinStatus();
  const biometricEnabledQuery = useBiometricEnabled();
  const enableLockMutation = useEnableLock();
  const disableLockMutation = useDisableLock();
  const setPinMutation = useSetPin();
  const verifyPinMutation = useVerifyPin();
  const setBiometricEnabledMutation = useSetBiometricEnabled();

  const [isLocked, setIsLocked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [biometricType, setBiometricType] = useState<TBiometricType>('none');
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const suppressAutoLockRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasMadeInitialDecision, setHasMadeInitialDecision] = useState(false);

  useEffect(() => () => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
  }, []);

  useEffect(() => {
    getSupportedType().then(setBiometricType).catch(() => setBiometricType('none'));
  }, [getSupportedType]);

  
  if (!pinStatus.isPending && pinStatus.data && !hasMadeInitialDecision) {
    setHasMadeInitialDecision(true);
    if (!pinStatus.data.onboarded) {
      setShowOnboarding(true);
    } else if (pinStatus.data.lockEnabled) {
      setIsLocked(true);
    }
  }

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      // Some flows hand control to another Activity on purpose — the Google
      // account picker most of all. Backgrounding for those is not the user
      // leaving the app, so it must not arm the lock. See runWithoutAutoLock.
      if (suppressAutoLockRef.current) return;
      if (prev === 'active' && (next === 'background' || next === 'inactive') && pinStatus.data?.lockEnabled) {
        setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, [pinStatus.data?.lockEnabled]);

  /**
   * Runs `task` with auto-lock suppressed.
   *
   * Without this, connecting a Google account is impossible with App Lock on:
   * the account picker is a separate Activity, so the app backgrounds, the lock
   * arms, and `Stack.Protected` in app/_layout.tsx drops the whole settings
   * group out of the navigator — unmounting the screen that is mid-sign-in.
   *
   * The guard is released a beat after the task settles rather than
   * immediately, because the return-to-foreground transition can be delivered
   * after the promise resolves; clearing on the same tick would let that
   * trailing event lock the app anyway.
   */
  const runWithoutAutoLock = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    if (suppressTimerRef.current) clearTimeout(suppressTimerRef.current);
    suppressAutoLockRef.current = true;
    try {
      return await task();
    } finally {
      suppressTimerRef.current = setTimeout(() => {
        suppressAutoLockRef.current = false;
        suppressTimerRef.current = null;
        // Resync so the next real background→active pair is judged from where
        // the app actually is, not from wherever it was when the task began.
        appStateRef.current = AppState.currentState;
      }, SUPPRESS_GRACE_MS);
    }
  }, []);

  const enableLock = useCallback(async (pin: string) => {
    await enableLockMutation.mutateAsync(pin);
    setIsLocked(false);
    setShowOnboarding(false);
  }, [enableLockMutation]);

  const disableLock = useCallback(async () => {
    await disableLockMutation.mutateAsync();
    await setBiometricEnabledMutation.mutateAsync(false);
    setIsLocked(false);
  }, [disableLockMutation, setBiometricEnabledMutation]);

  const changePin = useCallback(async (newPin: string) => {
    await setPinMutation.mutateAsync(newPin);
  }, [setPinMutation]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const ok = await verifyPinMutation.mutateAsync(pin);
    if (ok) setIsLocked(false);
    return ok;
  }, [verifyPinMutation]);

  const enableBiometric = useCallback(async () => {
    await setBiometricEnabledMutation.mutateAsync(true);
  }, [setBiometricEnabledMutation]);

  const disableBiometric = useCallback(async () => {
    await setBiometricEnabledMutation.mutateAsync(false);
  }, [setBiometricEnabledMutation]);

  // Returns unavailable=true so the lock screen can warn the user
  const unlockWithBiometric = useCallback(async (): Promise<BiometricUnlockResult> => {
    const result = await authenticate('Unlock Poisha');
    if (result.success) {
      setIsLocked(false);
      return { success: true };
    }
    if (result.error === 'not_enrolled' || result.error === 'not_available') {
      return { success: false, unavailable: true };
    }
    return { success: false };
  }, [authenticate]);

  if (pinStatus.isPending || biometricEnabledQuery.isPending) return null;

  return (
    <LockCtx.Provider value={{
      lockEnabled: pinStatus.data?.lockEnabled ?? false,
      isLocked,
      pinOnboarded: pinStatus.data?.onboarded ?? false,
      showOnboarding,
      enableLock, disableLock, changePin, unlock,
      biometricType,
      biometricEnabled: biometricType !== 'none' && (biometricEnabledQuery.data ?? false),
      enableBiometric, disableBiometric, unlockWithBiometric,
      runWithoutAutoLock,
    }}>
      {children}
    </LockCtx.Provider>
  );
}
