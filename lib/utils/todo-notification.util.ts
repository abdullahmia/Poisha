import * as Notifications from 'expo-notifications';
import { ASYNC_STORAGE_KEYS, DEFAULT_TODO_PREFS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TTodo, TTodoPrefs } from '@/lib/types';
import { isoToDate } from '@/lib/utils/date.util';

// Same self-identifying tag trick as the Plan Mode reminders: every
// notification this module schedules carries it, so the module can find and
// cancel its own without persisting identifiers that would go stale the moment
// a todo is edited, completed, or deleted.
const TODO_DUE = 'todo-due';

// iOS caps pending local notifications at 64 app-wide, and Plan Mode already
// claims up to 20 of them. Twenty more leaves comfortable headroom, and every
// resume re-syncs, so later reminders roll into range as nearer ones fire.
const MAX_SCHEDULED = 20;

export async function loadTodoPrefs(): Promise<TTodoPrefs> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.todoPrefs);
  if (!raw) return DEFAULT_TODO_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<TTodoPrefs>;
    // Spread over the defaults rather than replacing them: a blob saved before
    // a preference existed must adopt that preference's default, not undefined.
    return {
      ...DEFAULT_TODO_PREFS,
      ...parsed,
      cardFields: { ...DEFAULT_TODO_PREFS.cardFields, ...(parsed.cardFields ?? {}) },
    };
  } catch {
    return DEFAULT_TODO_PREFS;
  }
}

async function cancelTodoDueNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === TODO_DUE) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

/** The instant a todo's reminder should fire, or null if it has no due date. */
export function reminderInstant(todo: TTodo, defaultTime: string): Date | null {
  if (todo.dueDate === null || todo.reminderMinutesBefore === null) return null;

  const [hours, minutes] = (todo.dueTime ?? defaultTime).split(':').map(Number);
  const at = isoToDate(todo.dueDate);
  at.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  at.setMinutes(at.getMinutes() - todo.reminderMinutesBefore);
  return at;
}

function buildBody(todo: TTodo): string {
  const subtasks = todo.subtasks.length;
  if (subtasks > 0) {
    const done = todo.subtasks.filter(s => s.done).length;
    return `${done}/${subtasks} subtasks done${todo.note.trim() ? ` · ${todo.note.trim()}` : ''}`;
  }
  return todo.note.trim() || 'Tap to open your todo list.';
}

/**
 * Cancels and re-schedules every todo reminder from current state. Like the
 * Plan Mode equivalent it always rebuilds the whole schedule rather than
 * patching it, so it self-heals after an edit, a delete, a restore, a
 * preference change, or a timezone shift.
 *
 * Best-effort throughout: a notification failure must never interrupt the
 * mutation that triggered it, which is why call sites fire it without awaiting.
 */
export async function syncTodoReminders(): Promise<void> {
  try {
    await cancelTodoDueNotifications();

    const notificationsEnabled = await storage.getItem(ASYNC_STORAGE_KEYS.notificationsEnabled);
    if (notificationsEnabled !== 'true') return;

    // Sub-channel under the master permission. Absent means on — the same
    // default the budget and plan channels use.
    const todoReminders = await storage.getItem(ASYNC_STORAGE_KEYS.todoRemindersEnabled);
    if (todoReminders === 'false') return;

    const todoEnabled = await storage.getItem(ASYNC_STORAGE_KEYS.todoEnabled);
    if (todoEnabled !== 'true') return;

    const prefs = await loadTodoPrefs();
    const now = Date.now();

    const pending = sqliteStorage
      .loadTodos()
      .filter(t => !t.completed)
      .map(todo => ({ todo, at: reminderInstant(todo, prefs.defaultReminderTime) }))
      .filter((x): x is { todo: TTodo; at: Date } => x.at !== null && x.at.getTime() > now)
      .sort((a, b) => a.at.getTime() - b.at.getTime())
      .slice(0, MAX_SCHEDULED);

    for (const { todo, at } of pending) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: todo.title,
          body: buildBody(todo),
          sound: true,
          data: { type: TODO_DUE, todoId: todo.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    }
  } catch {
    // Best-effort: reminder scheduling must not break todo mutations.
  }
}
