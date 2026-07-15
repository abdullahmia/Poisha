import { Pressable, Text, View } from 'react-native';
import type { TPeriod, TPeriodRange } from '@/lib/utils/date.util';

type PeriodRangeNavProps = {
  period: TPeriod;
  setOffset: (updater: (offset: number) => number) => void;
  range: TPeriodRange;
  canGoForward: boolean;
};

export function PeriodRangeNav({ period, setOffset, range, canGoForward }: PeriodRangeNavProps) {
  if (period === 'all') return null;

  return (
    <View className="mt-4 flex-row items-center gap-3 px-5">
      <Pressable
        onPress={() => setOffset(o => o - 1)}
        className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        accessibilityLabel="Previous period"
      >
        <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 24, lineHeight: 28, marginTop: -1 }}>‹</Text>
      </Pressable>
      <View className="flex-1 items-center">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16, letterSpacing: -0.2 }}>
          {range.label}
        </Text>
        {range.label !== range.sublabel && (
          <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11 }}>
            {range.sublabel}
          </Text>
        )}
      </View>
      <Pressable
        onPress={() => setOffset(o => Math.min(0, o + 1))}
        disabled={!canGoForward}
        className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        style={!canGoForward ? { opacity: 0.25 } : undefined}
        accessibilityLabel="Next period"
      >
        <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 24, lineHeight: 28, marginTop: -1 }}>›</Text>
      </Pressable>
    </View>
  );
}
