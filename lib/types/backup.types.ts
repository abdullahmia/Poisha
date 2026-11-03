import type { TCategory } from './category.types';
import type { TEntry } from './entry.types';
import type { TSmsUserRule } from './sms.types';

/**
 * Bumped whenever the payload shape changes in a way older builds can't read.
 *
 * v2 added `source`/`sourceRef` to entries and `smsRules` to the payload. v1
 * payloads still restore — every added field carries a schema default — but a
 * v2 payload is rejected by a v1 build through the existing `too-new` branch
 * in `parseBackupSnapshot`.
 */
export const BACKUP_SCHEMA_VERSION = 2;

export interface TBackupSnapshot {
  schemaVersion: number;
  /** ISO 8601 — also the basis for the Drive filename, so it must sort lexically. */
  createdAt: string;
  app: { version: string; platform: 'ios' | 'android' };
  data: {
    entries: TEntry[];
    /** Includes archived categories — entries may still reference them. */
    categories: TCategory[];
    /**
     * User-authored SMS rules. The detected-transaction queue is deliberately
     * NOT here: it is device-local, regenerable, and holds raw bank messages
     * that have no business in a third-party cloud account.
     */
    smsRules: TSmsUserRule[];
    /** Only the keys in `BACKED_UP_SETTING_KEYS`, as raw AsyncStorage strings. */
    settings: Record<string, string | null>;
  };
}

export type TBackupFrequency = 'daily' | 'weekly' | 'manual';

export type TBackupStatus = 'ok' | 'failed';
