import { useSharedValue, withSpring } from 'react-native-reanimated';

/** Spring-based press-in/press-out scale feedback, composable with other animated scales. */
export function usePressScale(pressedScale = 0.88) {
  const scale = useSharedValue(1);

  const onPressIn = () => {
    scale.value = withSpring(pressedScale, { damping: 16, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  };

  return { scale, onPressIn, onPressOut };
}
