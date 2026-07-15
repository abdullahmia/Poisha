import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/** Fade-and-rise entrance animation; pass an increasing delay per item to stagger a list of sections. */
export function useFadeIn(delayMs = 0) {
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withDelay(delayMs, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, []);

  return useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 16 }] }));
}
