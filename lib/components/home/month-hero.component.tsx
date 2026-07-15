import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';

type MonthHeroProps = {
  total: number;
  count: number;
  txCount: number;
  avgDay: number;
};

export function MonthHero({ total, count, txCount, avgDay }: MonthHeroProps) {
  const { fmt, fmtFull } = useLocale();
  const style = useFadeIn(140);

  return (
    <Animated.View className="items-center px-6 pb-7 pt-5" style={style}>
      <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_300Light', fontSize: 56, letterSpacing: -1.5, lineHeight: 62 }}>
        {fmtFull(total)}
      </Text>
      <View className="mt-3.5 flex-row flex-wrap items-center justify-center gap-2 px-2">
        <Text className="text-ink-soft" style={{ fontSize: 12 }}>
          <Text className="text-ink" style={{ fontWeight: '500' }}>{count}</Text>
          {' entries'}
        </Text>
        <Text className="text-line" style={{ fontSize: 12 }}>·</Text>
        <Text className="text-ink-soft" style={{ fontSize: 12 }}>
          <Text className="text-ink" style={{ fontWeight: '500' }}>{txCount}</Text>
          {' items'}
        </Text>
        <Text className="text-line" style={{ fontSize: 12 }}>·</Text>
        <Text className="text-ink-soft" style={{ fontSize: 12 }}>
          <Text className="text-ink" style={{ fontWeight: '500' }}>{fmt(Math.round(avgDay))}</Text>
          {' / day'}
        </Text>
      </View>
    </Animated.View>
  );
}
