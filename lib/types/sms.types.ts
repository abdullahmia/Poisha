/** Which way the money moved. `unknown` means no verb matched either set. */
export type TSmsDirection = 'debit' | 'credit' | 'unknown';

/**
 * - `pending`   waiting for the user in the review queue
 * - `accepted`  turned into an entry (`entryId` is set)
 * - `dismissed` the user rejected it
 * - `skipped`   detected but not offerable — credits, today. Kept rather than
 *               dropped so the dedup hash stops it being re-queued every scan.
 */
export type TSmsStatus = 'pending' | 'accepted' | 'dismissed' | 'skipped';

/** A message that made it through the parser and into the queue. */
export interface TSmsItem {
  id: string;
  /** SHA-256 of sender + body + timestamp, computed natively. The dedup key. */
  smsHash: string;
  /** Epoch ms, UTC. */
  receivedAt: number;
  /** YYYY-MM-DD in the device's local zone — the date the entry would carry. */
  date: string;
  sender: string;
  /** Preset key or user rule id; null when only the generic rule matched. */
  ruleId: string | null;
  direction: TSmsDirection;
  amount: number | null;
  /** ISO-4217-ish code ('BDT', 'USD') or '' when the message named no currency. */
  currency: string;
  merchant: string;
  reference: string;
  accountTail: string;
  confidence: number;
  status: TSmsStatus;
  entryId: string | null;
  categoryId: string | null;
  /** Raw message. NULLed once the item leaves `pending`, and by the retention sweep. */
  body: string | null;
  createdAt: number;
}

/**
 * A matching rule. Everything but `id`/`label`/`priority`/`sender` is optional —
 * unset fields fall back to the shared generic patterns, which is what lets a
 * bank nobody has written a preset for still parse.
 */
export interface TSmsRule {
  /** Stable slug for built-ins ('bkash'), `sr_<uuid>` for user rules. */
  id: string;
  label: string;
  builtin: boolean;
  /** Matched against the normalized sender. */
  sender: RegExp;
  /** Hard reject, checked before anything else. */
  exclude?: RegExp;
  debit?: RegExp;
  credit?: RegExp;
  /** Capture group 1 must be the numeric string. */
  amount?: RegExp;
  merchant?: RegExp;
  reference?: RegExp;
  accountTail?: RegExp;
  /** Forced when the message itself names no currency. */
  currency?: string;
  /** Higher wins. User rules outrank built-ins by default. */
  priority: number;
}

/**
 * A user-authored rule as stored. Patterns are strings here and compiled to
 * `TSmsRule` at scan time — a regex that no longer compiles must degrade to
 * "this rule is skipped", not take the whole scan down.
 */
export interface TSmsUserRule {
  id: string;
  label: string;
  senderPattern: string;
  /** Optional. Capture group 1 is the amount; blank falls back to the generic scan. */
  amountPattern: string;
  /** Optional. Any match rejects the message outright. */
  excludePattern: string;
  /** Forced when the message names no currency. */
  currency: string;
  /** Pre-selected on anything this rule matches. */
  categoryId: string | null;
  enabled: boolean;
  sortOrder: number;
}

/** Per-preset user state. Presets themselves are code; only this is stored. */
export interface TSmsPresetPref {
  enabled: boolean;
  categoryId: string | null;
}

/** What `parseSms` returns for a message worth queueing. */
export interface TSmsParseResult {
  ruleId: string | null;
  ruleLabel: string;
  direction: TSmsDirection;
  amount: number | null;
  currency: string;
  merchant: string;
  reference: string;
  accountTail: string;
  confidence: number;
}

/** One message as handed over by the native reader. */
export interface TSmsCandidate {
  smsHash: string;
  sender: string;
  body: string;
  /** Epoch ms — the provider's `date` column, used to advance the scan cursor. */
  receivedAt: number;
}
