import { useCallback } from 'react';
import { usePlanModeEnabled, useSetPlanModeEnabled } from '@/lib/services/plan-mode';

export function usePlanMode() {
  const enabledQuery = usePlanModeEnabled();
  const setEnabledMutation = useSetPlanModeEnabled();

  const enabled = enabledQuery.data ?? false;

  const setEnabled = useCallback(async (value: boolean) => {
    await setEnabledMutation.mutateAsync(value);
  }, [setEnabledMutation]);

  // `loading` matters only to the /plan route guard: the query has no
  // initialData, so `enabled` is false for the first render while AsyncStorage
  // resolves. Redirecting on that would bounce a cold-start deep link away from
  // /plan even when Plan Mode is genuinely on.
  return { enabled, setEnabled, loading: enabledQuery.isPending };
}
