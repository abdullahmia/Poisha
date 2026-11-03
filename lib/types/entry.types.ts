/**
 * Where an entry came from. Provenance is kept on the entry itself rather than
 * inferred from a join, because the entries list renders it on every row and
 * the SMS queue it points at is deliberately excluded from backups.
 */
export type TEntrySource = 'manual' | 'sms' | 'import';

export interface TEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amounts: number[];
  note: string;
  categoryId: string | null;
  source: TEntrySource;
  /** `sms_items.id` when `source === 'sms'`; null otherwise. */
  sourceRef: string | null;
}

/**
 * `source`/`sourceRef` stay optional here on purpose: every existing caller
 * builds a draft without them and `useSaveEntry` fills in the manual default,
 * so adding provenance costs those call sites nothing.
 */
export type TDraft = Omit<TEntry, 'id' | 'source' | 'sourceRef'> & {
  id?: string;
  source?: TEntrySource;
  sourceRef?: string | null;
};
