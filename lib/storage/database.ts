import * as SQLite from 'expo-sqlite';
import type { Entry } from '@/lib/types/entry.type';

type EntryRow = { id: string; date: string; amounts: string; note: string };

export class LedgerDatabase {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('ledger.db');
    this.createTable();
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

  isEmpty(): boolean {
    const rows = this.db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM entries');
    return rows[0].count === 0;
  }

  loadEntries(): Entry[] {
    const rows = this.db.getAllSync<EntryRow>(
      'SELECT id, date, amounts, note FROM entries ORDER BY date DESC'
    );
    return rows.map(row => ({ ...row, amounts: JSON.parse(row.amounts) as number[] }));
  }

  upsertEntry(entry: Entry): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO entries (id, date, amounts, note) VALUES (?, ?, ?, ?)',
      entry.id,
      entry.date,
      JSON.stringify(entry.amounts),
      entry.note
    );
  }

  removeEntry(id: string): void {
    this.db.runSync('DELETE FROM entries WHERE id = ?', id);
  }
}
