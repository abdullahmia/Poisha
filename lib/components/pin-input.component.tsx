import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PinInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete: (pin: string) => void;
  shake?: boolean;
  onShakeDone?: () => void;
  leftKeyIcon?: typeof Delete02Icon | null;
  onLeftKeyPress?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinInput({ value, onChange, onComplete, shake, onShakeDone, leftKeyIcon, onLeftKeyPress }: PinInputProps) {
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
        withTiming(8,  { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8,  { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8,  { duration: 60 }),
        withTiming(0,  { duration: 60 }),
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
    <View style={{ alignItems: 'center', gap: 40 }}>
      {/* Dots */}
      <Animated.View style={[{ flexDirection: 'row', gap: 16 }, dotsStyle]}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: i < value.length ? colors.ink : 'transparent',
              borderWidth: 2,
              borderColor: i < value.length ? colors.ink : colors.line,
            }}
          />
        ))}
      </Animated.View>

      {/* Keypad */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 72 * 3 + 16 * 2, gap: 16, justifyContent: 'center' }}>
        {KEYS.map((key, idx) => {
          if (key === '') {
            if (leftKeyIcon) {
              return (
                <Pressable
                  key={idx}
                  onPress={onLeftKeyPress}
                  style={({ pressed }) => ({
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <HugeiconsIcon icon={leftKeyIcon} size={32} color={colors.inkSoft} />
                </Pressable>
              );
            }
            return <View key={idx} style={{ width: 72, height: 72 }} />;
          }
          return (
            <Pressable
              key={idx}
              onPress={() => press(key)}
              style={({ pressed }) => ({
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              {key === '⌫' ? (
                <HugeiconsIcon icon={Delete02Icon} size={22} color={colors.ink} />
              ) : (
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 24, color: colors.ink }}>
                  {key}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
