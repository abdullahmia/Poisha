import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type BudgetBarProps = {
  spent: number;
  /** Planned (future-dated) spend in the same month. Drawn as a ghost extension
   *  of the fill — never folded into `spent`, which stays actual-only. */
  planned: number;
  budget: number;
};

export function BudgetBar({ spent, planned, budget }: BudgetBarProps) {
  const { colors } = useTheme();
  const { fmtFull } = useLocale();
  const wrapperStyle = useFadeIn(210);
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const exceeded = percent > 100;
  const displayPercent = Math.round(percent);
  const projectedPercent = budget > 0 ? ((spent + planned) / budget) * 100 : 0;
  const [trackWidth, setTrackWidth] = useState(0);
  const fillSv = useSharedValue(0);
  const projectedSv = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      fillSv.value = withTiming(
        (Math.min(percent, 100) / 100) * trackWidth,
        { duration: 400, easing: Easing.out(Easing.quad) },
      );
      projectedSv.value = withTiming(
        (Math.min(projectedPercent, 100) / 100) * trackWidth,
        { duration: 400, easing: Easing.out(Easing.quad) },
      );
    }
  }, [percent, projectedPercent, trackWidth, fillSv, projectedSv]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillSv.value }));
  const projectedStyle = useAnimatedStyle(() => ({ width: projectedSv.value }));

  return (
    <Animated.View className="px-6 pb-5 pt-1" style={wrapperStyle}>
      <View
        className="h-1.5 overflow-hidden rounded-full bg-line"
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        {planned > 0 && (
          <Animated.View
            className="absolute left-0 top-0 h-1.5 rounded-full opacity-30"
            style={[{ backgroundColor: colors.accent }, projectedStyle]}
          />
        )}
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
      {/* Deliberately ink-muted even when the projection is over budget — this
          is a forecast, and colouring it danger would read as already-exceeded. */}
      {planned > 0 && (
        <Text className="mt-1 text-ink-muted" style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}>
          +{fmtFull(planned)} planned · {Math.round(projectedPercent)}% projected
        </Text>
      )}
    </Animated.View>
  );
}
