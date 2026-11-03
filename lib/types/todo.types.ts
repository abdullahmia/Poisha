/** A user-defined list (project). Todos with `listId: null` live in Inbox. */
export interface TTodoList {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  archived: boolean;
}

/**
 * A user-defined urgency band. `level` is what sorting and "is this urgent"
 * decisions read — higher is more urgent — so renaming or reordering the bands
 * never changes their meaning to the rest of the module.
 */
export interface TTodoPriority {
  id: string;
  name: string;
  color: string;
  level: number;
  sortOrder: number;
}

export interface TTodoTag {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface TSubtask {
  id: string;
  title: string;
  done: boolean;
}

export type TRepeatUnit = 'day' | 'week' | 'month' | 'year';

/**
 * `anchor` decides what the next due date is measured from. 'dueDate' keeps a
 * monthly bill on the 1st even when it's ticked off late; 'completion' suits
 * "water the plants every 3 days", where the clock restarts when you do it.
 */
export interface TTodoRepeat {
  unit: TRepeatUnit;
  interval: number;
  /** Weekly only: 0–6, Sunday-first. Empty means "same weekday as the due date". */
  weekdays: number[];
  anchor: 'dueDate' | 'completion';
}

export interface TTodo {
  id: string;
  title: string;
  note: string;
  listId: string | null;
  priorityId: string | null;
  /** YYYY-MM-DD, or null for no due date. */
  dueDate: string | null;
  /** HH:MM (24h), or null to fall back to the prefs' default reminder time. */
  dueTime: string | null;
  repeat: TTodoRepeat | null;
  /** Minutes before the due moment to fire a reminder; null means no reminder. */
  reminderMinutesBefore: number | null;
  tagIds: string[];
  subtasks: TSubtask[];
  completed: boolean;
  /** ISO 8601 instant, or null while open. */
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Position under manual sort. Untouched by the other sort modes. */
  sortOrder: number;
}

export type TTodoDraft = Omit<TTodo, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> & {
  id?: string;
  sortOrder?: number;
};

export type TTodoSortBy = 'manual' | 'due' | 'priority' | 'created' | 'alpha';
export type TTodoGroupBy = 'none' | 'list' | 'priority' | 'due' | 'tag';
export type TTodoDensity = 'compact' | 'comfortable';
export type TTodoCompletedMode = 'hide' | 'show' | 'bottom';
export type TTodoSwipeAction = 'delete' | 'complete' | 'none';

/** Which optional fields a todo card is allowed to render. */
export interface TTodoCardFields {
  note: boolean;
  dueDate: boolean;
  priority: boolean;
  list: boolean;
  tags: boolean;
  subtaskProgress: boolean;
}

/**
 * Everything the user can tune about the Todo module, stored as one JSON blob
 * under a single AsyncStorage key. One key rather than a dozen keeps reads to a
 * single round-trip and keeps the backup allowlist from growing a new entry
 * every time a preference is added.
 */
export interface TTodoPrefs {
  sortBy: TTodoSortBy;
  sortDir: 'asc' | 'desc';
  groupBy: TTodoGroupBy;
  completedMode: TTodoCompletedMode;
  density: TTodoDensity;
  cardFields: TTodoCardFields;
  /** Tint cards and rows with their list's colour instead of the app accent. */
  colorByList: boolean;
  showProgressBar: boolean;
  confirmDelete: boolean;
  /** Pre-selected in the add form. Null means Inbox. */
  defaultListId: string | null;
  defaultPriorityId: string | null;
  /** Used when a todo has a due date but no time of its own. */
  defaultReminderTime: string;
  defaultReminderMinutesBefore: number | null;
  swipeAction: TTodoSwipeAction;
  /** Roll an unfinished, past-due todo forward to today on app open. */
  carryOverOverdue: boolean;
}

/** One rendered section of the todo list — a group header plus its rows. */
export interface TTodoGroup {
  key: string;
  label: string;
  color: string | null;
  todos: TTodo[];
}
