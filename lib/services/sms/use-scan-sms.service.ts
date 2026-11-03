import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { runSmsScan, type TScanResult } from '@/lib/utils/sms-scan.util';

/**
 * Nothing in this app refetches on its own — `staleTime: Infinity` — so a scan
 * that found new items has to say so explicitly or the queue, the banner and
 * the badge all keep showing stale numbers.
 */
export function useScanSms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sinceMsOverride?: number): Promise<TScanResult> => runSmsScan(sinceMsOverride),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.lastScanAt });
      if (result.ok && result.found === 0) return;

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
    },
  });
}
