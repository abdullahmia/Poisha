import type React from 'react';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type OnboardingProgressProps = {
  activeIndex: number;
  totalSteps: number;
};

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ activeIndex, totalSteps }) => {
  return (
    <View className="flex-row items-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <ProgressDot key={i} filled={i <= activeIndex} active={i === activeIndex} />
      ))}
    </View>
  );
};

function ProgressDot({ filled, active }: { filled: boolean; active: boolean }) {
  const { colors } = useTheme();
  const fill = useSharedValue(filled ? 1 : 0);
  const width = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fill.value = withTiming(filled ? 1 : 0, { duration: 260 });
  }, [filled]);

  useEffect(() => {
    width.value = withTiming(active ? 1 : 0, { duration: 260 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(width.value, [0, 1], [6, 20]),
    backgroundColor: interpolateColor(fill.value, [0, 1], [colors.line, colors.accent]),
  }));

  return <Animated.View className="h-1.5 rounded-full" style={style} />;
}
