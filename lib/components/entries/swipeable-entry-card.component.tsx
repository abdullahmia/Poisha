import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { type SharedValue } from 'react-native-reanimated';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useSwipeToDelete } from '@/lib/hooks/use-swipe-to-delete.hook';
import type { TEntry } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { formatDateLong } from '@/lib/utils/date.util';
import { EntryCard } from './entry-card.component';

type SwipeableEntryCardProps = {
  entry: TEntry;
  onEdit: (entry: TEntry) => void;
  openCardId: SharedValue<string | null>;
};

export const SwipeableEntryCard: React.FC<SwipeableEntryCardProps> = ({ entry, onEdit, openCardId }) => {
  const { deleteEntry } = useEntries();
  const { notification } = useHaptics();
  const { fmtFull } = useLocale();

  const [confirmOpen, setConfirmOpen] = useState(false);
  // ConfirmModal calls onClose after *either* action, so a plain onClose
  // handler would cancel the swipe right after the user confirmed it.
  const decided = useRef(false);

  const {
    pan,
    cardStyle,
    containerStyle,
    handleLayout,
    handlePress,
    confirmDelete,
    cancelDelete,
    actionWidth,
  } = useSwipeToDelete(entry.id, openCardId, {
    onDelete: deleteEntry,
    onDeleteStart: () => notification(Haptics.NotificationFeedbackType.Warning),
    onConfirmRequest: () => {
      decided.current = false;
      setConfirmOpen(true);
    },
  });

  const total = entry.amounts.reduce((a, b) => a + b, 0);

  return (
    <>
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

      <ConfirmModal
        visible={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          // Dismissed by backdrop or Cancel — put the row back.
          if (!decided.current) cancelDelete();
        }}
        title="Delete this entry?"
        message={`${fmtFull(total)}${entry.note.trim() ? ` · ${entry.note.trim()}` : ''}\n${formatDateLong(entry.date)}\n\nThis cannot be undone.`}
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
