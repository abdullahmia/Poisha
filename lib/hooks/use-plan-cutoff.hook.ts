import { useToday } from '@/lib/hooks/use-today.hook';
import { usePlanModeEnabled } from '@/lib/services/plan-mode';
import { NO_CUTOFF } from '@/lib/utils/date.util';

// The single value that turns the whole planned-entry model on and off. Every
// consumer compares dates against this instead of against today, so with Plan
// Mode off they all revert to pre-feature behaviour without an `enabled` check
// of their own — the failure mode to avoid is one forgotten call site leaving
// entries excluded from a total with no UI to find them, so the design makes
// forgetting impossible rather than merely unlikely.
// Reads the flag query directly rather than going through usePlanMode(): this
// runs in EntryCard, which renders per row in a virtualized list, and the
// setter's mutation observer would be created once per visible card for nothing.
export function usePlanCutoff(): string {
  const enabledQuery = usePlanModeEnabled();
  const today = useToday();
  return (enabledQuery.data ?? false) ? today : NO_CUTOFF;
}
