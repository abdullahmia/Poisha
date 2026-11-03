import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type TodoCheckboxProps = {
  checked: boolean;
  /** Tint when checked — the list's colour, or the app accent. */
  color: string;
  size?: number;
  onPress: () => void;
  accessibilityLabel: string;
};

export const TodoCheckbox: React.FC<TodoCheckboxProps> = ({
  checked,
  color,
  size = 24,
  onPress,
  accessibilityLabel,
}) => {
  const { colors } = useTheme();
  const fill = useSharedValue(checked ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    fill.value = withTiming(checked ? 1 : 0, { duration: 160 });
    // Only ticking *on* bounces. A satisfying confirmation when completing
    // something; noise when correcting a mis-tap.
    if (checked) {
      pop.value = withSequence(
        withSpring(1.22, { damping: 9, stiffness: 340 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
  }, [checked]);

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
    backgroundColor: fill.value > 0.5 ? color : 'transparent',
    borderColor: fill.value > 0.5 ? color : colors.line,
  }));

  const tickStyle = useAnimatedStyle(() => ({ opacity: fill.value }));

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-60"
    >
      <Animated.View
        className="items-center justify-center rounded-full border-2"
        style={[{ width: size, height: size }, boxStyle]}
      >
        <Animated.View style={tickStyle}>
          <Feather name="check" size={size * 0.55} color="#ffffff" />
        </Animated.View>
      </Animated.View>
      {/* Keeps the row height stable while the box scales past its bounds. */}
      <View style={{ width: size, height: 0 }} />
    </Pressable>
  );
};
