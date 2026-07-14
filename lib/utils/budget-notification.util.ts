import type { QueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { ASYNC_STORAGE_KEYS, DEFAULT_LOCALE, QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TEntry, TLocale } from '@/lib/types';
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

  const budgetRaw = await storage.getItem(ASYNC_STORAGE_KEYS.budget);
  const budget = budgetRaw ? parseFloat(budgetRaw) : NaN;
  if (Number.isNaN(budget)) return;

  const monthKey = entry.date.slice(0, 7);
  const exceededMonth = await storage.getItem(ASYNC_STORAGE_KEYS.budgetExceededMonth);
  if (exceededMonth === monthKey) return;

  const total = sqliteStorage
    .loadEntries()
    .filter(e => e.date.startsWith(monthKey))
    .reduce((sum, e) => sum + e.amounts.reduce((s, a) => s + a, 0), 0);
  if (total <= budget) return;

  const locale = await loadLocale();
  await notifyBudgetExceeded(fmtFull(total, locale), fmtFull(budget, locale));

  await storage.setItem(ASYNC_STORAGE_KEYS.budgetExceededMonth, monthKey);
  queryClient.setQueryData(QUERY_KEYS.budget.exceededMonth, monthKey);
}
