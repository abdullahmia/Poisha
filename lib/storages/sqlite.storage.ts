import * as SQLite from 'expo-sqlite';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TODO_LISTS,
  DEFAULT_TODO_PRIORITIES,
  DEFAULT_TODO_TAGS,
} from '@/lib/constants';
import type {
  TCategory,
  TEntry,
  TSubtask,
  TTodo,
  TTodoList,
  TTodoPriority,
  TTodoRepeat,
  TTodoTag,
} from '@/lib/types';

type EntryRow = { id: string; date: string; amounts: string; note: string; category_id: string | null };
type CategoryRow = { id: string; name: string; icon: string; color: string; sortOrder: number; archived: number };

type TodoRow = {
  id: string;
  title: string;
  note: string;
  list_id: string | null;
  priority_id: string | null;
  due_date: string | null;
  due_time: string | null;
  repeat: string | null;
  reminder_minutes: number | null;
  tag_ids: string;
  subtasks: string;
  completed: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sortOrder: number;
};
type TodoListRow = CategoryRow;
type TodoPriorityRow = { id: string; name: string; color: string; level: number; sortOrder: number };
type TodoTagRow = { id: string; name: string; color: string; sortOrder: number };

/**
 * JSON columns (`repeat`, `tag_ids`, `subtasks`) are parsed defensively rather
 * than trusted: a row hand-edited outside the app, or written by a build whose
 * shape has since changed, must degrade to an empty value instead of throwing
 * inside a list render that has no way to recover.
 */
function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

class SqliteStorage {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('poisha.db');
    this.createTable();
    this.migrateAddCategoryColumn();
    this.createCategoriesTable();
    this.seedCategoriesIfEmpty(DEFAULT_CATEGORIES);
    this.createTodoTables();
    this.seedTodoTaxonomyIfEmpty();
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

  // ─── Todo ────────────────────────────────────────────────────────────────

