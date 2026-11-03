import { useState } from 'react';
import type { TSubtask, TTodo, TTodoDraft, TTodoPrefs, TTodoRepeat } from '@/lib/types';

export interface TTodoFormState {
  title: string;
  note: string;
  listId: string | null;
  priorityId: string | null;
  tagIds: string[];
  dueDate: string | null;
  dueTime: string | null;
  repeat: TTodoRepeat | null;
  reminderMinutesBefore: number | null;
  subtasks: TSubtask[];
}

function initialState(todo: TTodo | null, prefs: TTodoPrefs, defaultDate: string | null): TTodoFormState {
  if (todo) {
    return {
      title: todo.title,
      note: todo.note,
      listId: todo.listId,
      priorityId: todo.priorityId,
      tagIds: todo.tagIds,
      dueDate: todo.dueDate,
      dueTime: todo.dueTime,
      repeat: todo.repeat,
      reminderMinutesBefore: todo.reminderMinutesBefore,
      subtasks: todo.subtasks,
    };
  }

  return {
    title: '',
    note: '',
    // The defaults are what make the Todo module feel like the user's own:
    // someone who lives in one list and one priority never touches either field.
    listId: prefs.defaultListId,
    priorityId: prefs.defaultPriorityId,
    tagIds: [],
    dueDate: defaultDate,
    dueTime: null,
    repeat: null,
    // A reminder is only meaningful with a date to hang it on.
    reminderMinutesBefore: defaultDate ? prefs.defaultReminderMinutesBefore : null,
    subtasks: [],
  };
}

/**
 * Local state for the add/edit sheet.
 *
 * The form resets exactly when the sheet is opened on a different subject — not
 * on every render, which would discard typing, and not never, which would show
 * the previous todo's values the next time the sheet opens.
 *
 * The reset happens during render rather than in an effect: React restarts the
 * render with the new state before anything commits, so the sheet never paints
 * a frame of the previous todo's values. An effect would have to paint that
 * frame first, then correct it.
 *
 * `prefs` deliberately isn't part of the reset key — a preference changing while
 * the sheet is open must not wipe what has already been typed into it.
 */
export function useTodoForm(todo: TTodo | null, prefs: TTodoPrefs, open: boolean, defaultDate: string | null = null) {
  const [state, setState] = useState<TTodoFormState>(() => initialState(todo, prefs, defaultDate));

  const subject = `${open ? 'open' : 'closed'}:${todo?.id ?? 'new'}:${defaultDate ?? ''}`;
  const [lastSubject, setLastSubject] = useState(subject);

  if (subject !== lastSubject) {
    setLastSubject(subject);
    // Only on the way *in*. Rebuilding on close would be wasted work, and the
    // closing animation would play over a form that had already blanked itself.
    if (open) setState(initialState(todo, prefs, defaultDate));
  }

  function set<K extends keyof TTodoFormState>(key: K, value: TTodoFormState[K]) {
    setState(prev => ({ ...prev, [key]: value }));
  }

  function setDueDate(next: string | null) {
    setState(prev => ({
      ...prev,
      dueDate: next,
      // Clearing the date takes the time, the reminder and the repeat with it:
      // all three are measured from a due date and mean nothing without one.
      dueTime: next === null ? null : prev.dueTime,
      reminderMinutesBefore:
        next === null ? null : prev.reminderMinutesBefore ?? prefs.defaultReminderMinutesBefore,
      repeat: next === null ? null : prev.repeat,
    }));
  }

  function toggleTag(id: string) {
    setState(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id) ? prev.tagIds.filter(t => t !== id) : [...prev.tagIds, id],
    }));
  }

  const canSave = state.title.trim().length > 0;

  function toDraft(existing: TTodo | null): TTodoDraft {
    return {
      ...(existing ? { id: existing.id } : {}),
      title: state.title.trim(),
      note: state.note.trim(),
      listId: state.listId,
      priorityId: state.priorityId,
      tagIds: state.tagIds,
      dueDate: state.dueDate,
      dueTime: state.dueTime,
      repeat: state.repeat,
      reminderMinutesBefore: state.reminderMinutesBefore,
      subtasks: state.subtasks,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt ?? null,
    };
  }

  return { state, set, setDueDate, toggleTag, canSave, toDraft };
}
