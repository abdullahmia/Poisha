import * as Crypto from 'expo-crypto';
import { ASYNC_STORAGE_KEYS, KEYWORD_HINTS, SENDER_HINTS } from '@/lib/constants';
import { isBackupBusy } from '@/lib/services/backup/backup-lock.util';
import { smsReader, type TRawSms } from '@/modules/expo-sms-reader/src';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TSmsItem } from '@/lib/types';
import { dateToISO } from '@/lib/utils/date.util';
import { parseSms } from '@/lib/utils/sms-parser.util';
import { loadEffectiveRules, type TEffectiveRules } from '@/lib/utils/sms-rules.util';

/**
 * Drives the inbox scan. Runs outside React — like `plan-notification.util.ts`
 * it is called from an AppState listener, so it reads AsyncStorage directly
 * rather than through hooks.
 */

const BATCH_SIZE = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Message text is cleared this long after arrival, decided or not. */
const BODY_RETENTION_MS = 30 * DAY_MS;

/** Resolved rows are deleted this long after arrival. Pending rows never are. */
const ROW_RETENTION_MS = 180 * DAY_MS;

export type TScanResult =
  | { ok: true; found: number }
  | { ok: false; reason: 'unavailable' | 'disabled' | 'no-permission' | 'busy' | 'failed' };

/**
 * Module-scope, mirroring `backup-lock.util.ts`. Two AppState `'active'` events
 * in quick succession are routine — a permission dialog closing produces one —
 * and overlapping scans would read the same cursor and race on it.
 */
let scanning = false;

export function isScanning(): boolean {
  return scanning;
}

/**
 * On first enable the cursor starts at *now*, so nothing historical is
 * detected. A cold scan of a multi-year inbox would otherwise greet the user
 * with hundreds of items to triage, most of them long since reconciled.
 * Deliberate backfill is a separate, explicit action.
 */
export async function initializeScanCursor(sinceMs: number = Date.now()): Promise<void> {
  await storage.setItem(ASYNC_STORAGE_KEYS.smsScanCursor, String(sinceMs));
}

export async function readScanCursor(): Promise<number | null> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.smsScanCursor);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export async function readLastScanAt(): Promise<number | null> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.smsLastScanAt);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function isEnabled(): Promise<boolean> {
  return (await storage.getItem(ASYNC_STORAGE_KEYS.smsEnabled)) === 'true';
}

/**
 * Turns one raw message into a queue row, or null if it isn't a transaction.
 * Exported so the live-receiver path and the scan path cannot drift.
 */
export function buildSmsItem(raw: TRawSms, effective: TEffectiveRules): TSmsItem | null {
  const parsed = parseSms(raw.sender, raw.body, effective.rules);
  if (!parsed) return null;

  // Credits are stored, not offered. Recording the hash is the entire point:
  // without a row, every scan would re-detect the same salary SMS forever.
  const isCredit = parsed.direction === 'credit';

  return {
    id: `si_${Crypto.randomUUID()}`,
    smsHash: raw.smsHash,
    receivedAt: raw.receivedAt,
    // Epoch ms is UTC; TEntry.date is a local calendar day. `dateToISO` reads
    // the local components, which is what every other date in the app means.
    date: dateToISO(new Date(raw.receivedAt)),
    sender: raw.sender,
    ruleId: parsed.ruleId,
    direction: parsed.direction,
    amount: parsed.amount,
    currency: parsed.currency,
    merchant: parsed.merchant,
    reference: parsed.reference,
    accountTail: parsed.accountTail,
    confidence: parsed.confidence,
    status: isCredit ? 'skipped' : 'pending',
    entryId: null,
    // Pre-selected from the rule that matched, so a bank the user has already
    // categorised once stops asking. Null when the rule has no default.
    categoryId: parsed.ruleId ? (effective.categoryByRuleId[parsed.ruleId] ?? null) : null,
    // A skipped item is never shown, so its text has no audience and no reason
    // to sit on disk.
    body: isCredit ? null : raw.body,
    createdAt: Date.now(),
  };
}

