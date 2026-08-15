import { colorScheme as nativeWindColorScheme } from 'nativewind';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { DARK_THEME, LIGHT_THEME } from '@/lib/constants';
import { useThemeTransition } from '@/lib/context/theme-transition.context';
import { useSetThemePreference, useThemePreference } from '@/lib/services/theme';
import type { TColorScheme, TThemePreference } from '@/lib/types';
import { getSystemScheme, subscribeToSystemScheme } from '@/lib/utils/system-scheme.util';

export function useTheme() {
  const { data: preference } = useThemePreference();
  const setThemePreference = useSetThemePreference();
  const { flash } = useThemeTransition();

  // One shared OS subscription behind this — see system-scheme.util.ts.
  const systemScheme = useSyncExternalStore(subscribeToSystemScheme, getSystemScheme, getSystemScheme);

  // `preference` is what the user picked; `scheme` is what actually gets
  // painted. They differ only when the preference is 'system'.
  const scheme: TColorScheme = preference === 'system' ? systemScheme : preference;
  const colors = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;

  // NativeWind's own colorScheme (drives every className color) tracks the
  // system appearance by default and is otherwise unrelated to this query,
  // so it must be kept in sync here on every render — not just on toggle —
  // or className- and inline-styled colors can disagree on boot.
  useEffect(() => {
    if (scheme) nativeWindColorScheme.set(scheme);
  }, [scheme]);

  const setPreference = useCallback((next: TThemePreference) => {
    flash(colors.bg);
    setThemePreference.mutate(next);
  }, [colors.bg, setThemePreference, flash]);

  return {
    scheme,
    preference,
    // Exposed so the Appearance screen's "System" card can preview the real OS
    // appearance — deriving it from `scheme` would show the picked theme instead
    // whenever the preference isn't 'system'.
    systemScheme,
    colors,
    setPreference,
  };
}
