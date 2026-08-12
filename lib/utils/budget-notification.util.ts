import type { QueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { ASYNC_STORAGE_KEYS, DEFAULT_LOCALE, QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TEntry, TLocale } from '@/lib/types';
import { isUpcomingISO, NO_CUTOFF, todayISO } from '@/lib/utils/date.util';
import { sumEntries } from '@/lib/utils/entries.util';
import { fmtFull } from '@/lib/utils/format.util';

const MESSAGE_TEMPLATES: Array<(spent: string, budget: string) => string> = [
  (spent, budget) => `You've crossed your ${budget} budget — ${spent} spent so far this month.`,
  (spent, budget) => `Heads up — this month's spending just passed your ${budget} limit.`,
  (spent, budget) => `Your spending this month (${spent}) is now over your ${budget} budget.`,
];

export async function notifyBudgetExceeded(spentFmt: string, budgetFmt: string): Promise<void> {
  const template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Budget Alert',
      body: template(spentFmt, budgetFmt),
      sound: true,
    },
    trigger: null,
  });
}

// This util runs from use-save-entry.service.ts's onSuccess, outside React, so
// the flag is read straight from AsyncStorage rather than through usePlanMode.
async function loadPlanModeEnabled(): Promise<boolean> {
  return (await storage.getItem(ASYNC_STORAGE_KEYS.planModeEnabled)) === 'true';
}

async function loadLocale(): Promise<TLocale> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.locale);
  if (!raw) return DEFAULT_LOCALE;
  try {
    return { ...DEFAULT_LOCALE, ...(JSON.parse(raw) as Partial<TLocale>) };
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function checkBudgetAndNotify(entry: TEntry, queryClient: QueryClient): Promise<void> {
  const notificationsEnabled = await storage.getItem(ASYNC_STORAGE_KEYS.notificationsEnabled);
  if (notificationsEnabled !== 'true') return;

  // Planned money isn't spent money: with Plan Mode on, saving a future-dated
  // entry must not evaluate the budget at all. Without this, scheduling next
  // month's rent would fire "you've crossed your budget" on the spot *and* stamp
  // budgetExceededMonth, permanently suppressing that month's real alert.
  // With Plan Mode off there is no such thing as planned spend, so a
  // future-dated save is evaluated like any other — which is correct: if future
  // entries count as spend, one crossing the budget *should* alert.
  const planMode = await loadPlanModeEnabled();
  if (planMode && isUpcomingISO(entry.date)) return;

  const budgetRaw = await storage.getItem(ASYNC_STORAGE_KEYS.budget);
  const budget = budgetRaw ? parseFloat(budgetRaw) : NaN;
  if (Number.isNaN(budget)) return;

  const monthKey = entry.date.slice(0, 7);
  const exceededMonth = await storage.getItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);
  if (exceededMonth === monthKey) return;

  // Cut at today so planned entries already sitting later in this month (from a
  // CSV import, or scheduled before this save) can't inflate the total either.
  // NO_CUTOFF makes this byte-for-byte the pre-feature sum when Plan Mode is off.
  const cutoff = planMode ? todayISO() : NO_CUTOFF;
  const total = sumEntries(
    sqliteStorage.loadEntries().filter(e => e.date.startsWith(monthKey) && e.date <= cutoff),
  );
  if (total <= budget) return;

  const locale = await loadLocale();
  await notifyBudgetExceeded(fmtFull(total, locale), fmtFull(budget, locale));

  await storage.setItem(ASYNC_STORAGE_KEYS.budgetExceededMonth, monthKey);
  queryClient.setQueryData(QUERY_KEYS.budget.exceededMonth, monthKey);
}
