import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';

const KEY = 'poisha_haptics_enabled';

// Module-level store — all hook instances share this so toggling in Settings
// propagates instantly to every component without needing a Provider.
let _enabled = true;
const _listeners = new Set<(v: boolean) => void>();

AsyncStorage.getItem(KEY).then(val => {
  if (val === '0') {
    _enabled = false;
    _listeners.forEach(fn => fn(false));
  }
});

function subscribe(fn: (v: boolean) => void) {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

export function useHaptics() {
  const [enabled, setEnabled] = useState(_enabled);

  useEffect(() => subscribe(setEnabled), []);

  const setHapticsEnabled = useCallback(async (value: boolean) => {
    if (!value) {
      // One final haptic so the user feels the toggle take effect
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    _enabled = value;
    _listeners.forEach(fn => fn(value));
    await AsyncStorage.setItem(KEY, value ? '1' : '0');
  }, []);

  // Use _enabled (module var) directly in callbacks so they always read the
  // latest value without needing to be re-created on state change.
  const impact = useCallback((style = Haptics.ImpactFeedbackStyle.Light) => {
    if (!_enabled) return;
    Haptics.impactAsync(style);
  }, []);

  const notification = useCallback((type: Haptics.NotificationFeedbackType) => {
    if (!_enabled) return;
    Haptics.notificationAsync(type);
  }, []);

  const selection = useCallback(() => {
    if (!_enabled) return;
    Haptics.selectionAsync();
  }, []);

  return { hapticsEnabled: enabled, setHapticsEnabled, impact, notification, selection };
}
