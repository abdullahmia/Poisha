import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import type {
  TCategory,
  TEntry,
  TEntrySource,
  TSmsDirection,
  TSmsItem,
  TSmsStatus,
  TSmsUserRule,
} from '@/lib/types';

type EntryRow = {
  id: string;
  date: string;
  amounts: string;
  note: string;
  category_id: string | null;
  source: string | null;
  source_ref: string | null;
};
type CategoryRow = { id: string; name: string; icon: string; color: string; sortOrder: number; archived: number };

type SmsItemRow = {
  id: string;
  sms_hash: string;
  received_at: number;
  date: string;
  sender: string;
  rule_id: string | null;
  direction: string;
  amount: number | null;
  currency: string;
  merchant: string;
  reference: string;
  account_tail: string;
  confidence: number;
  status: string;
  entry_id: string | null;
  category_id: string | null;
  body: string | null;
  created_at: number;
};

type SmsRuleRow = {
  id: string;
  label: string;
  sender_pattern: string;
  amount_pattern: string;
  exclude_pattern: string;
  currency: string;
  category_id: string | null;
  enabled: number;
  sort_order: number;
};

/** Window for the secondary sender+body duplicate check. See `insertSmsItems`. */
const DUPLICATE_WINDOW_MS = 120_000;

/**
 * Window for the reference-collision check. Bounded rather than unlimited
 * because a short reference ("Ref 1234") can legitimately recur, and treating
 * a real transaction weeks later as a duplicate would silently lose it. A bank
 * that re-sends the same alert does so within minutes.
 */
const REFERENCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

