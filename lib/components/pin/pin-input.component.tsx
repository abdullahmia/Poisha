import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { clsx } from 'clsx';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const ERROR_COLOR = '#ef4444';

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
  const errorFlash = useSharedValue(0);
  const successScale = useSharedValue(1);

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }, { scale: successScale.value }],
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
      errorFlash.value = withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 340 }));
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
    if (next.length === 4) {
      successScale.value = withSequence(withTiming(1.08, { duration: 100 }), withTiming(1, { duration: 150 }));
      setTimeout(() => onComplete(next), 150);
    }
  }

  return (
    <View className="items-center gap-10">
      <Animated.View className="flex-row gap-4" style={dotsStyle}>
        {[0, 1, 2, 3].map(i => (
          <PinDot key={i} filled={i < value.length} colors={colors} errorFlash={errorFlash} />
        ))}
      </Animated.View>

      <View className="flex-row flex-wrap justify-center gap-4" style={{ width: 72 * 3 + 16 * 2 }}>
        {KEYS.map((key, idx) => {
          if (key === '') {
            if (leftKeyIcon) {
              return (
                <PinPadButton key={idx} colors={colors} onPress={onLeftKeyPress} transparentBg>
                  <HugeiconsIcon icon={leftKeyIcon} size={32} color={colors.inkSoft} />
                </PinPadButton>
              );
            }
            return <View key={idx} className="h-[72px] w-[72px]" />;
          }
          return <PinKey key={idx} label={key} colors={colors} onPress={() => press(key)} />;
        })}
      </View>
    </View>
  );
};

type PinDotProps = {
  filled: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  errorFlash: ReturnType<typeof useSharedValue<number>>;
};

function PinDot({ filled, colors, errorFlash }: PinDotProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withTiming(1.3, { duration: 90 }), withTiming(1, { duration: 120 }));
  }, [filled]);

  const style = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(errorFlash.value, [0, 1], [filled ? colors.ink : 'transparent', ERROR_COLOR]),
      borderColor: interpolateColor(errorFlash.value, [0, 1], [filled ? colors.ink : colors.line, ERROR_COLOR]),
      transform: [{ scale: scale.value }],
    }),
    [filled, colors],
  );

  return <Animated.View className="h-5 w-5 rounded-full border-2" style={style} />;
}

type PinPadButtonProps = {
  colors: ReturnType<typeof useTheme>['colors'];
  onPress?: () => void;
  transparentBg?: boolean;
  children: React.ReactNode;
};

function PinPadButton({ colors, onPress, transparentBg, children }: PinPadButtonProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSequence(withTiming(0.85, { duration: 80 }), withTiming(1, { duration: 150 }));
    onPress?.();
  }

  const idleBg = transparentBg ? 'transparent' : colors.surface;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className={clsx('h-[72px] w-[72px] items-center justify-center rounded-full', !transparentBg && 'border border-line')}
      style={[{ backgroundColor: pressed ? colors.surfaceAlt : idleBg }, scaleStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

type PinKeyProps = {
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
};

function PinKey({ label, colors, onPress }: PinKeyProps) {
  return (
    <PinPadButton colors={colors} onPress={onPress}>
      {label === '⌫' ? (
        <HugeiconsIcon icon={Delete02Icon} size={22} color={colors.ink} />
      ) : (
        <Text className="text-ink" style={{ fontFamily: 'DMSans_500Medium', fontSize: 24 }}>
          {label}
        </Text>
      )}
    </PinPadButton>
  );
}
