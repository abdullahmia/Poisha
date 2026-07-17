import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import type { TCategory, TEntry } from '@/lib/types';

type EntryRow = { id: string; date: string; amounts: string; note: string; category_id: string | null };
type CategoryRow = { id: string; name: string; icon: string; color: string; sortOrder: number; archived: number };

class SqliteStorage {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('poisha.db');
    this.createTable();
    this.migrateAddCategoryColumn();
    this.createCategoriesTable();
    this.seedCategoriesIfEmpty(DEFAULT_CATEGORIES);
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
      'SELECT id, date, amounts, note, category_id FROM entries ORDER BY date DESC'
    );
    return rows.map(row => ({
      id: row.id,
      date: row.date,
      amounts: JSON.parse(row.amounts) as number[],
      note: row.note,
      categoryId: row.category_id,
    }));
  }

  upsertEntry(entry: TEntry): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO entries (id, date, amounts, note, category_id) VALUES (?, ?, ?, ?, ?)',
      entry.id,
      entry.date,
      JSON.stringify(entry.amounts),
      entry.note,
      entry.categoryId,
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
}

export const sqliteStorage = new SqliteStorage();
