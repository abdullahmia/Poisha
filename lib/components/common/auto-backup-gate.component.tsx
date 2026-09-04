import { useBackup } from '@/lib/hooks/use-backup.hook';
import { useEffect } from 'react';
import { AppState } from 'react-native';

const DAY_MS = 24 * 60 * 60 * 1000;

const INTERVALS: Record<string, number> = {
  daily: DAY_MS,
  weekly: 7 * DAY_MS,
};


export function AutoBackupGate() {
  const { available, connected, enabled, frequency, lastBackupAt, runBackup } = useBackup();

  useEffect(() => {
    const due = (): boolean => {
      if (!available || !connected || !enabled) return false;

      const interval = INTERVALS[frequency];
      if (!interval) return false; // 'manual' — the user drives it themselves.
      if (!lastBackupAt) return true;

      const last = new Date(lastBackupAt).getTime();
      if (Number.isNaN(last)) return true;
      return Date.now() - last >= interval;
    };

    const maybeRun = () => {
      if (!due()) return;
      void runBackup();
    };

    maybeRun();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') maybeRun();
    });

    return () => subscription.remove();
  }, [available, connected, enabled, frequency, lastBackupAt, runBackup]);

  return null;
}
