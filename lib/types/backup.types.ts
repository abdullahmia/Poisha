import type { TCategory } from './category.types';
import type { TEntry } from './entry.types';
import type { TTodo, TTodoList, TTodoPriority, TTodoTag } from './todo.types';

/**
 * Bumped whenever the payload shape changes in a way older builds can't read.
 *
 * v2 added the Todo module's four tables. The addition is backward-compatible
 * by design — `todo` is optional, so a v1 file still restores — but the bump
 * matters in the other direction: a v2 file opened by a v1 build would silently
 * drop every todo, and the version check refuses it instead.
 */
export const BACKUP_SCHEMA_VERSION = 2;

/** Every todo-domain table, as one unit. Absent in v1 snapshots. */
export interface TBackupTodoData {
  todos: TTodo[];
  /** Includes archived lists — todos may still reference them. */
  lists: TTodoList[];
  priorities: TTodoPriority[];
  tags: TTodoTag[];
}

export interface TBackupSnapshot {
  schemaVersion: number;
  /** ISO 8601 — also the basis for the Drive filename, so it must sort lexically. */
  createdAt: string;
  app: { version: string; platform: 'ios' | 'android' };
  data: {
    entries: TEntry[];
    /** Includes archived categories — entries may still reference them. */
    categories: TCategory[];
    /** Absent in v1 backups, which predate the Todo module entirely. */
    todo?: TBackupTodoData;
    /** Only the keys in `BACKED_UP_SETTING_KEYS`, as raw AsyncStorage strings. */
    settings: Record<string, string | null>;
  };
}

export type TBackupFrequency = 'daily' | 'weekly' | 'manual';

export type TBackupStatus = 'ok' | 'failed';
