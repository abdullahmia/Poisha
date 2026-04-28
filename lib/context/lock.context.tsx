import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { pinService } from '@/lib/services/pin.service';

export interface LockCtxValue {
  lockEnabled: boolean;
  isLocked: boolean;
  pinOnboarded: boolean;
  showOnboarding: boolean;
  enableLock: (pin: string) => Promise<void>;
  disableLock: () => Promise<void>;
  changePin: (newPin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
}

export const LockCtx = createContext<LockCtxValue | null>(null);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const [lockEnabled, setLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [pinOnboarded, setPinOnboarded] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const [onboarded, enabled] = await Promise.all([
        pinService.hasOnboarded(),
        pinService.isLockEnabled(),
      ]);
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
    setLockEnabled(false);
    setIsLocked(false);
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

  if (!ready) return null;

  return (
    <LockCtx.Provider value={{ lockEnabled, isLocked, pinOnboarded, showOnboarding, enableLock, disableLock, changePin, unlock }}>
      {children}
    </LockCtx.Provider>
  );
}
