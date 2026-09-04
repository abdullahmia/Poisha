import type { TCategory } from './category.types';
import type { TEntry } from './entry.types';

/** Bumped whenever the payload shape changes in a way older builds can't read. */
export const BACKUP_SCHEMA_VERSION = 1;

export interface TBackupSnapshot {
  schemaVersion: number;
  /** ISO 8601 — also the basis for the Drive filename, so it must sort lexically. */
  createdAt: string;
  app: { version: string; platform: 'ios' | 'android' };
  data: {
    entries: TEntry[];
    /** Includes archived categories — entries may still reference them. */
    categories: TCategory[];
    /** Only the keys in `BACKED_UP_SETTING_KEYS`, as raw AsyncStorage strings. */
    settings: Record<string, string | null>;
  };
}

export type TBackupFrequency = 'daily' | 'weekly' | 'manual';

export type TBackupStatus = 'ok' | 'failed';
