import { Feather } from '@expo/vector-icons';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { EntryCard } from '@/lib/components/entry-card.component';
import type { Entry } from '@/lib/types/entry.type';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Text, View } from 'react-native';

const ACTION_WIDTH = 80;
const THRESHOLD = ACTION_WIDTH;

interface Props {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  openCardId: SharedValue<string | null>;
}

export function SwipeableEntryCard({ entry, onEdit, openCardId }: Props) {
  const { deleteEntry } = useEntries();
  const { notification } = useHaptics();

  const translateX = useSharedValue(0);
  const measuredHeight = useSharedValue(0);
  const isDeleting = useSharedValue(false);

  // When another card opens, snap this one closed
  useAnimatedReaction(
    () => openCardId.value,
    (current, previous) => {
      if (previous === entry.id && current !== entry.id) {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    },
  );

  function handleDelete() {
    notification(Haptics.NotificationFeedbackType.Warning);
    if (measuredHeight.value === 0) {
      deleteEntry(entry.id);
      return;
    }
    measuredHeight.value = withTiming(0, { duration: 240 }, () => {
      runOnJS(deleteEntry)(entry.id);
    });
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onBegin(() => {
      openCardId.value = entry.id;
    })
    .onUpdate((e) => {
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

  function handlePress() {
    if (translateX.value < 0) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      return;
    }
    onEdit(entry);
  }

  return (
    <Animated.View
      style={containerStyle}
      onLayout={(e) => {
        if (measuredHeight.value === 0) {
          measuredHeight.value = e.nativeEvent.layout.height;
        }
      }}
    >
      {/* Delete action revealed as card slides left.
          bottom: 10 aligns with the card body, excluding EntryCard's marginBottom. */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 10,
          width: ACTION_WIDTH,
          backgroundColor: '#e84040',
          borderTopRightRadius: 18,
          borderBottomRightRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Feather name="trash-2" size={20} color="#ffffff" />
        <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: '#ffffff' }}>
          Delete
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <EntryCard entry={entry} onClick={handlePress} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
