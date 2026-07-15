import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';

type MonthNavProps = {
  monthOffset: number;
  setMonthOffset: (offset: number) => void;
  monthLabel: string;
};

export function MonthNav({ monthOffset, setMonthOffset, monthLabel }: MonthNavProps) {
  const style = useFadeIn(70);

  return (
    <Animated.View className="flex-row items-center gap-3 px-6 pt-6" style={style}>
      <Pressable
        onPress={() => setMonthOffset(monthOffset - 1)}
        className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
        accessibilityLabel="Previous month"
      >
        <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 22, lineHeight: 26, marginTop: -1 }}>‹</Text>
      </Pressable>
      <View className="flex-1 items-center">
        <Text className="mb-0.5 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2 }}>Summary</Text>
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 15, letterSpacing: -0.1 }}>
          {monthLabel}
        </Text>
      </View>
      <Pressable
        onPress={() => setMonthOffset(Math.min(0, monthOffset + 1))}
        disabled={monthOffset >= 0}
        className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
        style={monthOffset >= 0 ? { opacity: 0.3 } : undefined}
        accessibilityLabel="Next month"
      >
        <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 22, lineHeight: 26, marginTop: -1 }}>›</Text>
      </Pressable>
    </Animated.View>
  );
}
