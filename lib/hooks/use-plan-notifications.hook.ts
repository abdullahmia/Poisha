import { useEffect } from 'react';
import { AppState } from 'react-native';
import { syncPlanDueNotifications } from '@/lib/utils/plan-notification.util';

// Re-derives the due-date notification schedule on launch and on every resume.
// The mutation call sites already keep it fresh while the app is open; this
// covers what they can't — notifications consumed while the app was closed,
// more distant dates rolling into the MAX_SCHEDULED window, and device clock or
// timezone changes made outside the app.
export function usePlanNotifications(): void {
  useEffect(() => {
    syncPlanDueNotifications();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') syncPlanDueNotifications();
    });
    return () => sub.remove();
  }, []);
}
