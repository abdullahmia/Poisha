import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useSwipeToDelete } from '@/lib/hooks/use-swipe-to-delete.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodo, TTodoList, TTodoPrefs, TTodoPriority, TTodoTag } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { TodoItemCard } from './todo-item-card.component';

type SwipeableTodoCardProps = {
  todo: TTodo;
  prefs: TTodoPrefs;
  lists: TTodoList[];
  priorities: TTodoPriority[];
  tags: TTodoTag[];
  today: string;
  openCardId: SharedValue<string | null>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (todo: TTodo) => void;
};

const COMPLETE_THRESHOLD = 80;

/**
 * Swipe behaviour is a preference, so this picks a branch per todo rather than
 * baking one in.
 *
 * Complete-on-swipe gets its own gesture instead of reusing
 * `useSwipeToDelete`: that hook collapses the row to zero height as part of
 * finishing, which is right for a row that is going away and wrong for one that
 * may stay put — under "Show completed inline" a collapsed row would never come
 * back.
 */
export const SwipeableTodoCard: React.FC<SwipeableTodoCardProps> = props => {
  const { todo, prefs, openCardId, onToggle, onDelete, onPress } = props;

  if (prefs.swipeAction === 'complete') return <CompleteSwipeCard {...props} />;
  if (prefs.swipeAction === 'none') {
    return <TodoItemCard {...props} onToggle={onToggle} onPress={onPress} />;
  }
  return <DeleteSwipeCard {...props} openCardId={openCardId} onDelete={onDelete} todo={todo} />;
};

const DeleteSwipeCard: React.FC<SwipeableTodoCardProps> = props => {
  const { todo, prefs, openCardId, onDelete, onPress } = props;
  const { notification } = useHaptics();

  const [confirmOpen, setConfirmOpen] = useState(false);
  // ConfirmModal fires onClose after *either* action, so a plain onClose
  // handler would cancel the swipe right after the user confirmed it.
  const decided = useRef(false);

  const { pan, cardStyle, containerStyle, handleLayout, handlePress, confirmDelete, cancelDelete, actionWidth } =
    useSwipeToDelete(todo.id, openCardId, {
      onDelete,
      onDeleteStart: () => notification(Haptics.NotificationFeedbackType.Warning),
      onConfirmRequest: prefs.confirmDelete
        ? () => {
            decided.current = false;
            setConfirmOpen(true);
          }
        : undefined,
    });

  return (
    <>
      <Animated.View style={containerStyle} onLayout={handleLayout}>
        {/* bottom: 8 matches the card's mb-2, so the action aligns with the
            card body rather than the gap beneath it. */}
        <View
          className="absolute right-0 top-0 items-center justify-center gap-1 rounded-r-[16px] bg-danger"
          style={{ bottom: 8, width: actionWidth }}
        >
          <Feather name="trash-2" size={18} color="#ffffff" />
          <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium', fontSize: 11 }}>
            Delete
          </Text>
        </View>

        <GestureDetector gesture={pan}>
          <Animated.View style={cardStyle}>
            <TodoItemCard {...props} onPress={() => handlePress(() => onPress(todo))} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>

      <ConfirmModal
        visible={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          // Dismissed by backdrop or Cancel — put the row back.
          if (!decided.current) cancelDelete();
        }}
        title="Delete this todo?"
        message={`"${todo.title}"\n\nThis cannot be undone.`}
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Delete',
            variant: 'danger',
            onPress: () => {
              decided.current = true;
              confirmDelete();
            },
          },
        ]}
      />
    </>
  );
};

const CompleteSwipeCard: React.FC<SwipeableTodoCardProps> = props => {
  const { todo, onToggle, onPress } = props;
  const { colors } = useTheme();
  const { notification } = useHaptics();

  const translateX = useSharedValue(0);

  function fire() {
    notification(Haptics.NotificationFeedbackType.Success);
    onToggle(todo.id);
  }

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate(e => {
      translateX.value = Math.min(0, e.translationX);
    })
    .onEnd(() => {
      if (translateX.value < -COMPLETE_THRESHOLD) runOnJS(fire)();
      // Always springs home: the row's new state is shown by the checkbox
      // filling in, not by the row staying pushed aside.
      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const actionStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / COMPLETE_THRESHOLD),
  }));

  const label = todo.completed ? 'Undo' : 'Done';

  return (
    <View className="overflow-hidden">
      <Animated.View
        className="absolute right-0 top-0 items-center justify-center gap-1 rounded-r-[16px]"
        style={[{ bottom: 8, width: 80, backgroundColor: colors.accent }, actionStyle]}
      >
        <Feather name={todo.completed ? 'rotate-ccw' : 'check'} size={18} color="#ffffff" />
        <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium', fontSize: 11 }}>
          {label}
        </Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <TodoItemCard {...props} onPress={onPress} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
