import { HugeiconsIcon } from '@hugeicons/react-native';
import { clsx } from 'clsx';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePinWizard } from '@/lib/hooks/use-pin-wizard.hook';
import { usePressScale } from '@/lib/hooks/use-press-scale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';
import { OnboardingProgress } from './onboarding-progress.component';
import { PinInput } from './pin-input.component';

type OuterStep = 'welcome' | 'wizard' | 'biometric';

const STEP_IN = FadeInRight.duration(320);
const STEP_OUT = FadeOutLeft.duration(200);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PinOnboarding: React.FC = () => {
  const { colors } = useTheme();
  const { enableLock, biometricType, enableBiometric } = useLock();
  const { authenticate } = useBiometric();
  const { notification } = useHaptics();
  const insets = useSafeAreaInsets();
  const [outerStep, setOuterStep] = useState<OuterStep>('welcome');
  const [confirmedPin, setConfirmedPin] = useState('');

  const hasBiometric = biometricType !== 'none';
  const totalSteps = hasBiometric ? 3 : 2;
  const activeIndex = outerStep === 'welcome' ? 0 : outerStep === 'wizard' ? 1 : 2;

  const wizard = usePinWizard(async pin => {
    setConfirmedPin(pin);
    if (hasBiometric) {
      setOuterStep('biometric');
    } else {
      await enableLock(pin);
      notification(Haptics.NotificationFeedbackType.Success);
    }
  });

  async function handleEnableBiometric() {
    const result = await authenticate(`Enable ${biometricLabel(biometricType)}`);
    if (!result.success) return; // user cancelled or failed — stay on biometric step
    await enableBiometric();
    await enableLock(confirmedPin);
    notification(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSkipBiometric() {
    await enableLock(confirmedPin);
    notification(Haptics.NotificationFeedbackType.Success);
  }

  const screenStyle = { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 };

  if (outerStep === 'welcome') {
    return (
      <Animated.View
        key="welcome"
        entering={STEP_IN}
        exiting={STEP_OUT}
        className="flex-1 items-center bg-bg px-6"
        style={screenStyle}
      >
        <OnboardingProgress activeIndex={activeIndex} totalSteps={totalSteps} />
        <View className="flex-1 items-center justify-center gap-4">
          <StepIcon>
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.bg }}>৳</Text>
          </StepIcon>
          <StepText title="Secure your Poisha" subtitle="Set a 4-digit PIN to keep your data private." />
        </View>
        <OnboardingButton label="Set PIN" onPress={() => setOuterStep('wizard')} />
      </Animated.View>
    );
  }

  if (outerStep === 'biometric') {
    const icon = biometricIcon(biometricType);
    const label = biometricLabel(biometricType);
    const bodyText = biometricType === 'faceId'
      ? 'Unlock faster with Face ID.'
      : 'Unlock faster with your fingerprint.';

    return (
      <Animated.View
        key="biometric"
        entering={STEP_IN}
        exiting={STEP_OUT}
        className="flex-1 items-center bg-bg px-6"
        style={screenStyle}
      >
        <OnboardingProgress activeIndex={activeIndex} totalSteps={totalSteps} />
        <View className="flex-1 items-center justify-center gap-4">
          <StepIcon variant="outline">
            {icon && <HugeiconsIcon icon={icon} size={36} color={colors.ink} />}
          </StepIcon>
          <StepText title={`Enable ${label}`} subtitle={bodyText} />
        </View>
        <View className="w-full gap-3">
          <OnboardingButton label="Enable" onPress={handleEnableBiometric} />
          <OnboardingButton label="Not now" onPress={handleSkipBiometric} variant="outline" />
        </View>
      </Animated.View>
    );
  }

  const heading = wizard.step === 'create' ? 'Choose a PIN' : 'Confirm your PIN';

  return (
    <Animated.View
      key="wizard"
      entering={STEP_IN}
      exiting={STEP_OUT}
      className="flex-1 items-center bg-bg px-6"
      style={screenStyle}
    >
      <OnboardingProgress activeIndex={activeIndex} totalSteps={totalSteps} />
      <Animated.View key={wizard.step} entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} className="mt-12 items-center">
        <Text className="mb-12 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, letterSpacing: -0.4 }}>
          {heading}
        </Text>
        {wizard.error ? (
          <Text className="mb-6 text-accent" style={{ fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
            {wizard.error}
          </Text>
        ) : null}
        <PinInput
          value={wizard.pin}
          onChange={wizard.handleChange}
          onComplete={wizard.handleComplete}
          shake={wizard.shake}
          onShakeDone={wizard.handleShakeDone}
        />
      </Animated.View>
    </Animated.View>
  );
};

type StepIconProps = {
  children: React.ReactNode;
  variant?: 'accent' | 'outline';
};

function StepIcon({ children, variant = 'accent' }: StepIconProps) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 280 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className={clsx(
        'mb-2 items-center justify-center rounded-full',
        variant === 'accent' ? 'h-16 w-16 bg-accent' : 'h-[72px] w-[72px] border border-line bg-surface',
      )}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

function StepText({ title, subtitle }: { title: string; subtitle: string }) {
  const style = useFadeIn(100);

  return (
    <Animated.View style={style} className="items-center gap-4">
      <Text
        className="text-center text-ink"
        style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, letterSpacing: -0.5 }}
      >
        {title}
      </Text>
      <Text
        className="max-w-[280px] text-center text-ink-soft"
        style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, lineHeight: 22 }}
      >
        {subtitle}
      </Text>
    </Animated.View>
  );
}

type OnboardingButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
};

function OnboardingButton({ label, onPress, variant = 'solid' }: OnboardingButtonProps) {
  const { colors } = useTheme();
  const { impact } = useHaptics();
  const { scale, onPressIn, onPressOut } = usePressScale();
  const [pressed, setPressed] = useState(false);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    impact();
    onPress();
  }

  const idleBg = variant === 'solid' ? colors.ink : colors.surface;
  const pressedBg = variant === 'solid' ? colors.inkSoft : colors.surfaceAlt;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => { setPressed(true); onPressIn(); }}
      onPressOut={() => { setPressed(false); onPressOut(); }}
      className={clsx('w-full items-center rounded-2xl py-4', variant === 'outline' && 'border border-line')}
      style={[{ backgroundColor: pressed ? pressedBg : idleBg }, scaleStyle]}
    >
      <Text
        style={{
          fontFamily: variant === 'solid' ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
          fontSize: 16,
          color: variant === 'solid' ? colors.bg : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
