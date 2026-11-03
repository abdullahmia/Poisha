import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { QUERY_KEYS } from '@/lib/constants';
import { useSms } from '@/lib/hooks/use-sms.hook';
import { syncBackgroundAlerts } from '@/lib/utils/sms-alerts.util';
import { ingestLiveSms } from '@/lib/utils/sms-scan.util';
import { smsReader } from '@/modules/expo-sms-reader/src';

/**
 * Headless. Scans the inbox on mount and on every return to the foreground, and
 * listens for messages arriving while the app is open.
 *
 * Modeled on `auto-backup-gate.component.tsx` — background work in this app is
 * driven by a gate component at the root rather than a task manager, because
 * nothing here needs to run while the app is closed.
 */
export function SmsScanGate() {
  const queryClient = useQueryClient();
  const { available, enabled, granted, scan } = useSms();

  const active = available && enabled && granted;

  // Converges the native background-alert flag with the app's settings on every
  // launch. The per-toggle syncs keep it right during a session; this is what
  // fixes it after a restore, which rewrites the flags behind their backs.
  useEffect(() => {
    void syncBackgroundAlerts();
  }, [enabled]);

  useEffect(() => {
    if (!active) return;

    void scan();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void scan();
    });

    return () => subscription.remove();
  }, [active, scan]);

  useEffect(() => {
    if (!active || !smsReader) return;

    // Subscribing is what starts the native receiver (OnStartObserving), and
    // unsubscribing tears it down — so this effect's cleanup is the only thing
    // stopping a receiver outliving the feature being switched off.
    //
    // The listener is attached in an effect rather than during render: with the
    // React Compiler on, a render-phase subscription would leak on every
    // re-render and never be cleaned up.
    const subscription = smsReader.addListener('onSmsReceived', raw => {
      // Parsing happens here, in JS, on exactly the same code path as a scan.
      // The native side only ever hands over raw text.
      void ingestLiveSms(raw).then(inserted => {
        if (inserted === 0) return;
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.queue });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sms.pendingCount });
      });
    });

    return () => subscription.remove();
  }, [active, queryClient]);

  return null;
}
