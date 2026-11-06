import { ASYNC_STORAGE_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import { todayISO } from '@/lib/utils/date.util';
import { loadTodoPrefs } from '@/lib/utils/todo-notification.util';

/**
 * Rolls unfinished, past-due todos forward to today — opt-in via
 * `prefs.carryOverOverdue`, for people who want a due date to mean "still owed"
 * rather than "missed".
 *
 * Guarded by a once-per-day stamp because this edits the user's data, and
 * running it on every query refetch would rewrite `updatedAt` on a dozen rows
 * each time the list re-renders.
 *
 * Returns true when at least one todo moved, so the caller knows whether the
 * read it is about to do reflects a change worth broadcasting.
 */
export async function carryOverOverdueTodos(): Promise<boolean> {
  const today = todayISO();

  const lastRun = await storage.getItem(ASYNC_STORAGE_KEYS.todoCarryOverDate);
  if (lastRun === today) return false;

  const prefs = await loadTodoPrefs();
  if (!prefs.carryOverOverdue) {
    // Stamp anyway: with the preference off there is nothing to do today, and
    // stamping saves re-reading prefs on every subsequent refetch.
    await storage.setItem(ASYNC_STORAGE_KEYS.todoCarryOverDate, today);
    return false;
  }

  const overdue = sqliteStorage
    .loadTodos()
    .filter(t => !t.completed && t.dueDate !== null && t.dueDate < today);

  const now = new Date().toISOString();
  for (const todo of overdue) {
    sqliteStorage.upsertTodo({ ...todo, dueDate: today, updatedAt: now });
  }

  await storage.setItem(ASYNC_STORAGE_KEYS.todoCarryOverDate, today);
  return overdue.length > 0;
}
