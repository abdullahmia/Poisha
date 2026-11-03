import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type TaxonomyHeaderProps = {
  title: string;
  subtitle?: string;
  addLabel: string;
  onAdd: () => void;
};

/**
 * Shared chrome for the three "manage a vocabulary" screens — lists,
 * priorities, tags. Same shape as the Categories screen's header, which is the
 * pattern users already know for this job.
 */
export const TaxonomyHeader: React.FC<TaxonomyHeaderProps> = ({ title, subtitle, addLabel, onAdd }) => {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center gap-3 px-6 pt-2">
      <Pressable
        onPress={() => router.back()}
        className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt active:opacity-60"
        accessibilityLabel="Back"
      >
        <Feather name="chevron-left" size={18} color={colors.inkSoft} />
      </Pressable>
      <View className="flex-1">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, letterSpacing: -0.5 }}>
          {title}
        </Text>
        {subtitle && (
          <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12.5 }}>
            {subtitle}
          </Text>
        )}
      </View>
      <Pressable
        onPress={onAdd}
        className="h-10 w-10 items-center justify-center rounded-full bg-accent active:opacity-80"
        accessibilityLabel={addLabel}
        style={{
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.28,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Feather name="plus" size={19} color="#ffffff" />
      </Pressable>
    </View>
  );
};

type ReorderButtonsProps = {
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
};

export const ReorderButtons: React.FC<ReorderButtonsProps> = ({ isFirst, isLast, onUp, onDown }) => {
  const { colors } = useTheme();

  return (
    <View className="flex-row items-center gap-1.5 overflow-hidden rounded-lg bg-surface-alt">
      <Pressable
        onPress={e => {
          // These sit inside a Pressable row that opens the edit form; without
          // this, reordering would also open the sheet on top of it.
          e.stopPropagation();
          onUp();
        }}
        disabled={isFirst}
        hitSlop={6}
        className="px-1.5 py-2"
        style={isFirst ? { opacity: 0.25 } : undefined}
        accessibilityLabel="Move up"
      >
        <Feather name="chevron-up" size={15} color={colors.inkSoft} />
      </Pressable>
      <View className="h-4 w-px bg-line" />
      <Pressable
        onPress={e => {
          e.stopPropagation();
          onDown();
        }}
        disabled={isLast}
        hitSlop={6}
        className="px-1.5 py-2"
        style={isLast ? { opacity: 0.25 } : undefined}
        accessibilityLabel="Move down"
      >
        <Feather name="chevron-down" size={15} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
};
