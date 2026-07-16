import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import {
  clearPinLockout,
  getPinLockoutUntil,
  setPinLockoutUntil,
} from '@/lib/services/pin/pin-storage.util';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export function usePinLockout() {
  const { unlock, unlockWithBiometric, biometricEnabled } = useLock();
  const { notification } = useHaptics();

  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lockoutTotal, setLockoutTotal] = useState(LOCKOUT_SECONDS);
  const [bioUnavailable, setBioUnavailable] = useState(false);

  // Guards against overlapping unlock attempts (PIN submit racing a biometric prompt)
  const unlockingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bioPromptFiredRef = useRef(false);

  function beginCountdown(seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setLockedOut(true);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setLockedOut(false);
          setAttempts(0);
          clearPinLockout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function startLockout() {
    const until = Date.now() + LOCKOUT_SECONDS * 1000;
    await setPinLockoutUntil(until);
    setLockoutTotal(LOCKOUT_SECONDS);
    beginCountdown(LOCKOUT_SECONDS);
  }

  // Restore an in-progress lockout across app restarts
  useEffect(() => {
    getPinLockoutUntil().then(until => {
      if (!until) return;
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTotal(LOCKOUT_SECONDS);
        beginCountdown(remaining);
      } else {
        clearPinLockout();
      }
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function handleBiometric() {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    try {
      const result = await unlockWithBiometric();
      if (result.unavailable) setBioUnavailable(true);
    } finally {
      unlockingRef.current = false;
    }
  }

  // Auto-prompt biometric once per mount, only while the app is actually foregrounded.
  // The readiness check happens when the prompt is about to fire, not when this
  // effect first runs — right after returning from background, AppState.currentState
  // can still briefly report the stale 'inactive'/'background' value, which would
  // otherwise skip the prompt for the whole lock session (this effect only re-runs
  // if `biometricEnabled` itself changes, so a missed attempt never retries).
  useEffect(() => {
    if (!biometricEnabled || bioPromptFiredRef.current) return;

    function tryPrompt() {
      if (bioPromptFiredRef.current || AppState.currentState !== 'active') return;
      bioPromptFiredRef.current = true;
      handleBiometric();
    }

    const t = setTimeout(tryPrompt, 400);
    const sub = AppState.addEventListener('change', next => { if (next === 'active') tryPrompt(); });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [biometricEnabled]);

  async function handleComplete(entered: string) {
    if (unlockingRef.current) return;
    unlockingRef.current = true;
    try {
      const ok = await unlock(entered);
      if (!ok) {
        const next = attempts + 1;
        setAttempts(next);
        notification(Haptics.NotificationFeedbackType.Error);
        setShake(true);
        if (next >= MAX_ATTEMPTS) startLockout();
      }
    } finally {
      unlockingRef.current = false;
    }
  }

  const handleShakeDone = () => { setShake(false); setPin(''); };

  return {
    pin,
    setPin,
    shake,
    handleShakeDone,
    attempts,
    maxAttempts: MAX_ATTEMPTS,
    lockedOut,
    countdown,
    lockoutTotal,
    bioUnavailable,
    handleComplete,
    handleBiometric,
  };
}
