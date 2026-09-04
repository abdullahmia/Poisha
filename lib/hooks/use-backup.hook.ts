import {
  useBackupAccount,
  useBackupList,
  useBackupSettings,
  useConnectBackupAccount,
  useDisconnectBackupAccount,
  useRestoreBackup,
  useRunBackup,
  useSetBackupEnabled,
  useSetBackupFrequency,
} from "@/lib/services/backup";
import type { TBackupFrequency } from "@/lib/types";
import { useCallback } from "react";
import { useLock } from "./use-lock.hook";

export function useBackup() {
  const { runWithoutAutoLock } = useLock();

  const account = useBackupAccount();
  const settings = useBackupSettings();
  const connectMutation = useConnectBackupAccount();
  const disconnectMutation = useDisconnectBackupAccount();
  const setEnabledMutation = useSetBackupEnabled();
  const setFrequencyMutation = useSetBackupFrequency();
  const runBackupMutation = useRunBackup();
  const restoreMutation = useRestoreBackup();

  const status = account.data?.status ?? "disconnected";
  const available = status !== "unavailable";
  const connected = status === "connected";

  const backups = useBackupList(connected);

  const connect = useCallback(
    () => runWithoutAutoLock(() => connectMutation.mutateAsync()),
    [runWithoutAutoLock, connectMutation],
  );

  const disconnect = useCallback(
    () => disconnectMutation.mutateAsync(),
    [disconnectMutation],
  );
  const setEnabled = useCallback(
    (v: boolean) => setEnabledMutation.mutate(v),
    [setEnabledMutation],
  );
  const setFrequency = useCallback(
    (f: TBackupFrequency) => setFrequencyMutation.mutate(f),
    [setFrequencyMutation],
  );
  const runBackup = useCallback(
    () => runBackupMutation.mutateAsync(),
    [runBackupMutation],
  );
  const restore = useCallback(
    (fileId: string) => restoreMutation.mutateAsync(fileId),
    [restoreMutation],
  );

  return {
    available,
    connected,
    needsReconnect: status === "needs-reconnect",
    email: account.data?.email ?? null,
    accountLoading: account.isPending,

    enabled: settings.data?.enabled ?? false,
    frequency: settings.data?.frequency ?? "daily",
    lastBackupAt: settings.data?.lastBackupAt ?? null,
    lastStatus: settings.data?.lastStatus ?? null,
    settingsLoading: settings.isPending,

    backups: backups.data ?? [],
    backupsLoading: backups.isPending && connected,

    connect,
    disconnect,
    setEnabled,
    setFrequency,
    runBackup,
    restore,

    connecting: connectMutation.isPending,
    backingUp: runBackupMutation.isPending,
    restoring: restoreMutation.isPending,
  };
}
