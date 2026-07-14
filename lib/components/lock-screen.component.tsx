import type React from 'react';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { PinInput } from '@/lib/components/pin-input.component';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePinLockout } from '@/lib/hooks/use-pin-lockout.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { biometricIcon } from '@/lib/utils/biometric.utils';

const RADIUS = 54;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type LockoutTimerProps = { countdown: number; total: number };

const LockoutTimer: React.FC<LockoutTimerProps> = ({ countdown, total }) => {
  const { colors } = useTheme();
  const progress = useSharedValue(1 - (total - countdown) / total);
  const pulse = useSharedValue(1);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const countStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 200 }),
  }));

  useEffect(() => {
    progress.value = withTiming(countdown / total, { duration: 900, easing: Easing.linear });
  }, [countdown]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center gap-7">
      <Animated.View style={pulseStyle}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.line} strokeWidth={STROKE} fill="none" />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.accent}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>

        <Animated.View
          className="absolute left-0 top-0 items-center justify-center"
          style={[{ width: SIZE, height: SIZE }, countStyle]}
        >
          <Text
            className="text-ink"
            style={{ fontFamily: 'SpaceGrotesk_300Light', fontSize: 36, letterSpacing: -1 }}
          >
            {countdown}
          </Text>
          <Text
            className="text-ink-muted uppercase"
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, letterSpacing: 1.4, marginTop: -2 }}
          >
            sec
          </Text>
        </Animated.View>
      </Animated.View>

      <View className="items-center gap-1.5 px-10">
        <Text
          className="text-center text-ink"
          style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, letterSpacing: -0.2 }}
        >
          Too many attempts
        </Text>
        <Text
          className="text-center text-ink-soft"
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 }}
        >
          Too many wrong PINs.{'\n'}Please wait before trying again.
        </Text>
      </View>
    </Animated.View>
  );
};

export const LockScreen: React.FC = () => {
  const { biometricType } = useLock();
  const insets = useSafeAreaInsets();
  const {
    pin,
    setPin,
    shake,
    handleShakeDone,
    attempts,
    maxAttempts,
    lockedOut,
    countdown,
    lockoutTotal,
    bioUnavailable,
    handleComplete,
    handleBiometric,
  } = usePinLockout();

  const icon = biometricIcon(biometricType);

  return (
    <View
      className="flex-1 items-center bg-bg"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
    >
      <View className="mb-12 items-center gap-2">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, letterSpacing: -0.3 }}>
          Poisha
        </Text>
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, letterSpacing: -0.4 }}>
          Enter PIN
        </Text>
      </View>

      {bioUnavailable && (
        <View className="mx-8 mb-5 rounded-[10px] bg-accent-soft px-4 py-2.5">
          <Text className="text-center text-accent" style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 }}>
            Biometric unavailable. Check your device settings.
          </Text>
        </View>
      )}

      {lockedOut ? (
        <LockoutTimer countdown={countdown} total={lockoutTotal} />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} className="items-center">
          {attempts > 0 && (
            <Text
              className="mb-4 text-center text-accent"
              style={{ fontFamily: 'DMSans_400Regular', fontSize: 13 }}
            >
              Wrong PIN ({attempts}/{maxAttempts})
            </Text>
          )}
          <PinInput
            value={pin}
            onChange={setPin}
            onComplete={handleComplete}
            shake={shake}
            onShakeDone={handleShakeDone}
            leftKeyIcon={icon}
            onLeftKeyPress={handleBiometric}
          />
          {bioUnavailable && (
            <Text className="mt-5 text-ink-soft" style={{ fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
              Enter your PIN to unlock
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
};