/** Yields to the UI thread between batches so a long scan doesn't freeze it. */
function yieldToUi(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Reads everything newer than the cursor, queues what parses, advances the
 * cursor as it goes.
 *
 * `sinceMsOverride` is the explicit backfill path (the "scan the last 90 days"
 * button). It does not move the cursor backwards permanently — the cursor only
 * ever advances, so a backfill cannot cause the next routine scan to re-read
 * everything in between.
 */
export async function runSmsScan(sinceMsOverride?: number): Promise<TScanResult> {
  if (!smsReader) return { ok: false, reason: 'unavailable' };
  if (!(await isEnabled())) return { ok: false, reason: 'disabled' };

  // A scan writing entries during a restore's wipe window is exactly the
  // half-applied state the backup lock exists to prevent.
  if (scanning || isBackupBusy()) return { ok: false, reason: 'busy' };

  // The user can revoke READ_SMS from system settings at any time, and Android
  // auto-revokes it for unused apps. Degrade visibly; never re-prompt from here.
  if (!smsReader.hasGrantedPermissions()) return { ok: false, reason: 'no-permission' };

  scanning = true;
  try {
    // Loaded once per scan, not per message: assembling it hits SQLite and
    // AsyncStorage and compiles every user regex.
    const effective = await loadEffectiveRules();

    const stored = await readScanCursor();
    // A missing cursor means the flag was set without going through enable.
    // Starting at `now` is the safe reading of "we have never scanned".
    const startCursor = sinceMsOverride ?? stored ?? Date.now();

    let cursor = startCursor;
    let highWater = stored ?? startCursor;
    let found = 0;

    for (;;) {
      const batch = await smsReader.scanInboxAsync({
        sinceMs: cursor,
        limit: BATCH_SIZE,
        senderHints: SENDER_HINTS,
        keywordHints: KEYWORD_HINTS,
      });
      if (batch.length === 0) break;

      const items = batch
        .map(raw => buildSmsItem(raw, effective))
        .filter((i): i is TSmsItem => i !== null);
      found += sqliteStorage.insertSmsItems(items);

      cursor = batch[batch.length - 1].receivedAt;
      if (cursor > highWater) {
        highWater = cursor;
        await storage.setItem(ASYNC_STORAGE_KEYS.smsScanCursor, String(highWater));
      }

      if (batch.length < BATCH_SIZE) break;
      await yieldToUi();
    }

    const now = Date.now();
    sqliteStorage.sweepSmsRetention(now - BODY_RETENTION_MS, now - ROW_RETENTION_MS);
    await storage.setItem(ASYNC_STORAGE_KEYS.smsLastScanAt, String(now));

    return { ok: true, found };
  } catch {
    // A scan failure is never worth surfacing as an error state — the next
    // foreground will try again, and the cursor only advanced over batches
    // that actually landed.
    return { ok: false, reason: 'failed' };
  } finally {
    scanning = false;
  }
}

/**
 * The live-receiver path. Shares `buildSmsItem` with the scan, so a message
 * arriving while the app is open is parsed exactly as it would be on next
 * launch. Does NOT touch the cursor: the inbox scan still owns that, and will
 * harmlessly re-encounter this message and dedup it on the hash.
 */
export async function ingestLiveSms(raw: TRawSms): Promise<number> {
  const effective = await loadEffectiveRules();
  const item = buildSmsItem(raw, effective);
  if (!item) return 0;
  return sqliteStorage.insertSmsItems([item]);
}

export async function clearAllSmsData(): Promise<void> {
  sqliteStorage.clearSmsItems();
  await initializeScanCursor();
  await storage.removeItem(ASYNC_STORAGE_KEYS.smsLastScanAt);
}

export const SMS_BACKFILL_DAYS = 90;

export function backfillCursor(days: number = SMS_BACKFILL_DAYS): number {
  return Date.now() - days * DAY_MS;
}
