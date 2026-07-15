import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface ThemeTransitionCtxValue {
  flash: (fromColor: string) => void;
}

export const ThemeTransitionCtx = createContext<ThemeTransitionCtxValue | null>(null);

export function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  // A fresh object identity each call (rather than a plain string/boolean)
  // guarantees the effect below re-fires even if flash() is called twice in a
  // row with the same color — a plain string/boolean would get deduped by
  // React's state-update bailout.
  const [flashRequest, setFlashRequest] = useState<{ color: string } | null>(null);
  const opacity = useSharedValue(0);
  const color = useSharedValue('#000000');

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: color.value,
  }));

  useEffect(() => {
    if (!flashRequest) return;
    color.value = flashRequest.color;
    opacity.value = 1;
    opacity.value = withTiming(
      0,
      { duration: 280, easing: Easing.out(Easing.quad) },
      finished => {
        if (finished) runOnJS(setFlashRequest)(null);
      },
    );
  }, [flashRequest]);

  const flash = useCallback((fromColor: string) => setFlashRequest({ color: fromColor }), []);

  return (
    <ThemeTransitionCtx.Provider value={{ flash }}>
      {children}
      {/* A Modal (like the lock screen below) is required to reliably render
          above expo-router's Stack, which presents screens as native view
          controllers via react-native-screens — a plain sibling View is not
          guaranteed to composite on top of that. */}
      <Modal visible={flashRequest !== null} transparent animationType="none" statusBarTranslucent onRequestClose={() => {}}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyle]} />
      </Modal>
    </ThemeTransitionCtx.Provider>
  );
}

export function useThemeTransition() {
  const ctx = useContext(ThemeTransitionCtx);
  if (!ctx) throw new Error('useThemeTransition must be used within ThemeTransitionProvider');
  return ctx;
}
