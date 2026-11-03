import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodoView } from '@/lib/utils/todo-view.util';

type TodoHeaderProps = {
  view: TTodoView;
  showProgressBar: boolean;
  searchOpen: boolean;
  filterActive: boolean;
  onToggleSearch: () => void;
  onOpenViewOptions: () => void;
};

function StatPill({ label, color, icon }: { label: string; color: string; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: `${color}1f` }}>
      <Feather name={icon} size={11} color={color} />
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color, letterSpacing: -0.1 }}>{label}</Text>
    </View>
  );
}

export const TodoHeader: React.FC<TodoHeaderProps> = ({
  view,
  showProgressBar,
  searchOpen,
  filterActive,
  onToggleSearch,
  onOpenViewOptions,
}) => {
  const { colors } = useTheme();

  const total = view.openCount + view.doneCount;
  const ratio = total === 0 ? 0 : view.doneCount / total;

  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 420 });
  }, [ratio]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View className="px-6 pt-7">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1">
          <Text
            className="uppercase text-ink-muted"
            style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_500Medium' }}
          >
            Tasks
          </Text>
          <Text
            className="mt-1 text-ink"
            style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, letterSpacing: -0.5 }}
          >
            Todo
          </Text>
        </View>

        <View className="flex-row items-center gap-2 pt-1">
          <Pressable
            onPress={onToggleSearch}
            className="h-9 w-9 items-center justify-center rounded-full border border-line active:opacity-60"
            style={searchOpen ? { backgroundColor: colors.accentSoft, borderColor: colors.accent } : undefined}
            accessibilityLabel="Search todos"
          >
            <Feather name="search" size={15} color={searchOpen ? colors.accent : colors.inkSoft} />
          </Pressable>
          <Pressable
            onPress={onOpenViewOptions}
            className="h-9 w-9 items-center justify-center rounded-full border border-line active:opacity-60"
            accessibilityLabel="View options"
          >
            <Feather name="sliders" size={15} color={colors.inkSoft} />
            {/* A filter that hides todos must be visible from the list itself —
                otherwise an empty screen reads as "nothing left to do". */}
            {filterActive && (
              <View
                className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {showProgressBar && total > 0 && (
        <View className="mt-5">
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 12.5 }}>
              {view.doneCount} of {total} done
            </Text>
            <Text className="text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 12.5 }}>
              {Math.round(ratio * 100)}%
            </Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <Animated.View className="h-full rounded-full bg-accent" style={fillStyle} />
          </View>
        </View>
      )}

      {(view.overdueCount > 0 || view.dueTodayCount > 0) && (
        <View className="mt-4 flex-row flex-wrap gap-2">
          {view.overdueCount > 0 && (
            <StatPill
              icon="alert-circle"
              color={colors.danger}
              label={`${view.overdueCount} overdue`}
            />
          )}
          {view.dueTodayCount > 0 && (
            <StatPill icon="calendar" color={colors.accent} label={`${view.dueTodayCount} due today`} />
          )}
        </View>
      )}
    </View>
  );
};
