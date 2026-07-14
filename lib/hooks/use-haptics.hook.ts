import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useHapticsEnabled, useSetHapticsEnabled } from '@/lib/services/haptics';

export function useHaptics() {
  const { data: hapticsEnabled } = useHapticsEnabled();
  const setHapticsEnabledMutation = useSetHapticsEnabled();

  const setHapticsEnabled = useCallback(async (value: boolean) => {
    if (!value) {
      // One final haptic so the user feels the toggle take effect
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await setHapticsEnabledMutation.mutateAsync(value);
  }, [setHapticsEnabledMutation]);

  const impact = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (!hapticsEnabled) return;
    Haptics.impactAsync(style);
  }, [hapticsEnabled]);

  const notification = useCallback((type: Haptics.NotificationFeedbackType) => {
    if (!hapticsEnabled) return;
    Haptics.notificationAsync(type);
  }, [hapticsEnabled]);

  const selection = useCallback(() => {
    if (!hapticsEnabled) return;
    Haptics.selectionAsync();
  }, [hapticsEnabled]);

  return { hapticsEnabled, setHapticsEnabled, impact, notification, selection };
}
