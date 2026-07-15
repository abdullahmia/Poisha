import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { clsx } from 'clsx';
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type PinInputProps = {
  value: string;
  onChange: (val: string) => void;
  onComplete: (pin: string) => void;
  shake?: boolean;
  onShakeDone?: () => void;
  leftKeyIcon?: typeof Delete02Icon | null;
  onLeftKeyPress?: () => void;
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  onComplete,
  shake,
  onShakeDone,
  leftKeyIcon,
  onLeftKeyPress,
}) => {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const shakeX = useSharedValue(0);

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    if (shake) {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      const t = setTimeout(() => onShakeDone?.(), 420);
      return () => clearTimeout(t);
    }
  }, [shake]);

  function press(key: string) {
    if (key === '⌫') {
      impact();
      onChange(value.slice(0, -1));
      return;
    }
    if (key === '' || value.length >= 4) return;
    impact();
    const next = value + key;
    onChange(next);
    if (next.length === 4) onComplete(next);
  }

  return (
    <View className="items-center gap-10">
      <Animated.View className="flex-row gap-4" style={dotsStyle}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            className={clsx('h-5 w-5 rounded-full border-2', i < value.length ? 'bg-ink border-ink' : 'border-line')}
          />
        ))}
      </Animated.View>

      <View className="flex-row flex-wrap justify-center gap-4" style={{ width: 72 * 3 + 16 * 2 }}>
        {KEYS.map((key, idx) => {
          if (key === '') {
            if (leftKeyIcon) {
              return (
                <Pressable
                  key={idx}
                  onPress={onLeftKeyPress}
                  className="h-[72px] w-[72px] items-center justify-center rounded-full"
                  style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : 'transparent' })}
                >
                  <HugeiconsIcon icon={leftKeyIcon} size={32} color={colors.inkSoft} />
                </Pressable>
              );
            }
            return <View key={idx} className="h-[72px] w-[72px]" />;
          }
          return (
            <Pressable
              key={idx}
              onPress={() => press(key)}
              className="h-[72px] w-[72px] items-center justify-center rounded-full border border-line"
              style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
            >
              {key === '⌫' ? (
                <HugeiconsIcon icon={Delete02Icon} size={22} color={colors.ink} />
              ) : (
                <Text className="text-ink" style={{ fontFamily: 'DMSans_500Medium', fontSize: 24 }}>
                  {key}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
