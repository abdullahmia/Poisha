import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { DARK_THEME, LIGHT_THEME } from '@/lib/constants';
import { useThemeTransition } from '@/lib/context/theme-transition.context';
import { useSetThemePreference, useThemePreference } from '@/lib/services/theme';
import type { TColorScheme, TThemePreference } from '@/lib/types';
import {
  applyColorSchemeOverride,
  getSystemScheme,
  subscribeToSystemScheme,
} from '@/lib/utils/system-scheme.util';

export function useTheme() {
  // Optional in the types because the service uses placeholderData, not
  // initialData — see use-theme-preference.service.ts. In practice the
  // placeholder means this is 'dark' from the very first render, so there is
  // no boot flash; the fallback exists to keep `scheme` non-optional.
  const { data } = useThemePreference();
  const preference: TThemePreference = data ?? 'dark';
  const setThemePreference = useSetThemePreference();
  const { transition } = useThemeTransition();

  // One shared OS subscription behind this — see system-scheme.util.ts.
  const systemScheme = useSyncExternalStore(subscribeToSystemScheme, getSystemScheme, getSystemScheme);

  // `preference` is what the user picked; `scheme` is what actually gets
  // painted. They differ only when the preference is 'system'.
  const scheme: TColorScheme = preference === 'system' ? systemScheme : preference;
  const colors = scheme === 'dark' ? DARK_THEME : LIGHT_THEME;

  // Applies the choice as the app-wide *native* appearance, so system chrome
  // follows the theme. The className colors no longer ride on this — they read
  // the CSS variables `ThemeVars` publishes from `scheme` — which is what makes
  // the two styling paths agree on the first frame under React Native 0.88.
  //
  // Deliberately the preference, not `scheme`: forcing a resolved value here
  // would override the device appearance even under System and hide it from
  // `getSystemScheme()`. See applyColorSchemeOverride.
  useEffect(() => {
    applyColorSchemeOverride(preference);
  }, [preference]);

  const setPreference = useCallback((next: TThemePreference) => {
    if (next === preference) return;

    const commit = () => setThemePreference.mutate(next);
    const nextScheme: TColorScheme = next === 'system' ? systemScheme : next;

    // e.g. Light → System on a light device: the preference changes but nothing
    // on screen does, so covering and revealing it would be motion for nothing.
    if (nextScheme === scheme) {
      commit();
      return;
    }

    const nextColors = nextScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
    transition(colors.bg, nextColors.bg, commit);
  }, [preference, systemScheme, scheme, colors.bg, setThemePreference, transition]);

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
