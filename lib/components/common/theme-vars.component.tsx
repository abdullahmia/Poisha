import { vars } from 'nativewind';
import type React from 'react';
import { useMemo } from 'react';
import { View } from 'react-native';
import { DARK_THEME_VARS, LIGHT_THEME_VARS } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/use-theme.hook';

/**
 * Publishes the active palette as NativeWind CSS variables for the whole tree.
 *
 * Every `bg-bg` / `text-ink` class resolves its colour from `--color-*`, and
 * those variables now come from here — from the same `useTheme()` state the
 * inline `colors.*` styles read — rather than from a `.dark:root` block in
 * `global.css` that only applied when NativeWind's own colour scheme agreed.
 *
 * That indirection is what broke under React Native 0.88.
 * `Appearance.setColorScheme()` no longer emits a `change` event (it updates
 * RN's cache and returns; only genuine *system* appearance changes still emit).
 * NativeWind's `colorScheme.set()` has no other way to publish the new value
 * outside its own test environment, so its scheme stayed on whatever the device
 * was set to. Class-driven colours rendered one theme while inline colours
 * rendered the other — a light page behind dark cards, with the PIN keypad's
 * digits dark-on-dark and unreadable. NativeWind only caught up on the next
 * background→foreground transition, which is why the app appeared to fix itself
 * after being reopened.
 *
 * Driving the variables from app state removes that dependency: the palette is
 * now correct on the first frame by construction, because one piece of state
 * feeds both styling paths.
 */
export const ThemeVars: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scheme } = useTheme();

  // `vars()` hands back an empty object whose *identity* is the key into
  // NativeWind's internal map of variable declarations. Memoizing keeps that
  // identity stable per scheme instead of registering a fresh one every render,
  // and the result is passed as the whole `style` prop — never spread or merged
  // into another object, which would drop the identity and with it the lookup.
  const style = useMemo(
    () => vars(scheme === 'dark' ? DARK_THEME_VARS : LIGHT_THEME_VARS),
    [scheme],
  );

  // Variables inherit through React context, so this reaches modals and
  // native-stack screens as well — anything rendered inside the tree.
  return (
    <View className="flex-1" style={style}>
      {children}
    </View>
  );
};
