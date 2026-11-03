import type { TTodoList, TTodoPrefs, TTodoPriority, TTodoTag } from '@/lib/types';

/**
 * Seeded once, on the first launch that creates the tables — the same contract
 * as DEFAULT_CATEGORIES. They are ordinary rows afterwards: rename, recolour,
 * reorder or archive them freely.
 */
export const DEFAULT_TODO_LISTS: TTodoList[] = [
  { id: 'todo_list_personal', name: 'Personal', icon: '🏠', color: '#4a90c0', sortOrder: 0, archived: false },
  { id: 'todo_list_work', name: 'Work', icon: '💼', color: '#8a6bc0', sortOrder: 1, archived: false },
  { id: 'todo_list_errands', name: 'Errands', icon: '🛒', color: '#4ac07a', sortOrder: 2, archived: false },
];

export const DEFAULT_TODO_PRIORITIES: TTodoPriority[] = [
  { id: 'todo_pri_urgent', name: 'Urgent', color: '#e84040', level: 3, sortOrder: 0 },
  { id: 'todo_pri_high', name: 'High', color: '#e8734a', level: 2, sortOrder: 1 },
  { id: 'todo_pri_normal', name: 'Normal', color: '#4a90c0', level: 1, sortOrder: 2 },
  { id: 'todo_pri_low', name: 'Low', color: '#8a8a8a', level: 0, sortOrder: 3 },
];

export const DEFAULT_TODO_TAGS: TTodoTag[] = [
  { id: 'todo_tag_quick', name: 'Quick', color: '#4ac07a', sortOrder: 0 },
  { id: 'todo_tag_waiting', name: 'Waiting', color: '#c0a34a', sortOrder: 1 },
  { id: 'todo_tag_focus', name: 'Focus', color: '#a34ac0', sortOrder: 2 },
];

/**
 * Every preference's shipped value. Also the merge base when reading the stored
 * blob, so a preference added in a later build lands on this default instead of
 * `undefined` for anyone who saved their settings before it existed.
 */
export const DEFAULT_TODO_PREFS: TTodoPrefs = {
  sortBy: 'manual',
  sortDir: 'asc',
  groupBy: 'none',
  completedMode: 'bottom',
  density: 'comfortable',
  cardFields: {
    note: true,
    dueDate: true,
    priority: true,
    list: true,
    tags: true,
    subtaskProgress: true,
  },
  colorByList: true,
  showProgressBar: true,
  confirmDelete: true,
  defaultListId: null,
  defaultPriorityId: null,
  defaultReminderTime: '09:00',
  defaultReminderMinutesBefore: 0,
  swipeAction: 'delete',
  carryOverOverdue: false,
};

/** Offered in the form's reminder picker. `null` is rendered separately as "None". */
export const TODO_REMINDER_OFFSETS: { label: string; minutes: number }[] = [
  { label: 'At time', minutes: 0 },
  { label: '10 min before', minutes: 10 },
  { label: '30 min before', minutes: 30 },
  { label: '1 hour before', minutes: 60 },
  { label: '1 day before', minutes: 1440 },
];

export const TODO_LIST_EMOJIS = [
  '🏠', '💼', '🛒', '📚', '💪', '✈️', '🎯', '💡',
  '🧹', '🍳', '💰', '🎨', '🐶', '👶', '🎓', '🔧',
  '📞', '📝', '🌱', '❤️', '⭐', '🔥', '📦', '🗂️',
];
