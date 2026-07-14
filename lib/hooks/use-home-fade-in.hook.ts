import { useEffect } from 'react';
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/** Staggered entrance animation for the home screen's six sections. */
export function useHomeFadeIn(ready: boolean) {
  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0);
  const sv5 = useSharedValue(0);

  useEffect(() => {
    if (!ready) return;
    const config = { duration: 420, easing: Easing.out(Easing.cubic) };
    sv0.value = withTiming(1, config);
    sv1.value = withDelay(70, withTiming(1, config));
    sv2.value = withDelay(140, withTiming(1, config));
    sv3.value = withDelay(210, withTiming(1, config));
    sv4.value = withDelay(280, withTiming(1, config));
    sv5.value = withDelay(210, withTiming(1, config));
  }, [ready]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: sv0.value, transform: [{ translateY: (1 - sv0.value) * 12 }] }));
  const monthStyle = useAnimatedStyle(() => ({ opacity: sv1.value, transform: [{ translateY: (1 - sv1.value) * 18 }] }));
  const heroStyle = useAnimatedStyle(() => ({ opacity: sv2.value, transform: [{ translateY: (1 - sv2.value) * 18 }] }));
  const chartStyle = useAnimatedStyle(() => ({ opacity: sv3.value, transform: [{ translateY: (1 - sv3.value) * 18 }] }));
  const recentStyle = useAnimatedStyle(() => ({ opacity: sv4.value, transform: [{ translateY: (1 - sv4.value) * 18 }] }));
  const budgetBarStyle = useAnimatedStyle(() => ({ opacity: sv5.value, transform: [{ translateY: (1 - sv5.value) * 18 }] }));

  return { headerStyle, monthStyle, heroStyle, chartStyle, recentStyle, budgetBarStyle };
}
