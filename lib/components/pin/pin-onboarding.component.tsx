import { HugeiconsIcon } from '@hugeicons/react-native';
import type React from 'react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePinWizard } from '@/lib/hooks/use-pin-wizard.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';
import { PinInput } from './pin-input.component';

type OuterStep = 'welcome' | 'wizard' | 'biometric';

export const PinOnboarding: React.FC = () => {
  const { colors } = useTheme();
  const { enableLock, biometricType, enableBiometric } = useLock();
  const { authenticate } = useBiometric();
  const insets = useSafeAreaInsets();
  const [outerStep, setOuterStep] = useState<OuterStep>('welcome');
  const [confirmedPin, setConfirmedPin] = useState('');

  const wizard = usePinWizard(async pin => {
    setConfirmedPin(pin);
    if (biometricType !== 'none') {
      setOuterStep('biometric');
    } else {
      await enableLock(pin);
    }
  });

  async function handleEnableBiometric() {
    const result = await authenticate(`Enable ${biometricLabel(biometricType)}`);
    if (!result.success) return; // user cancelled or failed — stay on biometric step
    await enableBiometric();
    await enableLock(confirmedPin);
  }

  async function handleSkipBiometric() {
    await enableLock(confirmedPin);
  }

  if (outerStep === 'welcome') {
    return (
      <View
        className="flex-1 items-center bg-bg px-6"
        style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
      >
        <View className="flex-1 items-center justify-center gap-4">
          <View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.bg }}>৳</Text>
          </View>
          <Text
            className="text-center text-ink"
            style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, letterSpacing: -0.5 }}
          >
            Secure your Poisha
          </Text>
          <Text
            className="max-w-[280px] text-center text-ink-soft"
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, lineHeight: 22 }}
          >
            Set a 4-digit PIN to keep your data private.
          </Text>
        </View>
        <Pressable
          onPress={() => setOuterStep('wizard')}
          className="w-full items-center rounded-2xl py-4"
          style={({ pressed }) => ({ backgroundColor: pressed ? colors.inkSoft : colors.ink })}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: colors.bg }}>Set PIN</Text>
        </Pressable>
      </View>
    );
  }

  if (outerStep === 'biometric') {
    const icon = biometricIcon(biometricType);
    const label = biometricLabel(biometricType);
    const bodyText = biometricType === 'faceId'
      ? 'Unlock faster with Face ID.'
      : 'Unlock faster with your fingerprint.';

    return (
      <View
        className="flex-1 items-center bg-bg px-6"
        style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
      >
        <View className="flex-1 items-center justify-center gap-4">
          <View className="mb-2 h-[72px] w-[72px] items-center justify-center rounded-full border border-line bg-surface">
            {icon && <HugeiconsIcon icon={icon} size={36} color={colors.ink} />}
          </View>
          <Text
            className="text-center text-ink"
            style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, letterSpacing: -0.5 }}
          >
            Enable {label}
          </Text>
          <Text
            className="max-w-[280px] text-center text-ink-soft"
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, lineHeight: 22 }}
          >
            {bodyText}
          </Text>
        </View>
        <View className="w-full gap-3">
          <Pressable
            onPress={handleEnableBiometric}
            className="w-full items-center rounded-2xl py-4"
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.inkSoft : colors.ink })}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: colors.bg }}>Enable</Text>
          </Pressable>
          <Pressable
            onPress={handleSkipBiometric}
            className="w-full items-center rounded-2xl border border-line py-4"
            style={({ pressed }) => ({ backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.inkSoft }}>Not now</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const heading = wizard.step === 'create' ? 'Choose a PIN' : 'Confirm your PIN';

  return (
    <View
      className="flex-1 items-center bg-bg px-6"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 }}
    >
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
    </View>
  );
};
