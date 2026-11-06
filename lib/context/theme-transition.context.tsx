import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

export interface ThemeTransitionCtxValue {
  /**
   * Swaps the theme behind a cover instead of on the spot. `commit` is what
   * actually changes the theme. It runs only once the cover is fully opaque, so
   * the swap itself is never seen.
   */
  transition: (fromColor: string, toColor: string, commit: () => void) => void;
}

export const ThemeTransitionCtx = createContext<ThemeTransitionCtxValue | null>(null);

const COVER_MS = 140;
const MORPH_MS = 200;
// Long enough after the commit for the re-render to land before any of the new
// theme shows through. Well under the morph, so the cover is still opaque then.
const REVEAL_DELAY_MS = 120;
const REVEAL_MS = 240;
// If the Modal never reports itself shown, the theme must still change.
const COMMIT_FALLBACK_MS = 600;

type TPhase = 'idle' | 'covering' | 'revealing';

export function ThemeTransitionProvider({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const phaseRef = useRef<TPhase>('idle');
  const commitRef = useRef<(() => void) | null>(null);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opacity = useSharedValue(0);
  const progress = useSharedValue(0);
  const fromColor = useSharedValue('#000000');
  const toColor = useSharedValue('#000000');

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: interpolateColor(progress.value, [0, 1], [fromColor.value, toColor.value]),
  }));

  useEffect(() => () => {
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
  }, []);

  const finish = useCallback(() => {
    phaseRef.current = 'idle';
    setVisible(false);
  }, []);

  const reveal = useCallback(() => {
    if (phaseRef.current !== 'covering') return;
    if (fallbackRef.current) clearTimeout(fallbackRef.current);
    fallbackRef.current = null;
    phaseRef.current = 'revealing';

    commitRef.current?.();
    commitRef.current = null;

    progress.value = withTiming(1, { duration: MORPH_MS, easing: Easing.inOut(Easing.quad) });
    opacity.value = withDelay(
      REVEAL_DELAY_MS,
      withTiming(0, { duration: REVEAL_MS, easing: Easing.out(Easing.quad) }, finished => {
        if (finished) runOnJS(finish)();
      }),
    );
  }, [finish, opacity, progress]);

  // Starts from the Modal's onShow rather than from `transition()`. Native
  // modals take a few frames to appear, and a cover that starts fading while
  // still offscreen pops in partway through.
  const cover = useCallback(() => {
    if (phaseRef.current !== 'covering') return;
    opacity.value = withTiming(1, { duration: COVER_MS, easing: Easing.out(Easing.quad) }, finished => {
      if (finished) runOnJS(reveal)();
    });
  }, [opacity, reveal]);

  const transition = useCallback(
    (from: string, to: string, commit: () => void) => {
      if (reduceMotion) {
        commit();
        return;
      }

      // The cover blocks touches once it is up, but a second tap can still
      // land in the frames before it appears. While covering, the newest choice
      // replaces the old one. Once revealing, it is too late to hide the swap,
      // so it just applies.
      if (phaseRef.current === 'covering') {
        commitRef.current = commit;
        toColor.value = to;
        return;
      }
      if (phaseRef.current === 'revealing') {
        commit();
        return;
      }

      phaseRef.current = 'covering';
      commitRef.current = commit;
      fromColor.value = from;
      toColor.value = to;
      progress.value = 0;
      opacity.value = 0;
      setVisible(true);
      fallbackRef.current = setTimeout(reveal, COMMIT_FALLBACK_MS);
    },
    [reduceMotion, fromColor, toColor, progress, opacity, reveal],
  );

  return (
    <ThemeTransitionCtx.Provider value={{ transition }}>
      {children}
      {/* A Modal (like the lock screen below) is required to reliably render
          above expo-router's Stack, which presents screens as native view
          controllers via react-native-screens — a plain sibling View is not
          guaranteed to composite on top of that. */}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        navigationBarTranslucent
        onShow={cover}
        onRequestClose={() => {}}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, overlayStyle]} />
      </Modal>
    </ThemeTransitionCtx.Provider>
  );
}

export function useThemeTransition() {
  const ctx = useContext(ThemeTransitionCtx);
  if (!ctx) throw new Error('useThemeTransition must be used within ThemeTransitionProvider');
  return ctx;
}
