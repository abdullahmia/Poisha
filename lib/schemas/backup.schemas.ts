import { z } from 'zod';
import { BACKUP_SCHEMA_VERSION, type TBackupSnapshot } from '@/lib/types';

const entrySchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  amounts: z.array(z.number()),
  note: z.string(),
  categoryId: z.string().nullable(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  icon: z.string(),
  color: z.string(),
  sortOrder: z.number(),
  archived: z.boolean(),
});

const todoListSchema = categorySchema;

const todoPrioritySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  level: z.number(),
  sortOrder: z.number(),
});

const todoTagSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  sortOrder: z.number(),
});

const todoRepeatSchema = z.object({
  unit: z.enum(['day', 'week', 'month', 'year']),
  interval: z.number().int().positive(),
  weekdays: z.array(z.number().int().min(0).max(6)),
  anchor: z.enum(['dueDate', 'completion']),
});

const subtaskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  done: z.boolean(),
});

const todoSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  note: z.string(),
  listId: z.string().nullable(),
  priorityId: z.string().nullable(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD').nullable(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, 'dueTime must be HH:MM').nullable(),
  repeat: todoRepeatSchema.nullable(),
  reminderMinutesBefore: z.number().nullable(),
  tagIds: z.array(z.string()),
  subtasks: z.array(subtaskSchema),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  sortOrder: z.number(),
});

// Optional, not defaulted: a v1 backup carries no todo data at all, and the
// restore path distinguishes "absent, leave local todos alone" from "present
// but empty, wipe them" — a `.default({...})` here would collapse the two.
const todoDataSchema = z.object({
  todos: z.array(todoSchema),
  lists: z.array(todoListSchema),
  priorities: z.array(todoPrioritySchema),
  tags: z.array(todoTagSchema),
});

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

export const backupSnapshotSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    createdAt: z.string().min(1),
    app: z.object({
      version: z.string(),
      platform: z.enum(['ios', 'android']),
    }),
    data: z.object({
      entries: z.array(entrySchema),
      categories: z.array(categorySchema),
      todo: todoDataSchema.optional(),
      settings: z.record(z.string(), z.string().nullable()),
    }),
  })
  .superRefine((snapshot, ctx) => {
    const { entries, categories, todo } = snapshot.data;

    // `upsertEntry`/`upsertCategory` use INSERT OR REPLACE, so a duplicate id
    // inside one payload silently destroys a row instead of erroring. It also
    // makes the entries-list sort tie-break non-deterministic and produces
    // duplicate React keys. Refuse the file rather than restore it lossily.
    const dupeEntries = duplicates(entries.map(e => e.id));
    if (dupeEntries.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['data', 'entries'],
        message: `duplicate entry ids: ${dupeEntries.slice(0, 5).join(', ')}`,
      });
    }

    const dupeCategories = duplicates(categories.map(c => c.id));
    if (dupeCategories.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['data', 'categories'],
        message: `duplicate category ids: ${dupeCategories.slice(0, 5).join(', ')}`,
      });
    }

    // There is no FOREIGN KEY on entries.category_id, so a dangling reference
    // restores silently and renders as an entry with no category chip.
    const known = new Set(categories.map(c => c.id));
    const dangling = [
      ...new Set(
        entries
          .map(e => e.categoryId)
          .filter((id): id is string => id !== null && !known.has(id))
      ),
    ];
    if (dangling.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['data', 'entries'],
        message: `entries reference unknown categories: ${dangling.slice(0, 5).join(', ')}`,
      });
    }

    if (!todo) return;

    // Same reasoning as the entries/categories checks above: every todo table
    // is written with INSERT OR REPLACE, so a duplicate id inside one payload
    // destroys a row instead of erroring, and produces duplicate React keys.
    for (const [label, ids] of [
      ['todo', todo.todos.map(t => t.id)],
      ['todo list', todo.lists.map(l => l.id)],
      ['todo priority', todo.priorities.map(p => p.id)],
      ['todo tag', todo.tags.map(t => t.id)],
    ] as const) {
      const dupes = duplicates([...ids]);
      if (dupes.length > 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['data', 'todo'],
          message: `duplicate ${label} ids: ${dupes.slice(0, 5).join(', ')}`,
        });
      }
    }

    // Dangling list/priority/tag references are deliberately *not* refused.
    // Unlike an entry without its category, a todo resolves a missing list to
    // Inbox and a missing priority to none at read time, so the file still
    // restores to something coherent — refusing it would cost the user every
    // todo over a cosmetic inconsistency.
    const duplicateSubtasks = todo.todos.filter(t => duplicates(t.subtasks.map(s => s.id)).length > 0);
    if (duplicateSubtasks.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['data', 'todo'],
        message: `todos with duplicate subtask ids: ${duplicateSubtasks.slice(0, 5).map(t => t.id).join(', ')}`,
      });
    }
  });

export type TBackupParseResult =
  | { ok: true; snapshot: TBackupSnapshot }
  | { ok: false; reason: 'too-new' | 'invalid'; message: string };

/**
 * Validates a downloaded backup before any of it reaches SQLite.
 *
 * Separates "written by a newer build" from "corrupt", because they need
 * different messages — one asks the user to update Poisha, the other tells
 * them the file is unusable.
 */
export function parseBackupSnapshot(raw: unknown): TBackupParseResult {
  const parsed = backupSnapshotSchema.safeParse(raw);

  if (!parsed.success) {
    // A too-new payload will usually also fail shape validation, so check the
    // version off the raw object rather than the parsed one.
    const version = (raw as { schemaVersion?: unknown })?.schemaVersion;
    if (typeof version === 'number' && version > BACKUP_SCHEMA_VERSION) {
      return {
        ok: false,
        reason: 'too-new',
        message: 'This backup was made by a newer version of Poisha. Update the app to restore it.',
      };
    }
    return { ok: false, reason: 'invalid', message: parsed.error.issues[0]?.message ?? 'Backup file is not valid.' };
  }

  if (parsed.data.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: 'too-new',
      message: 'This backup was made by a newer version of Poisha. Update the app to restore it.',
    };
  }

  return { ok: true, snapshot: parsed.data };
}