class SqliteStorage {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('poisha.db');
    this.createTable();
    this.migrateAddCategoryColumn();
    this.migrateAddSourceColumns();
    this.createCategoriesTable();
    this.seedCategoriesIfEmpty(DEFAULT_CATEGORIES);
    this.createSmsTables();
  }

  private createTable(): void {
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS entries (
        id      TEXT PRIMARY KEY NOT NULL,
        date    TEXT NOT NULL,
        amounts TEXT NOT NULL,
        note    TEXT NOT NULL DEFAULT ''
      );`
    );
  }

  private migrateAddCategoryColumn(): void {
    try {
      this.db.execSync('ALTER TABLE entries ADD COLUMN category_id TEXT');
    } catch {
      // column already exists — no-op
    }
  }

  /**
   * Added separately rather than folded into `createTable`, because that
   * statement is `IF NOT EXISTS` and so never runs again on an existing
   * install. Deliberately left without a DEFAULT: rows written before this
   * migration read back as NULL, and `loadEntries` coalesces them to 'manual'.
   */
  private migrateAddSourceColumns(): void {
    for (const sql of [
      'ALTER TABLE entries ADD COLUMN source TEXT',
      'ALTER TABLE entries ADD COLUMN source_ref TEXT',
    ]) {
      try {
        this.db.execSync(sql);
      } catch {
        // column already exists — no-op
      }
    }
  }

  private createCategoriesTable(): void {
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS categories (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        icon       TEXT NOT NULL,
        color      TEXT NOT NULL,
        sortOrder  INTEGER NOT NULL DEFAULT 0,
        archived   INTEGER NOT NULL DEFAULT 0
      );`
    );
  }

  /**
   * The detected-transaction queue. Device-local by design: it is deliberately
   * excluded from the Drive backup, both because raw bank SMS in a third-party
   * cloud account is a different risk class from expense amounts, and because
   * `entry_id` would dangle the moment a restore replaced the entries table.
   */
  private createSmsTables(): void {
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS sms_items (
        id            TEXT PRIMARY KEY NOT NULL,
        sms_hash      TEXT NOT NULL UNIQUE,
        received_at   INTEGER NOT NULL,
        date          TEXT NOT NULL,
        sender        TEXT NOT NULL,
        rule_id       TEXT,
        direction     TEXT NOT NULL,
        amount        REAL,
        currency      TEXT NOT NULL DEFAULT '',
        merchant      TEXT NOT NULL DEFAULT '',
        reference     TEXT NOT NULL DEFAULT '',
        account_tail  TEXT NOT NULL DEFAULT '',
        confidence    REAL NOT NULL DEFAULT 0,
        status        TEXT NOT NULL DEFAULT 'pending',
        entry_id      TEXT,
        category_id   TEXT,
        body          TEXT,
        created_at    INTEGER NOT NULL
      );`
    );

    // `sms_hash` is already indexed by its UNIQUE constraint — don't add another.
    this.db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_sms_items_status_received ON sms_items(status, received_at DESC);'
    );
    this.db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_sms_items_ref ON sms_items(rule_id, reference);'
    );
    this.db.execSync(
      'CREATE INDEX IF NOT EXISTS idx_sms_items_sender_received ON sms_items(sender, received_at);'
    );

    // USER-authored rules only. The built-in presets deliberately live in
    // `sms-presets.constants.ts` instead: they are parser logic, and parser
    // logic has to be fixable with an `eas update` rather than a new install.
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS sms_rules (
        id              TEXT PRIMARY KEY NOT NULL,
        label           TEXT NOT NULL,
        sender_pattern  TEXT NOT NULL,
        amount_pattern  TEXT NOT NULL DEFAULT '',
        exclude_pattern TEXT NOT NULL DEFAULT '',
        currency        TEXT NOT NULL DEFAULT '',
        category_id     TEXT,
        enabled         INTEGER NOT NULL DEFAULT 1,
        sort_order      INTEGER NOT NULL DEFAULT 0
      );`
    );
    this.db.execSync('CREATE INDEX IF NOT EXISTS idx_sms_rules_enabled ON sms_rules(enabled, sort_order);');
  }

  private categoriesIsEmpty(): boolean {
    const rows = this.db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
    return rows[0].count === 0;
  }

  private seedCategoriesIfEmpty(defaults: TCategory[]): void {
    if (!this.categoriesIsEmpty()) return;
    for (const category of defaults) this.upsertCategory(category);
  }

  isEmpty(): boolean {
    const rows = this.db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM entries');
    return rows[0].count === 0;
  }

  loadEntries(): TEntry[] {
    const rows = this.db.getAllSync<EntryRow>(
      'SELECT id, date, amounts, note, category_id, source, source_ref FROM entries ORDER BY date DESC'
    );
    return rows.map(row => ({
      id: row.id,
      date: row.date,
      amounts: JSON.parse(row.amounts) as number[],
      note: row.note,
      categoryId: row.category_id,
      // Pre-migration rows have no source; they were all typed in by hand.
      source: (row.source ?? 'manual') as TEntrySource,
      sourceRef: row.source_ref,
    }));
  }

  upsertEntry(entry: TEntry): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO entries (id, date, amounts, note, category_id, source, source_ref) VALUES (?, ?, ?, ?, ?, ?, ?)',
      entry.id,
      entry.date,
      JSON.stringify(entry.amounts),
      entry.note,
      entry.categoryId,
      entry.source ?? 'manual',
      entry.sourceRef ?? null,
    );
  }

  removeEntry(id: string): void {
    this.db.runSync('DELETE FROM entries WHERE id = ?', id);
  }

  loadCategories(): TCategory[] {
    const rows = this.db.getAllSync<CategoryRow>(
      'SELECT id, name, icon, color, sortOrder, archived FROM categories WHERE archived = 0 ORDER BY sortOrder ASC'
    );
    return rows.map(row => ({ ...row, archived: row.archived === 1 }));
  }

  /**
   * Every category including archived ones. `loadCategories()` filters archived
   * rows out for pickers and chips, but a backup that did the same would orphan
   * every entry whose `category_id` points at an archived category.
   */
  loadAllCategories(): TCategory[] {
    const rows = this.db.getAllSync<CategoryRow>(
      'SELECT id, name, icon, color, sortOrder, archived FROM categories ORDER BY sortOrder ASC'
    );
    return rows.map(row => ({ ...row, archived: row.archived === 1 }));
  }

  upsertCategory(category: TCategory): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO categories (id, name, icon, color, sortOrder, archived) VALUES (?, ?, ?, ?, ?, ?)',
      category.id,
      category.name,
      category.icon,
      category.color,
      category.sortOrder,
      category.archived ? 1 : 0,
    );
  }

  archiveCategory(id: string): void {
    this.db.runSync('UPDATE categories SET archived = 1 WHERE id = ?', id);
  }

  reorderCategories(ids: string[]): void {
    ids.forEach((id, index) => {
      this.db.runSync('UPDATE categories SET sortOrder = ? WHERE id = ?', index, id);
    });
  }

  // ---------------------------------------------------------------------
  // SMS review queue
  // ---------------------------------------------------------------------

  private static toSmsItem(row: SmsItemRow): TSmsItem {
    return {
      id: row.id,
      smsHash: row.sms_hash,
      receivedAt: row.received_at,
      date: row.date,
      sender: row.sender,
      ruleId: row.rule_id,
      direction: row.direction as TSmsDirection,
      amount: row.amount,
      currency: row.currency,
      merchant: row.merchant,
      reference: row.reference,
      accountTail: row.account_tail,
      confidence: row.confidence,
      status: row.status as TSmsStatus,
      entryId: row.entry_id,
      categoryId: row.category_id,
      body: row.body,
      createdAt: row.created_at,
    };
  }

  /**
   * Inserts a scanned batch as one transaction, returning how many were new.
   *
   * Three layers of duplicate protection, because each catches a case the
   * others miss:
   *  1. `INSERT OR IGNORE` on the UNIQUE `sms_hash` — the same message seen by
   *     both the live receiver and a later inbox scan.
   *  2. A matching `(rule_id, reference)` — banks that send the same alert
   *     twice with different timestamps. Checked rather than constrained,
   *     because empty references would all collide.
   *  3. Same sender and body within two minutes — the fallback for OEMs that
   *     leave `date_sent` at 0, where the hash can legitimately differ.
   */
  insertSmsItems(items: TSmsItem[]): number {
    if (items.length === 0) return 0;

    let inserted = 0;

    this.db.withTransactionSync(() => {
      for (const item of items) {
        if (item.reference) {
          const refHit = this.db.getAllSync<{ count: number }>(
            'SELECT COUNT(*) as count FROM sms_items WHERE rule_id IS ? AND reference = ? AND ABS(received_at - ?) <= ?',
            item.ruleId,
            item.reference,
            item.receivedAt,
            REFERENCE_WINDOW_MS
          );
          if (refHit[0].count > 0) continue;
        }

        if (item.body) {
          const nearby = this.db.getAllSync<{ count: number }>(
            'SELECT COUNT(*) as count FROM sms_items WHERE sender = ? AND body = ? AND ABS(received_at - ?) <= ?',
            item.sender,
            item.body,
            item.receivedAt,
            DUPLICATE_WINDOW_MS
          );
          if (nearby[0].count > 0) continue;
        }

        const result = this.db.runSync(
          `INSERT OR IGNORE INTO sms_items
             (id, sms_hash, received_at, date, sender, rule_id, direction, amount, currency,
              merchant, reference, account_tail, confidence, status, entry_id, category_id, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          item.id,
          item.smsHash,
          item.receivedAt,
          item.date,
          item.sender,
          item.ruleId,
          item.direction,
          item.amount,
          item.currency,
          item.merchant,
          item.reference,
          item.accountTail,
          item.confidence,
          item.status,
          item.entryId,
          item.categoryId,
          item.body,
          item.createdAt
        );
        inserted += result.changes;
      }
    });

    return inserted;
  }

  loadSmsItems(status: TSmsStatus = 'pending'): TSmsItem[] {
    const rows = this.db.getAllSync<SmsItemRow>(
      'SELECT * FROM sms_items WHERE status = ? ORDER BY received_at DESC',
      status
    );
    return rows.map(SqliteStorage.toSmsItem);
  }

  countSmsItems(status: TSmsStatus = 'pending'): number {
    const rows = this.db.getAllSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sms_items WHERE status = ?',
      status
    );
    return rows[0].count;
  }

  /**
   * Resolving an item always clears `body`. The entry carries everything the
   * user needs from here on, and the promise made next to the settings toggle
   * is that the message text does not outlive the decision.
   */
  resolveSmsItem(id: string, status: Extract<TSmsStatus, 'accepted' | 'dismissed'>, entryId: string | null): void {
    this.db.runSync(
      'UPDATE sms_items SET status = ?, entry_id = ?, body = NULL WHERE id = ?',
      status,
      entryId,
      id
    );
  }

  /**
   * Keeps the table bounded with no user action: message text goes first, then
   * the resolved rows themselves. Pending items are never swept — an item the
   * user has not decided on is not ours to delete.
   */
  sweepSmsRetention(bodyCutoffMs: number, rowCutoffMs: number): void {
    this.db.withTransactionSync(() => {
      this.db.runSync('UPDATE sms_items SET body = NULL WHERE body IS NOT NULL AND received_at < ?', bodyCutoffMs);
      this.db.runSync("DELETE FROM sms_items WHERE status != 'pending' AND received_at < ?", rowCutoffMs);
    });
  }

  clearSmsItems(): void {
    this.db.execSync('DELETE FROM sms_items');
  }

  loadSmsRules(): TSmsUserRule[] {
    const rows = this.db.getAllSync<SmsRuleRow>('SELECT * FROM sms_rules ORDER BY sort_order ASC');
    return rows.map(row => ({
      id: row.id,
      label: row.label,
      senderPattern: row.sender_pattern,
      amountPattern: row.amount_pattern,
      excludePattern: row.exclude_pattern,
      currency: row.currency,
      categoryId: row.category_id,
      enabled: row.enabled === 1,
      sortOrder: row.sort_order,
    }));
  }

  upsertSmsRule(rule: TSmsUserRule): void {
    this.db.runSync(
      `INSERT OR REPLACE INTO sms_rules
         (id, label, sender_pattern, amount_pattern, exclude_pattern, currency, category_id, enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      rule.id,
      rule.label,
      rule.senderPattern,
      rule.amountPattern,
      rule.excludePattern,
      rule.currency,
      rule.categoryId,
      rule.enabled ? 1 : 0,
      rule.sortOrder
    );
  }

  /**
   * Hard delete, unlike categories' soft archive. Nothing references a rule —
   * `sms_items.rule_id` is a label, not a foreign key — so there is no row to
   * orphan and no reason to keep the record around.
   */
  removeSmsRule(id: string): void {
    this.db.runSync('DELETE FROM sms_rules WHERE id = ?', id);
  }

  replaceSmsRules(rules: TSmsUserRule[]): void {
    this.db.withTransactionSync(() => {
      this.db.execSync('DELETE FROM sms_rules');
      for (const rule of rules) this.upsertSmsRule(rule);
    });
  }

  /**
   * Wipe and refill both tables as one atomic unit — the restore path.
   *
   * Deliberately not reused by CSV import, which keeps its existing row-by-row
   * Replace. A half-applied restore is the one state a backup feature must
   * never produce, so this either lands whole or rolls back.
   *
   * Note `withTransactionSync` blocks the JS thread for the duration; callers
   * are expected to show a blocking modal rather than pretend otherwise.
   */
  replaceAll(entries: TEntry[], categories: TCategory[]): void {
    this.db.withTransactionSync(() => {
      this.db.execSync('DELETE FROM entries');
      this.db.execSync('DELETE FROM categories');

      // The SMS queue is device-local and its `entry_id`s all point into the
      // table being replaced. Leaving it would mean dangling links plus a queue
      // of transactions the restored entries already account for. The caller is
      // responsible for also resetting the scan cursor — see `applySnapshot`.
      this.db.execSync('DELETE FROM sms_items');

      // Categories first: entries reference them, and a caller inspecting the
      // db mid-transaction should never see entries without their categories.
      // An empty incoming list falls back to the defaults, because seeding
      // otherwise only happens in the constructor — i.e. not until next launch.
      const restored = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
      for (const category of restored) this.upsertCategory(category);
      for (const entry of entries) this.upsertEntry(entry);
    });
  }
}

export const sqliteStorage = new SqliteStorage();
