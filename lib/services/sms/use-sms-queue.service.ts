import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TSmsItem } from '@/lib/types';
import { readLastScanAt } from '@/lib/utils/sms-scan.util';

export function useSmsQueue() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.queue,
    queryFn: async (): Promise<TSmsItem[]> => sqliteStorage.loadSmsItems('pending'),
  });
}

/**
 * Split from `useSmsQueue` on purpose: the Home banner and the tab badge mount
 * on every launch and only need a COUNT, which is one indexed lookup rather
 * than hydrating the whole queue.
 */
export function useSmsPendingCount() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.pendingCount,
    queryFn: async (): Promise<number> => sqliteStorage.countSmsItems('pending'),
    // placeholderData, not initialData — the latter would mark the query
    // fetched and the real count would never be read on a cold start. Zero is
    // also the right placeholder visually: the banner can't flash in and out.
    placeholderData: 0,
  });
}

export function useSmsLastScanAt() {
  return useQuery({
    queryKey: QUERY_KEYS.sms.lastScanAt,
    queryFn: async (): Promise<number | null> => readLastScanAt(),
  });
}
