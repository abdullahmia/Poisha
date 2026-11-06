import { DEFAULT_TAB_BAR_PREFS, MAX_TAB_ITEMS, PINNED_TAB_ITEMS } from '@/lib/constants';
import type { TTabBarPrefs, TTabItem } from '@/lib/types';

/** Plan and Todo only have a tab while their feature is switched on. */
export type TTabAvailability = (item: TTabItem) => boolean;

export const isPinnedTabItem = (item: TTabItem) => PINNED_TAB_ITEMS.includes(item);

function isTabItem(value: unknown): value is TTabItem {
  return typeof value === 'string' && (DEFAULT_TAB_BAR_PREFS.order as string[]).includes(value);
}

/**
 * Repairs a stored blob rather than trusting it: unknown and duplicate items
 * are dropped, items a later build adds are appended so they still get a slot
 * in `order`, and a pinned item can never end up hidden.
 */
export function normalizeTabBarPrefs(raw: unknown): TTabBarPrefs {
  const blob = (raw ?? {}) as { order?: unknown; hidden?: unknown };
  const order = Array.isArray(blob.order) ? [...new Set(blob.order.filter(isTabItem))] : [];
  for (const item of DEFAULT_TAB_BAR_PREFS.order) {
    if (!order.includes(item)) order.push(item);
  }
  const hidden = Array.isArray(blob.hidden)
    ? [...new Set(blob.hidden.filter(isTabItem))].filter(item => !isPinnedTabItem(item))
    : [];
  return { order, hidden };
}

/**
 * What the bar shows, in order. Normally that is just every available item
 * that isn't hidden. The cap only matters for state saved before it existed
 * (Plan and Todo both on, nothing hidden): it drops non-pinned items from the
 * end, so the same layout comes out on every launch.
 */
export function resolveTabBar(prefs: TTabBarPrefs, isAvailable: TTabAvailability): TTabItem[] {
  const items = prefs.order.filter(item => isAvailable(item) && !prefs.hidden.includes(item));
  for (let i = items.length - 1; i >= 0 && items.length > MAX_TAB_ITEMS; i--) {
    if (!isPinnedTabItem(items[i])) items.splice(i, 1);
  }
  return items;
}

/**
 * Rewrites `hidden` to match what the bar shows now. Without this, an item the
 * cap left out would pop back in as soon as the user removed something else,
 * which is not what they asked for. Unavailable items keep their old hidden
 * flag, because that flag belongs to a feature that is off, not to this bar.
 */
function settle(prefs: TTabBarPrefs, isAvailable: TTabAvailability): TTabBarPrefs {
  const shown = resolveTabBar(prefs, isAvailable);
  const hidden = prefs.order.filter(item => {
    if (isPinnedTabItem(item)) return false;
    return isAvailable(item) ? !shown.includes(item) : prefs.hidden.includes(item);
  });
  return { order: prefs.order, hidden };
}

export function setTabItemShown(
  prefs: TTabBarPrefs,
  item: TTabItem,
  shown: boolean,
  isAvailable: TTabAvailability,
): TTabBarPrefs {
  if (isPinnedTabItem(item)) return prefs;
  const base = settle(prefs, isAvailable);
  const rest = base.hidden.filter(i => i !== item);
  if (!shown) return { ...base, hidden: [...rest, item] };
  // A full bar refuses rather than silently evicting something.
  if (resolveTabBar(base, isAvailable).length >= MAX_TAB_ITEMS) return base;
  return { ...base, hidden: rest };
}

/** Swaps an item with its visible neighbour. Hidden items keep their slots in between. */
export function moveTabItem(
  prefs: TTabBarPrefs,
  item: TTabItem,
  direction: -1 | 1,
  isAvailable: TTabAvailability,
): TTabBarPrefs {
  const base = settle(prefs, isAvailable);
  const shown = resolveTabBar(base, isAvailable);
  const from = shown.indexOf(item);
  const neighbour = shown[from + direction];
  if (from === -1 || !neighbour) return base;

  const order = [...base.order];
  const a = order.indexOf(item);
  const b = order.indexOf(neighbour);
  [order[a], order[b]] = [order[b], order[a]];
  return { ...base, order };
}

/**
 * Called just before a feature is switched on, while its item is still
 * unavailable. If the bar has a free slot the item goes in. If not, it is
 * explicitly hidden. Leaving that to the cap would drop whichever item sits
 * last, which could be a tab the user deliberately chose.
 */
export function admitTabItem(
  prefs: TTabBarPrefs,
  item: TTabItem,
  isAvailable: TTabAvailability,
): { prefs: TTabBarPrefs; fits: boolean } {
  const base = settle(prefs, isAvailable);
  const fits = resolveTabBar(base, isAvailable).length < MAX_TAB_ITEMS;
  const rest = base.hidden.filter(i => i !== item);
  return { prefs: { ...base, hidden: fits ? rest : [...rest, item] }, fits };
}

export function resetTabBar(isAvailable: TTabAvailability): TTabBarPrefs {
  return settle(DEFAULT_TAB_BAR_PREFS, isAvailable);
}
