/** One message as the native reader hands it over. No interpretation applied. */
export interface TRawSms {
  /** SHA-256 of sender + body + SMSC timestamp. The dedup key. */
  smsHash: string;
  sender: string;
  body: string;
  /** Epoch ms, from the provider's `date` column — the scan cursor's unit. */
  receivedAt: number;
}

export interface TScanOptions {
  /** Exclusive lower bound on the provider's `date`. */
  sinceMs: number;
  /** Clamped to 1..500 natively. */
  limit?: number;
  /**
   * Sender fragments and body keywords that survive the native pre-filter.
   * Passing neither returns everything, which is almost never what you want.
   */
  senderHints?: string[];
  keywordHints?: string[];
}

/**
 * Mirrored into native SharedPreferences, because the background receiver wakes
 * a process with no JS runtime and can't read the app's normal settings.
 * The hints and copy are passed from TS rather than hardcoded in Kotlin so they
 * stay fixable over the air.
 */
export interface TBackgroundAlertOptions {
  enabled: boolean;
  senderHints: string[];
  keywordHints: string[];
  title: string;
  body: string;
}

export type TSmsReaderEvents = {
  onSmsReceived: (payload: TRawSms) => void;
};
