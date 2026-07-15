import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type BudgetBarProps = {
  spent: number;
  budget: number;
};

export function BudgetBar({ spent, budget }: BudgetBarProps) {
  const { colors } = useTheme();
  const { fmtFull } = useLocale();
  const wrapperStyle = useFadeIn(210);
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const exceeded = percent > 100;
  const displayPercent = Math.round(percent);
  const [trackWidth, setTrackWidth] = useState(0);
  const fillSv = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      fillSv.value = withTiming(
        (Math.min(percent, 100) / 100) * trackWidth,
        { duration: 400, easing: Easing.out(Easing.quad) },
      );
    }
  }, [percent, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillSv.value }));

  return (
    <Animated.View className="px-6 pb-5 pt-1" style={wrapperStyle}>
      <View
        className="h-1.5 overflow-hidden rounded-full bg-line"
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          className="h-1.5 rounded-full"
          style={[{ backgroundColor: exceeded ? colors.danger : colors.accent }, fillStyle]}
        />
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <Text
          className={exceeded ? 'text-danger' : 'text-ink-muted'}
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}
        >
          {fmtFull(spent)} spent
        </Text>
        <Text
          className={exceeded ? 'text-danger' : 'text-ink-muted'}
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}
        >
          {displayPercent}% of {fmtFull(budget)}
        </Text>
      </View>
    </Animated.View>
  );
}