  private createTodoTables(): void {
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS todo_lists (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        icon       TEXT NOT NULL,
        color      TEXT NOT NULL,
        sortOrder  INTEGER NOT NULL DEFAULT 0,
        archived   INTEGER NOT NULL DEFAULT 0
      );`
    );
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS todo_priorities (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL,
        level      INTEGER NOT NULL DEFAULT 0,
        sortOrder  INTEGER NOT NULL DEFAULT 0
      );`
    );
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS todo_tags (
        id         TEXT PRIMARY KEY NOT NULL,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL,
        sortOrder  INTEGER NOT NULL DEFAULT 0
      );`
    );
    // list_id / priority_id are nullable and carry no FOREIGN KEY, matching
    // entries.category_id: deleting a list must not cascade away the user's
    // todos. Reads resolve a dangling id to Inbox / no priority instead.
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS todos (
        id               TEXT PRIMARY KEY NOT NULL,
        title            TEXT NOT NULL,
        note             TEXT NOT NULL DEFAULT '',
        list_id          TEXT,
        priority_id      TEXT,
        due_date         TEXT,
        due_time         TEXT,
        repeat           TEXT,
        reminder_minutes INTEGER,
        tag_ids          TEXT NOT NULL DEFAULT '[]',
        subtasks         TEXT NOT NULL DEFAULT '[]',
        completed        INTEGER NOT NULL DEFAULT 0,
        completed_at     TEXT,
        created_at       TEXT NOT NULL,
        updated_at       TEXT NOT NULL,
        sortOrder        INTEGER NOT NULL DEFAULT 0
      );`
    );
    // Every list read filters on completion and orders by sortOrder.
    this.db.execSync('CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos (completed, sortOrder);');
    this.db.execSync(
      `CREATE TABLE IF NOT EXISTS todo_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );`
    );
  }

  private todoSeeded(): boolean {
    const rows = this.db.getAllSync<{ value: string }>(
      "SELECT value FROM todo_meta WHERE key = 'seeded'"
    );
    return rows.length > 0;
  }

  private markTodoSeeded(): void {
    this.db.runSync("INSERT OR REPLACE INTO todo_meta (key, value) VALUES ('seeded', '1')");
  }

  /**
   * Seeds starter lists, priorities and tags exactly once, tracked by a marker
   * row rather than by "is the table empty". Emptiness is the wrong test here:
   * priorities and tags are hard-deleted, so a user who clears them all out
   * would find them resurrected on the next cold launch.
   */
  private seedTodoTaxonomyIfEmpty(): void {
    if (this.todoSeeded()) return;
    for (const list of DEFAULT_TODO_LISTS) this.upsertTodoList(list);
    for (const priority of DEFAULT_TODO_PRIORITIES) this.upsertTodoPriority(priority);
    for (const tag of DEFAULT_TODO_TAGS) this.upsertTodoTag(tag);
    this.markTodoSeeded();
  }

  private toTodo(row: TodoRow): TTodo {
    return {
      id: row.id,
      title: row.title,
      note: row.note,
      listId: row.list_id,
      priorityId: row.priority_id,
      dueDate: row.due_date,
      dueTime: row.due_time,
      repeat: parseJson<TTodoRepeat | null>(row.repeat, null),
      reminderMinutesBefore: row.reminder_minutes,
      tagIds: parseJson<string[]>(row.tag_ids, []),
      subtasks: parseJson<TSubtask[]>(row.subtasks, []),
      completed: row.completed === 1,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sortOrder: row.sortOrder,
    };
  }

  loadTodos(): TTodo[] {
    const rows = this.db.getAllSync<TodoRow>('SELECT * FROM todos ORDER BY sortOrder ASC, created_at ASC');
    return rows.map(row => this.toTodo(row));
  }

  upsertTodo(todo: TTodo): void {
    this.db.runSync(
      `INSERT OR REPLACE INTO todos
        (id, title, note, list_id, priority_id, due_date, due_time, repeat, reminder_minutes,
         tag_ids, subtasks, completed, completed_at, created_at, updated_at, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      todo.id,
      todo.title,
      todo.note,
      todo.listId,
      todo.priorityId,
      todo.dueDate,
      todo.dueTime,
      todo.repeat ? JSON.stringify(todo.repeat) : null,
      todo.reminderMinutesBefore,
      JSON.stringify(todo.tagIds),
      JSON.stringify(todo.subtasks),
      todo.completed ? 1 : 0,
      todo.completedAt,
      todo.createdAt,
      todo.updatedAt,
      todo.sortOrder,
    );
  }

  removeTodo(id: string): void {
    this.db.runSync('DELETE FROM todos WHERE id = ?', id);
  }

  /** Bulk delete behind "Clear completed" — one transaction, one invalidation. */
  removeCompletedTodos(): number {
    const result = this.db.runSync('DELETE FROM todos WHERE completed = 1');
    return result.changes;
  }

  reorderTodos(ids: string[]): void {
    this.db.withTransactionSync(() => {
      ids.forEach((id, index) => {
        this.db.runSync('UPDATE todos SET sortOrder = ? WHERE id = ?', index, id);
      });
    });
  }

  /** Highest sortOrder + 1, so a new todo lands at the end of manual order. */
  nextTodoSortOrder(): number {
    const rows = this.db.getAllSync<{ max: number | null }>('SELECT MAX(sortOrder) as max FROM todos');
    return (rows[0]?.max ?? -1) + 1;
  }

  loadTodoLists(): TTodoList[] {
    const rows = this.db.getAllSync<TodoListRow>(
      'SELECT id, name, icon, color, sortOrder, archived FROM todo_lists WHERE archived = 0 ORDER BY sortOrder ASC'
    );
    return rows.map(row => ({ ...row, archived: row.archived === 1 }));
  }

  upsertTodoList(list: TTodoList): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO todo_lists (id, name, icon, color, sortOrder, archived) VALUES (?, ?, ?, ?, ?, ?)',
      list.id,
      list.name,
      list.icon,
      list.color,
      list.sortOrder,
      list.archived ? 1 : 0,
    );
  }

  /**
   * Archives the list and moves its todos to Inbox in one transaction. Leaving
   * them pointing at an archived list would hide them from every list filter
   * while still counting them in totals — present but unreachable.
   */
  archiveTodoList(id: string): void {
    this.db.withTransactionSync(() => {
      this.db.runSync('UPDATE todo_lists SET archived = 1 WHERE id = ?', id);
      this.db.runSync('UPDATE todos SET list_id = NULL WHERE list_id = ?', id);
    });
  }

  reorderTodoLists(ids: string[]): void {
    this.db.withTransactionSync(() => {
      ids.forEach((id, index) => {
        this.db.runSync('UPDATE todo_lists SET sortOrder = ? WHERE id = ?', index, id);
      });
    });
  }

  loadTodoPriorities(): TTodoPriority[] {
    return this.db.getAllSync<TodoPriorityRow>(
      'SELECT id, name, color, level, sortOrder FROM todo_priorities ORDER BY sortOrder ASC'
    );
  }

  upsertTodoPriority(priority: TTodoPriority): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO todo_priorities (id, name, color, level, sortOrder) VALUES (?, ?, ?, ?, ?)',
      priority.id,
      priority.name,
      priority.color,
      priority.level,
      priority.sortOrder,
    );
  }

  /** Hard delete — priorities carry no history worth preserving. Todos holding
   *  the id fall back to "no priority" at read time. */
  removeTodoPriority(id: string): void {
    this.db.withTransactionSync(() => {
      this.db.runSync('DELETE FROM todo_priorities WHERE id = ?', id);
      this.db.runSync('UPDATE todos SET priority_id = NULL WHERE priority_id = ?', id);
    });
  }

  reorderTodoPriorities(ids: string[]): void {
    this.db.withTransactionSync(() => {
      ids.forEach((id, index) => {
        this.db.runSync('UPDATE todo_priorities SET sortOrder = ? WHERE id = ?', index, id);
      });
    });
  }

  loadTodoTags(): TTodoTag[] {
    return this.db.getAllSync<TodoTagRow>(
      'SELECT id, name, color, sortOrder FROM todo_tags ORDER BY sortOrder ASC'
    );
  }

  upsertTodoTag(tag: TTodoTag): void {
    this.db.runSync(
      'INSERT OR REPLACE INTO todo_tags (id, name, color, sortOrder) VALUES (?, ?, ?, ?)',
      tag.id,
      tag.name,
      tag.color,
      tag.sortOrder,
    );
  }

  /**
   * Deletes the tag and strips its id out of every todo's `tag_ids` JSON. The
   * rewrite runs in JS because the ids live in a JSON array, not a join table —
   * a cost paid once per deletion, against a table the user hand-curates.
   */
  removeTodoTag(id: string): void {
    const affected = this.db
      .getAllSync<TodoRow>('SELECT * FROM todos WHERE tag_ids LIKE ?', `%"${id}"%`)
      .map(row => this.toTodo(row))
      .filter(todo => todo.tagIds.includes(id));

    this.db.withTransactionSync(() => {
      this.db.runSync('DELETE FROM todo_tags WHERE id = ?', id);
      for (const todo of affected) {
        this.db.runSync(
          'UPDATE todos SET tag_ids = ? WHERE id = ?',
          JSON.stringify(todo.tagIds.filter(t => t !== id)),
          todo.id,
        );
      }
    });
  }
}

export const sqliteStorage = new SqliteStorage();
