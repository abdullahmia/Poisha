import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useBiometricEnabled, useSetBiometricEnabled } from '@/lib/services/biometric';
import { useDisableLock, useEnableLock, usePinStatus, useSetPin, useVerifyPin } from '@/lib/services/pin';
import type { TBiometricType } from '@/lib/types';

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
}

export const LockCtx = createContext<LockCtxValue | null>(null);

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
  const initializedRef = useRef(false);

  useEffect(() => {
    getSupportedType().then(setBiometricType).catch(() => setBiometricType('none'));
  }, [getSupportedType]);

  // Once the pin status query first resolves, decide whether to show onboarding
  // or start locked — mirrors the original bootstrap-then-gate behavior.
  useEffect(() => {
    if (initializedRef.current || pinStatus.isPending) return;
    initializedRef.current = true;
    if (!pinStatus.data?.onboarded) {
      setShowOnboarding(true);
    } else if (pinStatus.data?.lockEnabled) {
      setIsLocked(true);
    }
  }, [pinStatus.isPending, pinStatus.data]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev === 'active' && (next === 'background' || next === 'inactive') && pinStatus.data?.lockEnabled) {
        setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, [pinStatus.data?.lockEnabled]);

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
    }}>
      {children}
    </LockCtx.Provider>
  );
}
