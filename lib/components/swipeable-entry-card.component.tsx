import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { EntryCard } from '@/lib/components/entry-card.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useSwipeToDelete } from '@/lib/hooks/use-swipe-to-delete.hook';
import type { TEntry } from '@/lib/types';

type SwipeableEntryCardProps = {
  entry: TEntry;
  onEdit: (entry: TEntry) => void;
  openCardId: SharedValue<string | null>;
};

export const SwipeableEntryCard: React.FC<SwipeableEntryCardProps> = ({ entry, onEdit, openCardId }) => {
  const { deleteEntry } = useEntries();
  const { notification } = useHaptics();

  const { pan, cardStyle, containerStyle, handleLayout, handlePress, actionWidth } = useSwipeToDelete(
    entry.id,
    openCardId,
    {
      onDelete: deleteEntry,
      onDeleteStart: () => notification(Haptics.NotificationFeedbackType.Warning),
    },
  );

  return (
    <Animated.View style={containerStyle} onLayout={handleLayout}>
      {/* Delete action revealed as card slides left.
          bottom: 10 aligns with the card body, excluding EntryCard's marginBottom. */}
      <View
        className="absolute right-0 top-0 items-center justify-center gap-1 rounded-r-[18px] bg-danger"
        style={{ bottom: 10, width: actionWidth }}
      >
        <Feather name="trash-2" size={20} color="#ffffff" />
        <Text className="text-white" style={{ fontFamily: 'DMSans_500Medium', fontSize: 12 }}>
          Delete
        </Text>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <EntryCard entry={entry} onClick={() => handlePress(() => onEdit(entry))} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};
