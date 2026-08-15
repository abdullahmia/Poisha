import { Appearance } from 'react-native';
import type { TColorScheme } from '@/lib/types';

// Module-level, not per-hook. `useTheme()` is called from ~30 components, so a
// listener inside the hook would mean ~30 OS subscriptions all recomputing the
// same value. One subscription here fans out to every consumer through
// useSyncExternalStore instead.

function read(): TColorScheme {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

let current: TColorScheme = read();
const listeners = new Set<() => void>();

Appearance.addChangeListener(({ colorScheme }) => {
  const next: TColorScheme = colorScheme === 'light' ? 'light' : 'dark';
  if (next === current) return;
  current = next;
  for (const notify of listeners) notify();
});

export function subscribeToSystemScheme(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// Must return a stable value between changes — useSyncExternalStore re-renders
// on every differing snapshot, so deriving a fresh one here would loop.
export function getSystemScheme(): TColorScheme {
  return current;
}
