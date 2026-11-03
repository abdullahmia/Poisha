import { useSmsEnabled, useSmsPendingCount } from '@/lib/services/sms';
import { isSmsReaderAvailable } from '@/modules/expo-sms-reader/src';

/**
 * Just enough to decide whether to show a nudge.
 *
 * Separate from `useSms` because the surfaces that only need a count — the tab
 * bar, the settings index — are mounted for the whole life of the app, and
 * pulling the full facade there would stand up every SMS query and mutation
 * (including hydrating the entire queue) to render a 7px dot.
 */
export function useSmsBadge() {
  const enabledQuery = useSmsEnabled();
  const countQuery = useSmsPendingCount();

  const enabled = enabledQuery.data ?? false;

  return {
    available: isSmsReaderAvailable(),
    enabled,
    pendingCount: enabled ? (countQuery.data ?? 0) : 0,
  };
}
