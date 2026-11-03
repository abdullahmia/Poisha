import { useCallback } from 'react';
import {
  useAcceptSmsItem,
  useAcceptSmsItems,
  useClearSmsData,
  useDismissSmsItem,
  useRequestSmsPermission,
  useScanSms,
  useSetSmsEnabled,
  useSmsEnabled,
  useSmsLastScanAt,
  useSmsPendingCount,
  useSmsPermission,
  useSmsQueue,
} from '@/lib/services/sms';
import type { TDraft, TSmsItem } from '@/lib/types';
import { backfillCursor } from '@/lib/utils/sms-scan.util';
import { isSmsReaderAvailable } from '@/modules/expo-sms-reader/src';
import { useLock } from './use-lock.hook';

/**
 * The single surface components use. Composes the SMS services the way
 * `use-backup.hook.ts` composes the backup ones — no new context, because
 * TanStack Query is already the state layer and an unmemoized context value
 * would fan re-renders out across the app.
 */
export function useSms() {
  const { runWithoutAutoLock } = useLock();

  const enabledQuery = useSmsEnabled();
  const permissionQuery = useSmsPermission();
  const queueQuery = useSmsQueue();
  const pendingCountQuery = useSmsPendingCount();
  const lastScanQuery = useSmsLastScanAt();

  const setEnabledMutation = useSetSmsEnabled();
  const requestPermissionMutation = useRequestSmsPermission();
  const scanMutation = useScanSms();
  const acceptMutation = useAcceptSmsItem();
  const acceptAllMutation = useAcceptSmsItems();
  const dismissMutation = useDismissSmsItem();
  const clearMutation = useClearSmsData();

  /**
   * The permission dialog is a separate Activity, so the app backgrounds while
   * it is up. With App Lock on, `LockProvider` would arm the lock, the root
   * `Stack.Protected` guard would drop the settings group, and the screen that
   * started the request would unmount mid-dialog — the exact failure
   * `runWithoutAutoLock` was written for when the Google account picker hit it.
   */
  const requestPermission = useCallback(
    () => runWithoutAutoLock(() => requestPermissionMutation.mutateAsync()),
    [runWithoutAutoLock, requestPermissionMutation]
  );

  const setEnabled = useCallback(
    (value: boolean) => setEnabledMutation.mutateAsync(value),
    [setEnabledMutation]
  );

  const scan = useCallback(() => scanMutation.mutateAsync(undefined), [scanMutation]);

  const backfill = useCallback(
    (days?: number) => scanMutation.mutateAsync(backfillCursor(days)),
    [scanMutation]
  );

  const accept = useCallback(
    (item: TSmsItem, draft?: TDraft) => acceptMutation.mutateAsync({ item, draft }),
    [acceptMutation]
  );

  const acceptAll = useCallback(
    (items: TSmsItem[]) => acceptAllMutation.mutateAsync(items),
    [acceptAllMutation]
  );

  const dismiss = useCallback((id: string) => dismissMutation.mutateAsync(id), [dismissMutation]);

  const clearData = useCallback(() => clearMutation.mutateAsync(), [clearMutation]);

  const permission = permissionQuery.data ?? 'unavailable';

  return {
    /** False on iOS, web and tablets — branch on this, never on Platform.OS. */
    available: isSmsReaderAvailable(),
    enabled: enabledQuery.data ?? false,
    enabledLoading: enabledQuery.isPending,

    permission,
    granted: permission === 'granted',
    /** Only system settings can undo this; an in-app prompt would do nothing. */
    blocked: permission === 'blocked',
    permissionLoading: permissionQuery.isPending,

    queue: queueQuery.data ?? [],
    queueLoading: queueQuery.isPending,
    pendingCount: pendingCountQuery.data ?? 0,
    lastScanAt: lastScanQuery.data ?? null,

    setEnabled,
    requestPermission,
    scan,
    backfill,
    accept,
    acceptAll,
    dismiss,
    clearData,

    scanning: scanMutation.isPending,
    accepting: acceptMutation.isPending || acceptAllMutation.isPending,
  };
}
