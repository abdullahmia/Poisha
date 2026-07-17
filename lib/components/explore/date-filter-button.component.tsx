import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { formatDateLong } from '@/lib/utils/date.util';

type DateFilterButtonProps = {
  value: string | null;
  onPress: () => void;
  onClear: () => void;
};

export function DateFilterButton({ value, onPress, onClear }: DateFilterButtonProps) {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-center gap-2">
      {value && (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-alt"
          accessibilityLabel="Clear date filter"
        >
          <Feather name="x" size={18} color={colors.inkSoft} />
        </Pressable>
      )}
      <Pressable
        onPress={onPress}
        className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-alt"
        accessibilityLabel={value ? `Filtering by ${formatDateLong(value)}` : 'Filter by date'}
      >
        <Feather name="calendar" size={18} color={value ? colors.accent : colors.inkSoft} />
        {value && <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent" />}
      </Pressable>
    </View>
  );
}
