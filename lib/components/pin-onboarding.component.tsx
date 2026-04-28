import { PinInput } from '@/lib/components/pin-input.component';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'welcome' | 'create' | 'confirm' | 'biometric';

export function PinOnboarding() {
  const { colors } = useTheme();
  const { enableLock, biometricType, enableBiometric } = useLock();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('welcome');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  async function handleCreateComplete(entered: string) {
    setFirstPin(entered);
    setPin('');
    setStep('confirm');
  }

  async function handleConfirmComplete(entered: string) {
    if (entered !== firstPin) {
      setShake(true);
      setError("PINs don't match");
      return;
    }
    if (biometricType !== 'none') {
      setStep('biometric');
    } else {
      await enableLock(firstPin);
    }
  }

  async function handleEnableBiometric() {
    await enableBiometric();
    await enableLock(firstPin);
  }

  async function handleSkipBiometric() {
    await enableLock(firstPin);
  }

  const bg = { flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, alignItems: 'center' as const };

  if (step === 'welcome') {
    return (
      <View style={bg}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.bg }}>৳</Text>
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, color: colors.ink, letterSpacing: -0.5, textAlign: 'center' }}>
            Secure your Poisha
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.inkSoft, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Set a 4-digit PIN to keep your data private.
          </Text>
        </View>
        <Pressable
          onPress={() => setStep('create')}
          style={({ pressed }) => ({
            width: '100%',
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: pressed ? colors.inkSoft : colors.ink,
            alignItems: 'center',
          })}
        >
          <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: colors.bg }}>Set PIN</Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'biometric') {
    const icon = biometricIcon(biometricType);
    const label = biometricLabel(biometricType);
    const bodyText = biometricType === 'faceId'
      ? 'Unlock faster with Face ID.'
      : 'Unlock faster with your fingerprint.';

    return (
      <View style={bg}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {icon && <HugeiconsIcon icon={icon} size={36} color={colors.ink} />}
          </View>
          <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 28, color: colors.ink, letterSpacing: -0.5, textAlign: 'center' }}>
            Enable {label}
          </Text>
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 15, color: colors.inkSoft, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            {bodyText}
          </Text>
        </View>
        <View style={{ width: '100%', gap: 12 }}>
          <Pressable
            onPress={handleEnableBiometric}
            style={({ pressed }) => ({
              width: '100%',
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: pressed ? colors.inkSoft : colors.ink,
              alignItems: 'center',
            })}
          >
            <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 16, color: colors.bg }}>Enable</Text>
          </Pressable>
          <Pressable
            onPress={handleSkipBiometric}
            style={({ pressed }) => ({
              width: '100%',
              paddingVertical: 16,
              borderRadius: 16,
              backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              alignItems: 'center',
            })}
          >
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 16, color: colors.inkSoft }}>Not now</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const heading = step === 'create' ? 'Choose a PIN' : 'Confirm your PIN';

  return (
    <View style={bg}>
      <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, color: colors.ink, letterSpacing: -0.4, marginBottom: 48 }}>
        {heading}
      </Text>
      {error ? (
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.accent, marginBottom: 24 }}>
          {error}
        </Text>
      ) : null}
      <PinInput
        value={pin}
        onChange={v => { setPin(v); setError(''); }}
        onComplete={step === 'create' ? handleCreateComplete : handleConfirmComplete}
        shake={shake}
        onShakeDone={() => { setShake(false); setPin(''); setFirstPin(''); setStep('create'); }}
      />
    </View>
  );
}
