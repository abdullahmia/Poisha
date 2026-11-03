import {
  requireOptionalNativeModule,
  type EventSubscription,
  type PermissionResponse,
} from 'expo-modules-core';
import type {
  TBackgroundAlertOptions,
  TRawSms,
  TScanOptions,
  TSmsReaderEvents,
} from './ExpoSmsReader.types';

export type { TBackgroundAlertOptions, TRawSms, TScanOptions, TSmsReaderEvents };

/**
 * The emitter surface is declared here rather than by extending
 * `NativeModule<TSmsReaderEvents>`: that exported alias resolves to `typeof
 * ExpoGlobal.NativeModule`, i.e. the constructor type, which carries none of
 * the instance methods. Spelling out the one event we use is both accurate and
 * immune to that alias changing.
 */
type TSmsReaderModule = {
  addListener<E extends keyof TSmsReaderEvents>(
    eventName: E,
    listener: TSmsReaderEvents[E]
  ): EventSubscription;
  removeAllListeners(eventName: keyof TSmsReaderEvents): void;

  isAvailable(): boolean;
  hasGrantedPermissions(): boolean;
  getPermissionsAsync(): Promise<PermissionResponse>;
  requestPermissionsAsync(): Promise<PermissionResponse>;
  scanInboxAsync(options: TScanOptions): Promise<TRawSms[]>;
  setBackgroundAlertsAsync(options: TBackgroundAlertOptions): Promise<void>;
};

/**
 * Null on iOS and web — the module declares `platforms: ["android"]`, so there
 * is nothing to bind to there.
 *
 * `requireOptionalNativeModule`, not `requireNativeModule`: the latter throws,
 * and this is imported at module scope from code that also runs on the iOS and
 * static-web builds. Every consumer must null-check.
 */
export const smsReader = requireOptionalNativeModule<TSmsReaderModule>('ExpoSmsReader');

/**
 * True only where the feature can actually work: Android, with a telephony
 * stack. Everything user-facing should branch on this rather than on
 * `Platform.OS`, so tablets get the explanatory copy instead of a dead toggle.
 */
export function isSmsReaderAvailable(): boolean {
  try {
    return smsReader?.isAvailable() ?? false;
  } catch {
    return false;
  }
}
