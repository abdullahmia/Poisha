import { useCallback } from 'react';
import { usePlanModeEnabled, useSetPlanModeEnabled } from '@/lib/services/plan-mode';

export function usePlanMode() {
  const enabledQuery = usePlanModeEnabled();
  const setEnabledMutation = useSetPlanModeEnabled();

  const enabled = enabledQuery.data ?? false;

  const setEnabled = useCallback(async (value: boolean) => {
    await setEnabledMutation.mutateAsync(value);
  }, [setEnabledMutation]);

  return { enabled, setEnabled };
}
