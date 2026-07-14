import type { LayoutChangeEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const ACTION_WIDTH = 80;
const THRESHOLD = ACTION_WIDTH;

type UseSwipeToDeleteOptions = {
  onDelete: (id: string) => void;
  onDeleteStart?: () => void;
};

export function useSwipeToDelete(
  id: string,
  openCardId: SharedValue<string | null>,
  { onDelete, onDeleteStart }: UseSwipeToDeleteOptions,
) {
  const translateX = useSharedValue(0);
  const measuredHeight = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  // When another card opens, snap this one closed
  useAnimatedReaction(
    () => openCardId.value,
    (current, previous) => {
      if (previous === id && current !== id) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    },
  );

  function handleDelete() {
    onDeleteStart?.();
    if (measuredHeight.value === 0) {
      onDelete(id);
      return;
    }
    measuredHeight.value = withTiming(0, { duration: 240 }, () => {
      runOnJS(onDelete)(id);
    });
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      openCardId.value = id;
    })
    .onUpdate(e => {
      if (isDeleting.value) return;
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd(() => {
      if (isDeleting.value) return;
      if (translateX.value < -THRESHOLD) {
        isDeleting.value = true;
        translateX.value = withTiming(-500, { duration: 220 }, () => {
          runOnJS(handleDelete)();
        });
      } else if (translateX.value < -ACTION_WIDTH / 2) {
        translateX.value = withSpring(-ACTION_WIDTH, { damping: 20, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // When measuredHeight > 0, constrain height so the collapse animation
  // shrinks the row to zero without a layout jump.
  const containerStyle = useAnimatedStyle(() => {
    if (measuredHeight.value === 0) return { overflow: 'hidden' as const };
    return { height: measuredHeight.value, overflow: 'hidden' as const };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    if (measuredHeight.value === 0) {
      measuredHeight.value = e.nativeEvent.layout.height;
    }
  };

  function handlePress(onEdit: () => void) {
    if (translateX.value < 0) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      return;
    }
    onEdit();
  }

  return { pan, cardStyle, containerStyle, handleLayout, handlePress, actionWidth: ACTION_WIDTH };
}
