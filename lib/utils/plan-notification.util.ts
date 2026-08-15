import * as Notifications from 'expo-notifications';
import { ASYNC_STORAGE_KEYS, DEFAULT_LOCALE } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TEntry, TLocale } from '@/lib/types';
import { isoToDate, todayISO } from '@/lib/utils/date.util';
import { sumEntries } from '@/lib/utils/entries.util';
import { fmtFull } from '@/lib/utils/format.util';

// Tag carried on every notification this module schedules, so it can find and
// cancel its own without storing IDs anywhere. That keeps the feature as
// stateless as the rest of Plan Mode — nothing to migrate, nothing to leave
// orphaned pointing at an entry that has since been edited or deleted.
const PLAN_DUE = 'plan-due';

const NOTIFY_HOUR = 9;

// iOS caps pending local notifications at 64 across the whole app. Scheduling
// the nearest 20 maturity dates leaves plenty of headroom, and every app resume
// re-syncs, so more distant dates roll into range as the near ones fire.
const MAX_SCHEDULED = 20;

async function loadLocale(): Promise<TLocale> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.locale);
  if (!raw) return DEFAULT_LOCALE;
  try {
    return { ...DEFAULT_LOCALE, ...(JSON.parse(raw) as Partial<TLocale>) };
  } catch {
    return DEFAULT_LOCALE;
  }
}

async function cancelPlanDueNotifications(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === PLAN_DUE) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}

function entryLabel(entry: TEntry): string | null {
  if (entry.note.trim()) return entry.note.trim();
  if (!entry.categoryId) return null;
  return sqliteStorage.loadCategories().find(c => c.id === entry.categoryId)?.name ?? null;
}

function buildBody(entries: TEntry[], locale: TLocale): string {
  const total = fmtFull(sumEntries(entries), locale);
  if (entries.length === 1) {
    const label = entryLabel(entries[0]);
    return label
      ? `${label} (${total}) counts toward your spending from today.`
      : `A planned entry (${total}) counts toward your spending from today.`;
  }
  return `${entries.length} planned entries (${total}) count toward your spending from today.`;
}

/**
 * Cancels and re-schedules every "planned entry is due" notification from the
 * current entry list. Safe to call at any time — it always derives the full
 * schedule from scratch rather than patching it, so it self-heals after an
 * edit, a delete, an import, a restore, or a timezone change.
 *
 * Best-effort throughout: a notification failure must never interrupt an entry
 * mutation, which is why every call site fires this without awaiting.
 */
export async function syncPlanDueNotifications(): Promise<void> {
  try {
    await cancelPlanDueNotifications();

    const notificationsEnabled = await storage.getItem(ASYNC_STORAGE_KEYS.notificationsEnabled);
    if (notificationsEnabled !== 'true') return;

    // With Plan Mode off nothing is "planned", so there is no maturity moment
    // to announce — future entries already count as spend.
    const planMode = await storage.getItem(ASYNC_STORAGE_KEYS.planModeEnabled);
    if (planMode !== 'true') return;

    const today = todayISO();
    const upcoming = sqliteStorage.loadEntries().filter(e => e.date > today);
    if (upcoming.length === 0) return;

    // One notification per date, not per entry — three things falling due on the
    // 20th is one piece of news, not three.
    const byDate = new Map<string, TEntry[]>();
    for (const e of upcoming) {
      const list = byDate.get(e.date);
      if (list) list.push(e);
      else byDate.set(e.date, [e]);
    }

    const locale = await loadLocale();
    const dates = [...byDate.keys()].sort().slice(0, MAX_SCHEDULED);

    for (const date of dates) {
      const fireAt = isoToDate(date);
      fireAt.setHours(NOTIFY_HOUR, 0, 0, 0);
      // Skip a slot already past — scheduling it would fire immediately.
      if (fireAt.getTime() <= Date.now()) continue;

      const entries = byDate.get(date)!;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: entries.length === 1 ? 'Planned entry due' : 'Planned entries due',
          body: buildBody(entries, locale),
          sound: true,
          data: { type: PLAN_DUE },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt },
      });
    }
  } catch {
    // Best-effort: notification scheduling must not break entry mutations.
  }
}
