import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinInput } from '@/lib/components/pin-input.component';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { pinService } from '@/lib/services/pin.service';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

const RADIUS = 54;
const STROKE = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = (RADIUS + STROKE) * 2;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function LockoutTimer({ countdown, total }: { countdown: number; total: number }) {
  const { colors } = useTheme();
  const progress = useSharedValue(1 - (total - countdown) / total);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(countdown / total, {
      duration: 900,
      easing: Easing.linear,
    });
  }, [countdown]);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0,  { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const countStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 200 }),
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center', gap: 28 }}>
      {/* Ring */}
      <Animated.View style={pulseStyle}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track */}
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.line}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress arc */}
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

        {/* Number in center */}
        <Animated.View
          style={[{
            position: 'absolute', top: 0, left: 0,
            width: SIZE, height: SIZE,
            alignItems: 'center', justifyContent: 'center',
          }, countStyle]}
        >
          <Text style={{ fontFamily: 'SpaceGrotesk_300Light', fontSize: 36, color: colors.ink, letterSpacing: -1 }}>
            {countdown}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.inkMuted, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: -2 }}>
            sec
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Text */}
      <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 40 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, color: colors.ink, letterSpacing: -0.2, textAlign: 'center' }}>
          Too many attempts
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 20 }}>
          Too many wrong PINs.{'\n'}Please wait before trying again.
        </Text>
      </View>
    </Animated.View>
  );
}

export function LockScreen() {
  const { colors } = useTheme();
  const { unlock } = useLock();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lockoutTotal, setLockoutTotal] = useState(LOCKOUT_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pinService.getLockoutUntil().then(until => {
      if (!until) return;
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        const elapsed = LOCKOUT_SECONDS - remaining;
        setLockoutTotal(LOCKOUT_SECONDS);
        beginCountdown(remaining);
      } else {
        pinService.clearLockout();
      }
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function beginCountdown(seconds: number) {
    setLockedOut(true);
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setLockedOut(false);
          setAttempts(0);
          pinService.clearLockout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function startLockout() {
    const until = Date.now() + LOCKOUT_SECONDS * 1000;
    await pinService.setLockoutUntil(until);
    setLockoutTotal(LOCKOUT_SECONDS);
    beginCountdown(LOCKOUT_SECONDS);
  }

  async function handleComplete(entered: string) {
    const ok = await unlock(entered);
    if (!ok) {
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      if (next >= MAX_ATTEMPTS) startLockout();
    }
  }

  const { bg, ink, accent, inkSoft } = colors;

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32, alignItems: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: 48, gap: 8 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: ink, letterSpacing: -0.3 }}>ledger</Text>
        <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, color: ink, letterSpacing: -0.4 }}>Enter PIN</Text>
      </View>

      {lockedOut ? (
        <LockoutTimer countdown={countdown} total={lockoutTotal} />
      ) : (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)}>
          {attempts > 0 && (
            <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: accent, marginBottom: 16, textAlign: 'center' }}>
              Wrong PIN ({attempts}/{MAX_ATTEMPTS})
            </Text>
          )}
          <PinInput
            value={pin}
            onChange={v => setPin(v)}
            onComplete={handleComplete}
            shake={shake}
            onShakeDone={() => { setShake(false); setPin(''); }}
          />
        </Animated.View>
      )}
    </View>
  );
}
