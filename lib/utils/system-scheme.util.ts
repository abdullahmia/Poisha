import { colorScheme as nativeWindColorScheme } from 'nativewind';
import { Appearance } from 'react-native';
import type { TColorScheme, TThemePreference } from '@/lib/types';

// Module-level, not per-hook. `useTheme()` is called from ~30 components, so a
// listener inside the hook would mean ~30 OS subscriptions all recomputing the
// same value. One subscription here fans out to every consumer through
// useSyncExternalStore instead.

function normalize(scheme: string | null | undefined): TColorScheme {
  return scheme === 'light' ? 'light' : 'dark';
}

// Read at module init, which runs on import — strictly before any render effect
// can install an override, so this starts out as the genuine device setting.
let current: TColorScheme = normalize(Appearance.getColorScheme());
let overridden = false;
const listeners = new Set<() => void>();

function publish(next: TColorScheme): void {
  if (next === current) return;
  current = next;
  for (const notify of listeners) notify();
}

Appearance.addChangeListener(({ colorScheme }) => {
  // An app-level override is applied to the key window's trait collection, and
  // `RCTColorSchemePreference` reads that same trait collection — so while one
  // is installed, both this event and `getColorScheme()` report the override
  // back to us and say nothing about the device. Ignoring those keeps `current`
  // at the last value seen without an override, which is the real one.
  if (overridden) return;
  publish(normalize(colorScheme));
});

/**
 * Applies the user's choice as the app-wide native appearance, so system chrome
 * (keyboards, text selection, scroll indicators, native alerts) follows the
 * theme rather than the device.
 *
 * Takes the *preference*, not the resolved scheme. That distinction is the bug
 * this replaced: passing the resolved 'light'/'dark' installed an override even
 * when the user had chosen System, which masked the device setting behind the
 * app's own value. `getSystemScheme()` then read back what the app had just
 * written, so System locked onto whichever theme was last forced and stopped
 * following the device at all.
 *
 * Routed through NativeWind's setter rather than `Appearance.setColorScheme`
 * directly: it is the same native write, and it additionally maps 'system' onto
 * whichever reset value this React Native version expects, while keeping
 * NativeWind's own scheme aligned for any `dark:` variant added later.
 */
export function applyColorSchemeOverride(preference: TThemePreference): void {
  nativeWindColorScheme.set(preference);

  if (preference === 'system') {
    overridden = false;
    // Clearing the override makes the device value readable again, and it may
    // have changed while masked — so re-read rather than wait for an event that
    // has already been and gone.
    publish(normalize(Appearance.getColorScheme()));
    return;
  }

  overridden = true;
}

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
