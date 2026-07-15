import { colorScheme as nativeWindColorScheme } from 'nativewind';
import { useCallback, useEffect } from 'react';
import { DARK_THEME, LIGHT_THEME } from '@/lib/constants';
import { useThemeTransition } from '@/lib/context/theme-transition.context';
import { useSetThemePreference, useThemePreference } from '@/lib/services/theme';

export function useTheme() {
  const { data: scheme } = useThemePreference();
  const setThemePreference = useSetThemePreference();
  const { flash } = useThemeTransition();
  const colors = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;

  // NativeWind's own colorScheme (drives every className color) tracks the
  // system appearance by default and is otherwise unrelated to this query,
  // so it must be kept in sync here on every render — not just on toggle —
  // or className- and inline-styled colors can disagree on boot.
  useEffect(() => {
    if (scheme) nativeWindColorScheme.set(scheme);
  }, [scheme]);

  const toggleScheme = useCallback(() => {
    flash(colors.bg);
    setThemePreference.mutate(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, colors.bg, setThemePreference, flash]);

  return {
    scheme,
    colors,
    toggleScheme,
  };
}
