import {
  Add01Icon,
  Calendar01Icon,
  CheckmarkSquare02Icon,
  Home01Icon,
  ListViewIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import type { TTabBarPrefs, TTabItem } from '@/lib/types';

/** Past five, the labels stop fitting on a phone and the targets get too small to hit. */
export const MAX_TAB_ITEMS = 5;

/**
 * Always in the bar. Add is the only way to log an entry, and Settings is the
 * only way back to the screen that edits the bar — hiding it would lock the
 * user out of undoing that.
 */
export const PINNED_TAB_ITEMS: readonly TTabItem[] = ['add', 'settings'];

export const TAB_ITEM_META: Record<
  TTabItem,
  { label: string; icon: typeof Home01Icon; route: string | null }
> = {
  home: { label: 'Home', icon: Home01Icon, route: 'index' },
  entries: { label: 'Entries', icon: ListViewIcon, route: 'explore' },
  add: { label: 'Add', icon: Add01Icon, route: null },
  plan: { label: 'Plan', icon: Calendar01Icon, route: 'plan' },
  todo: { label: 'Todo', icon: CheckmarkSquare02Icon, route: 'todo' },
  settings: { label: 'Settings', icon: Settings01Icon, route: 'settings' },
};

// Add after the first two, as the bar has always been laid out — so anyone who
// never opens the customizer sees exactly what they saw before it existed.
export const DEFAULT_TAB_BAR_PREFS: TTabBarPrefs = {
  order: ['home', 'entries', 'add', 'plan', 'todo', 'settings'],
  hidden: [],
};
