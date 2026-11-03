import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { clearAllSmsData } from '@/lib/utils/sms-scan.util';

/**
 * The destructive escape hatch: drops every detected transaction and resets the
 * scan cursor to now. Entries already confirmed are untouched — they are
 * ordinary entries and stop being the SMS feature's business the moment they
 * are created.
 */
export function useClearSmsData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAllSmsData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.lastScanAt });
    },
  });
}
