import type {
  TTodo,
  TTodoGroup,
  TTodoList,
  TTodoPrefs,
  TTodoPriority,
  TTodoTag,
} from '@/lib/types';
import { dateToISO, isoToDate } from '@/lib/utils/date.util';

export type TTodoDueFilter = 'all' | 'today' | 'overdue' | 'upcoming' | 'nodate';

/** `listId: 'inbox'` means "todos belonging to no list", distinct from 'all'. */
export interface TTodoFilter {
  listId: string;
  tagIds: string[];
  priorityIds: string[];
  dueFilter: TTodoDueFilter;
  query: string;
}

export const EMPTY_TODO_FILTER: TTodoFilter = {
  listId: 'all',
  tagIds: [],
  priorityIds: [],
  dueFilter: 'all',
  query: '',
};

export function isFilterActive(filter: TTodoFilter): boolean {
  return (
    filter.listId !== 'all' ||
    filter.tagIds.length > 0 ||
    filter.priorityIds.length > 0 ||
    filter.dueFilter !== 'all' ||
    filter.query.trim() !== ''
  );
}

export function isOverdue(todo: TTodo, today: string): boolean {
  return !todo.completed && todo.dueDate !== null && todo.dueDate < today;
}

export function isDueToday(todo: TTodo, today: string): boolean {
  return !todo.completed && todo.dueDate === today;
}

function addDays(iso: string, days: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + days);
  return dateToISO(d);
}

/**
 * Human due-date label. Named days inside the ±1 window, weekday name for the
 * coming week, and a short date beyond it — the year appears only when it
 * differs from today's, which is the only time it carries information.
 */
