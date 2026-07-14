import { useCallback } from 'react';
import { DARK_THEME, LIGHT_THEME } from '@/lib/constants';
import { useSetThemePreference, useThemePreference } from '@/lib/services/theme';

export function useTheme() {
  const { data: scheme } = useThemePreference();
  const setThemePreference = useSetThemePreference();

  const toggleScheme = useCallback(() => {
    setThemePreference.mutate(scheme === 'dark' ? 'light' : 'dark');
  }, [scheme, setThemePreference]);

  return {
    scheme,
    colors: scheme === 'dark' ? DARK_THEME : LIGHT_THEME,
    toggleScheme,
  };
}
