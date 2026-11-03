import type { TTodo, TTodoRepeat } from '@/lib/types';
import { dateToISO, isoToDate, todayISO } from '@/lib/utils/date.util';

export function describeRepeat(repeat: TTodoRepeat | null): string {
  if (!repeat) return 'Never';

  const { unit, interval, weekdays } = repeat;

  if (unit === 'week' && weekdays.length > 0) {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const picked = [...weekdays].sort((a, b) => a - b).map(d => names[d]).join(', ');
    return interval === 1 ? `Weekly on ${picked}` : `Every ${interval} weeks on ${picked}`;
  }

  const singular: Record<TTodoRepeat['unit'], string> = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly',
  };
  if (interval === 1) return singular[unit];
  return `Every ${interval} ${unit}s`;
}

/**
 * Advances a date by one repeat step.
 *
 * Month and year steps clamp to the end of the target month, so a "monthly on
 * the 31st" todo lands on the 30th in April rather than rolling into May — JS
 * `setMonth` overflows by default, which would quietly drift the whole series
 * forward a day every short month.
 */
function addStep(from: Date, repeat: TTodoRepeat): Date {
  const { unit, interval } = repeat;
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  if (unit === 'day') {
    next.setDate(next.getDate() + interval);
    return next;
  }
  if (unit === 'week') {
    next.setDate(next.getDate() + interval * 7);
    return next;
  }

  const monthsToAdd = unit === 'month' ? interval : interval * 12;
  const targetDay = from.getDate();
  const target = new Date(from.getFullYear(), from.getMonth() + monthsToAdd, 1);
  const lastDayOfTarget = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(targetDay, lastDayOfTarget));
  return target;
}

/** Walks forward one weekday at a time to the next day named in `weekdays`. */
function nextWeekday(from: Date, repeat: TTodoRepeat): Date {
  const wanted = new Set(repeat.weekdays);
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  // At most 7 hops reaches every weekday; the interval only applies once the
  // week itself rolls over, which the >7 guard below never needs to express
  // because `weekdays` is checked day by day.
  for (let i = 1; i <= 7; i++) {
    cursor.setDate(cursor.getDate() + 1);
    if (wanted.has(cursor.getDay())) {
      // Multi-week intervals skip the gap weeks once the series wraps past the
      // earliest selected weekday.
      if (repeat.interval > 1 && cursor.getDay() <= Math.min(...repeat.weekdays)) {
        cursor.setDate(cursor.getDate() + (repeat.interval - 1) * 7);
      }
      return cursor;
    }
  }
  return cursor;
}

/**
 * The due date a recurring todo takes when it is ticked off.
 *
 * `anchor: 'dueDate'` steps from the date the todo was already due, keeping a
 * monthly bill on its day of the month however late it is ticked. The loop
 * exists for that case: a series left untouched for months would otherwise
 * reappear still in the past, due again immediately, once per missed period.
 *
 * `anchor: 'completion'` restarts the clock from the day it was finished.
 *
 * Returns null when the todo does not recur or has no due date to step from —
 * a repeat rule is meaningless without an anchor date.
 */
export function nextOccurrence(todo: TTodo, completedOn: string = todayISO()): string | null {
  const { repeat, dueDate } = todo;
  if (!repeat || !dueDate) return null;

  const useWeekdays = repeat.unit === 'week' && repeat.weekdays.length > 0;

  if (repeat.anchor === 'completion') {
    const base = isoToDate(completedOn);
    return dateToISO(useWeekdays ? nextWeekday(base, repeat) : addStep(base, repeat));
  }

  let cursor = isoToDate(dueDate);
  // Bounded so a pathological rule (or a todo abandoned for years) can't spin;
  // 500 steps covers more than a year of daily repeats, far past any real gap.
  for (let i = 0; i < 500; i++) {
    cursor = useWeekdays ? nextWeekday(cursor, repeat) : addStep(cursor, repeat);
    if (dateToISO(cursor) > completedOn) break;
  }
  return dateToISO(cursor);
}

/** A fresh, open copy of a recurring todo moved to its next due date. */
export function rolledForward(todo: TTodo, completedOn: string, nowISO: string): TTodo | null {
  const next = nextOccurrence(todo, completedOn);
  if (!next) return null;

  return {
    ...todo,
    dueDate: next,
    completed: false,
    completedAt: null,
    // Subtasks are part of the routine, not of one run of it — a weekly
    // shopping list that kept its ticks would come back already done.
    subtasks: todo.subtasks.map(s => ({ ...s, done: false })),
    updatedAt: nowISO,
  };
}