export function formatDueLabel(iso: string, today: string): string {
  if (iso === today) return 'Today';
  if (iso === addDays(today, 1)) return 'Tomorrow';
  if (iso === addDays(today, -1)) return 'Yesterday';

  const date = isoToDate(iso);
  if (iso > today && iso <= addDays(today, 6)) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** '09:00' → '9:00 AM'. Returns null for a missing or malformed value. */
export function formatTimeLabel(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function matchesDueFilter(todo: TTodo, dueFilter: TTodoDueFilter, today: string): boolean {
  switch (dueFilter) {
    case 'today':
      // "Today" means "needs doing today", so anything already past due counts.
      return todo.dueDate !== null && todo.dueDate <= today;
    case 'overdue':
      return isOverdue(todo, today);
    case 'upcoming':
      return todo.dueDate !== null && todo.dueDate > today;
    case 'nodate':
      return todo.dueDate === null;
    default:
      return true;
  }
}

export function filterTodos(todos: TTodo[], filter: TTodoFilter, today: string): TTodo[] {
  const query = filter.query.trim().toLowerCase();

  return todos.filter(todo => {
    if (filter.listId === 'inbox') {
      if (todo.listId !== null) return false;
    } else if (filter.listId !== 'all' && todo.listId !== filter.listId) {
      return false;
    }

    // Tags and priorities are OR within themselves, AND across the two — the
    // reading of "Urgent or High, tagged Focus or Quick" that users expect.
    if (filter.priorityIds.length > 0 && (todo.priorityId === null || !filter.priorityIds.includes(todo.priorityId))) {
      return false;
    }
    if (filter.tagIds.length > 0 && !todo.tagIds.some(id => filter.tagIds.includes(id))) {
      return false;
    }
    if (!matchesDueFilter(todo, filter.dueFilter, today)) return false;

    if (query) {
      const haystack = `${todo.title} ${todo.note} ${todo.subtasks.map(s => s.title).join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

/**
 * Comparator for one sort mode, before direction is applied.
 *
 * Undated todos always sort after dated ones under 'due', and todos with no
 * priority always sort last under 'priority' — in both cases regardless of
 * direction. Flipping to descending should reverse the ranked items, not
 * promote the unranked ones to the top.
 */
function compareBy(
  a: TTodo,
  b: TTodo,
  sortBy: TTodoPrefs['sortBy'],
  levelOf: (id: string | null) => number | null,
): number {
  switch (sortBy) {
    case 'due': {
      if (a.dueDate === b.dueDate) return 0;
      if (a.dueDate === null) return 1;
      if (b.dueDate === null) return -1;
      return a.dueDate < b.dueDate ? -1 : 1;
    }
    case 'priority': {
      const la = levelOf(a.priorityId);
      const lb = levelOf(b.priorityId);
      if (la === lb) return 0;
      if (la === null) return 1;
      if (lb === null) return -1;
      // Higher level first, so ascending reads as "most urgent at the top".
      return lb - la;
    }
    case 'created':
      return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
    case 'alpha':
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    default:
      return a.sortOrder - b.sortOrder;
  }
}

export function sortTodos(todos: TTodo[], prefs: TTodoPrefs, priorities: TTodoPriority[]): TTodo[] {
  const levels = new Map(priorities.map(p => [p.id, p.level]));
  const levelOf = (id: string | null) => (id === null ? null : levels.get(id) ?? null);
  const dir = prefs.sortDir === 'desc' ? -1 : 1;

  // Copy first: the array comes from a query cache, and sorting in place would
  // mutate cached data other consumers are already holding.
  return [...todos].sort((a, b) => {
    const unranked =
      (prefs.sortBy === 'due' && (a.dueDate === null) !== (b.dueDate === null)) ||
      (prefs.sortBy === 'priority' && (levelOf(a.priorityId) === null) !== (levelOf(b.priorityId) === null));

    const primary = compareBy(a, b, prefs.sortBy, levelOf);
    if (primary !== 0) return unranked ? primary : primary * dir;

    // Stable tie-break so equal todos never swap places between renders.
    return a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt);
  });
}

function dueBucket(todo: TTodo, today: string): { key: string; label: string; order: number } {
  if (todo.dueDate === null) return { key: 'due_none', label: 'No date', order: 5 };
  if (todo.dueDate < today) return { key: 'due_overdue', label: 'Overdue', order: 0 };
  if (todo.dueDate === today) return { key: 'due_today', label: 'Today', order: 1 };
  if (todo.dueDate === addDays(today, 1)) return { key: 'due_tomorrow', label: 'Tomorrow', order: 2 };
  if (todo.dueDate <= addDays(today, 7)) return { key: 'due_week', label: 'Next 7 days', order: 3 };
  return { key: 'due_later', label: 'Later', order: 4 };
}

interface GroupContext {
  lists: TTodoList[];
  priorities: TTodoPriority[];
  tags: TTodoTag[];
  today: string;
}

function groupTodos(todos: TTodo[], groupBy: TTodoPrefs['groupBy'], ctx: GroupContext): TTodoGroup[] {
  if (groupBy === 'none') {
    return todos.length > 0 ? [{ key: 'all', label: '', color: null, todos }] : [];
  }

  const groups = new Map<string, TTodoGroup & { order: number }>();

  function push(key: string, label: string, color: string | null, order: number, todo: TTodo) {
    const existing = groups.get(key);
    if (existing) existing.todos.push(todo);
    else groups.set(key, { key, label, color, order, todos: [todo] });
  }

  for (const todo of todos) {
    if (groupBy === 'list') {
      const list = ctx.lists.find(l => l.id === todo.listId);
      // A todo whose list was deleted reads as Inbox rather than vanishing into
      // a group header named after an id the user can no longer see.
      if (list) push(`list_${list.id}`, `${list.icon} ${list.name}`, list.color, list.sortOrder, todo);
      else push('list_none', 'Inbox', null, Number.MAX_SAFE_INTEGER, todo);
      continue;
    }

    if (groupBy === 'priority') {
      const priority = ctx.priorities.find(p => p.id === todo.priorityId);
      if (priority) push(`pri_${priority.id}`, priority.name, priority.color, priority.sortOrder, todo);
      else push('pri_none', 'No priority', null, Number.MAX_SAFE_INTEGER, todo);
      continue;
    }

    if (groupBy === 'due') {
      const bucket = dueBucket(todo, ctx.today);
      push(bucket.key, bucket.label, null, bucket.order, todo);
      continue;
    }

    // Tag grouping is the one many-to-many case: a todo with three tags appears
    // under all three. Untagged todos get their own bucket rather than none.
    if (todo.tagIds.length === 0) {
      push('tag_none', 'Untagged', null, Number.MAX_SAFE_INTEGER, todo);
    } else {
      for (const tagId of todo.tagIds) {
        const tag = ctx.tags.find(t => t.id === tagId);
        if (tag) push(`tag_${tag.id}`, tag.name, tag.color, tag.sortOrder, todo);
      }
    }
  }

  return [...groups.values()]
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...group }) => group);
}

export interface TTodoView {
  groups: TTodoGroup[];
  /** Completed todos split out for `completedMode: 'bottom'`; empty otherwise. */
  completed: TTodo[];
  openCount: number;
  doneCount: number;
  overdueCount: number;
  dueTodayCount: number;
}

/**
 * The single place the filter → sort → group pipeline runs. Every surface
 * (tab screen, counts, progress bar) reads one memoized result rather than
 * re-deriving its own slice and drifting out of agreement with the list.
 */
export function buildTodoView(
  todos: TTodo[],
  prefs: TTodoPrefs,
  filter: TTodoFilter,
  ctx: GroupContext,
): TTodoView {
  const matching = filterTodos(todos, filter, ctx.today);

  const open = matching.filter(t => !t.completed);
  const done = matching.filter(t => t.completed);

  const sortedOpen = sortTodos(open, prefs, ctx.priorities);
  // Completed todos ignore the active sort and read newest-finished-first —
  // under manual sort they would otherwise sit in whatever order they happened
  // to be created, which says nothing about when they were done.
  const sortedDone = [...done].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const visible = prefs.completedMode === 'show' ? sortTodos([...open, ...done], prefs, ctx.priorities) : sortedOpen;

  return {
    groups: groupTodos(visible, prefs.groupBy, ctx),
    completed: prefs.completedMode === 'bottom' ? sortedDone : [],
    openCount: open.length,
    doneCount: done.length,
    overdueCount: open.filter(t => isOverdue(t, ctx.today)).length,
    dueTodayCount: open.filter(t => isDueToday(t, ctx.today)).length,
  };
}
