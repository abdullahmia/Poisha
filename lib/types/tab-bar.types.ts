/** Everything that can sit in the bottom tab bar. `add` opens the entry sheet; the rest are routes. */
export type TTabItem = 'home' | 'entries' | 'add' | 'plan' | 'todo' | 'settings';

export interface TTabBarPrefs {
  /** Every item, in the order the bar shows them — hidden ones keep their place. */
  order: TTabItem[];
  /** Items the user took out of the bar. Never contains a pinned item. */
  hidden: TTabItem[];
}
