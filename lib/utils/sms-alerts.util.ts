import { ASYNC_STORAGE_KEYS, KEYWORD_HINTS, SENDER_HINTS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import { smsReader } from '@/modules/expo-sms-reader/src';

/**
 * Keeps the native background receiver in step with the app's settings.
 *
 * The receiver wakes a process with no JS runtime, so everything it needs —
 * whether it is on, which senders to care about, what the notification says —
 * has to be mirrored into SharedPreferences. Passing it from here rather than
 * hardcoding it in Kotlin is what keeps all of it shippable over the air.
 *
 * Runs outside React, like the other notification utils.
 */

const TITLE = 'New transaction detected';
const BODY = 'Open Poisha to review it.';

/** Defaults to ON under the master switch, matching the other sub-channels. */
export async function backgroundAlertsEnabled(): Promise<boolean> {
  return (await storage.getItem(ASYNC_STORAGE_KEYS.smsAlertsEnabled)) !== 'false';
}

/**
 * Call after any change to the SMS feature flag, the notification master
 * switch, or the alerts sub-channel. Cheap and idempotent — it writes five
 * SharedPreferences keys — so over-calling it costs nothing and under-calling
 * it leaves a receiver firing for a feature the user switched off.
 */
export async function syncBackgroundAlerts(): Promise<void> {
  if (!smsReader) return;

  try {
    // Every one of these has to be true for a notification to make sense:
    // the feature on, notifications permitted, and this channel wanted.
    const [smsOn, notificationsOn, alertsOn] = await Promise.all([
      storage.getItem(ASYNC_STORAGE_KEYS.smsEnabled),
      storage.getItem(ASYNC_STORAGE_KEYS.notificationsEnabled),
      backgroundAlertsEnabled(),
    ]);

    const enabled = smsOn === 'true' && notificationsOn === 'true' && alertsOn;

    await smsReader.setBackgroundAlertsAsync({
      enabled,
      senderHints: SENDER_HINTS,
      keywordHints: KEYWORD_HINTS,
      title: TITLE,
      body: BODY,
    });
  } catch {
    // Mirroring a preference must never break the mutation that triggered it.
  }
}
