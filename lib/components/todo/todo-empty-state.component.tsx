import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type TodoEmptyStateProps = {
  /** True when a filter or search is narrowing the list, not when it's genuinely empty. */
  filtered: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
};

// Placeholder rows shaped like real todo cards — the same trick the Plan screen
// uses. The shape teaches what will land here better than an icon does.
function GhostRow({ opacity }: { opacity: number }) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-dashed border-line px-3.5 py-3"
      style={{ opacity }}
    >
      <View className="h-5 w-5 rounded-full border-2 border-line" />
      <View className="flex-1 gap-1.5">
        <View className="h-2 w-24 rounded-full bg-surface-alt" />
        <View className="h-2 w-14 rounded-full bg-surface-alt" />
      </View>
    </View>
  );
}

export const TodoEmptyState: React.FC<TodoEmptyStateProps> = ({ filtered, onAdd, onClearFilters }) => {
  const { colors } = useTheme();

  if (filtered) {
    return (
      <View className="flex-1 items-center justify-center px-8 pb-16">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
          <Feather name="filter" size={22} color={colors.inkMuted} />
        </View>
        <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>
          Nothing matches
        </Text>
        <Text
          className="mt-1.5 max-w-[260px] text-center text-ink-muted"
          style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}
        >
          No todos fit the filters you have on right now.
        </Text>
        <Pressable
          onPress={onClearFilters}
          className="mt-6 rounded-2xl border border-line px-5 py-3 active:opacity-70"
          accessibilityLabel="Clear filters"
        >
          <Text className="text-ink-soft" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
            Clear Filters
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center px-8 pb-16">
      <View className="w-full max-w-[300px] gap-2.5">
        <GhostRow opacity={0.9} />
        <GhostRow opacity={0.5} />
        <GhostRow opacity={0.22} />
      </View>

      <Text
        className="mt-9 text-ink"
        style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 19, letterSpacing: -0.3 }}
      >
        Nothing to do
      </Text>
      <Text
        className="mt-2 max-w-[290px] text-center text-ink-muted"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}
      >
        Add anything you need to remember. Give it a list, a due date, steps, or a repeat — or just a title and
        nothing else.
      </Text>

      <Pressable
        onPress={onAdd}
        className="mt-7 flex-row items-center gap-2 rounded-2xl bg-accent px-6 py-4 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Add a todo"
      >
        <Feather name="plus" size={15} color="#ffffff" />
        <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.2 }}>
          Add a todo
        </Text>
      </Pressable>
    </View>
  );
};
