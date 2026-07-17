import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAppUpdates } from '@/lib/hooks/use-app-updates.hook';

/**
 * Mounted once at the app root (when unlocked). Surfaces the "Update ready"
 * modal automatically on open/foreground instead of waiting for the user to
 * visit Settings and tap "Check for Updates".
 */
export function AppUpdatesGate() {
  const { isUpdatePending, checkForUpdateSilently, notifyUpdateReady } = useAppUpdates();
  const notifiedPending = useRef(false);
  const checking = useRef(false);

  useEffect(() => {
    if (isUpdatePending && !notifiedPending.current) {
      notifiedPending.current = true;
      notifyUpdateReady();
    }
  }, [isUpdatePending, notifyUpdateReady]);

  useEffect(() => {
    const runCheck = () => {
      if (checking.current || isUpdatePending) return;
      checking.current = true;
      checkForUpdateSilently().finally(() => {
        checking.current = false;
      });
    };

    runCheck();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') runCheck();
    });

    return () => subscription.remove();
  }, [checkForUpdateSilently, isUpdatePending]);

  return null;
}
