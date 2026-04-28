import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { biometricService } from '@/lib/services/biometric.service';
import { pinService } from '@/lib/services/pin.service';
import type { BiometricType } from '@/lib/types/biometric.type';

export interface LockCtxValue {
  lockEnabled: boolean;
  isLocked: boolean;
  pinOnboarded: boolean;
  showOnboarding: boolean;
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  biometricType: BiometricType;
  biometricEnabled: boolean;
  enableBiometric: () => Promise<void>;
  disableBiometric: () => Promise<void>;
  unlockWithBiometric: () => Promise<boolean>;
}

export const LockCtx = createContext<LockCtxValue | null>(null);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pinOnboarded, setPinOnboarded] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>('none');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const [onboarded, enabled, bioType, bioEnabled] = await Promise.all([
        pinService.hasOnboarded(),
        pinService.isLockEnabled(),
        biometricService.getSupportedType(),
        biometricService.isEnabled(),
      ]);
      setBiometricType(bioType);
      setBiometricEnabled(bioType !== 'none' && bioEnabled);
      if (!onboarded) {
        setPinOnboarded(false);
        setShowOnboarding(true);
        setIsLocked(false);
      } else if (enabled) {
        setLockEnabled(true);
        setIsLocked(true);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (
        (prev === 'active') &&
        (next === 'background' || next === 'inactive') &&
        lockEnabled
      ) {
        setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, [lockEnabled]);

  const enableLock = useCallback(async (pin: string) => {
    await pinService.setPin(pin);
    await pinService.setLockEnabled(true);
    await pinService.markOnboarded();
    setLockEnabled(true);
    setIsLocked(false);
    setPinOnboarded(true);
    setShowOnboarding(false);
  }, []);

  const disableLock = useCallback(async () => {
    await pinService.setLockEnabled(false);
    await pinService.deletePin();
    await biometricService.setEnabled(false);
    setLockEnabled(false);
    setIsLocked(false);
    setBiometricEnabled(false);
  }, []);

  const changePin = useCallback(async (newPin: string) => {
    await pinService.setPin(newPin);
  }, []);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await pinService.getPin();
    if (stored === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const enableBiometric = useCallback(async () => {
    await biometricService.setEnabled(true);
    setBiometricEnabled(true);
  }, []);

  const disableBiometric = useCallback(async () => {
    await biometricService.setEnabled(false);
    setBiometricEnabled(false);
  }, []);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    const result = await biometricService.authenticate('Unlock Poisha');
    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  if (!ready) return null;

  return (
    <LockCtx.Provider value={{
      lockEnabled, isLocked, pinOnboarded, showOnboarding,
      enableLock, disableLock, changePin, unlock,
      biometricType, biometricEnabled,
      enableBiometric, disableBiometric, unlockWithBiometric,
    }}>
      {children}
    </LockCtx.Provider>
  );
}
