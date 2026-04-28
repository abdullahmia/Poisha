import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { PinInput } from '@/lib/components/pin-input.component';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type Mode = 'enable' | 'change';
type Step = 'verify' | 'create' | 'confirm';

interface PinSetupSheetProps {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinSetupSheet({ visible, mode, onClose, onSuccess }: PinSetupSheetProps) {
  const { colors } = useTheme();
  const { enableLock, changePin, unlock } = useLock();
  const insets = useSafeAreaInsets();

  const initialStep: Step = mode === 'change' ? 'verify' : 'create';
  const [step, setStep] = useState<Step>(initialStep);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const translateY = useSharedValue(600);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  useEffect(() => {
    if (visible) {
      setStep(mode === 'change' ? 'verify' : 'create');
      setPin('');
      setFirstPin('');
      setError('');
      translateY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    } else {
      translateY.value = withTiming(600, { duration: 300, easing: Easing.in(Easing.cubic) });
    }
  }, [visible, mode]);

  async function handleVerify(entered: string) {
    const ok = await unlock(entered);
    if (!ok) { setShake(true); setError('Wrong PIN'); return; }
    setPin('');
    setStep('create');
  }

  function handleCreate(entered: string) {
    setFirstPin(entered);
    setPin('');
    setStep('confirm');
  }

  async function handleConfirm(entered: string) {
    if (entered !== firstPin) {
      setShake(true);
      setError("PINs don't match");
      return;
    }
    if (mode === 'enable') await enableLock(firstPin);
    else await changePin(firstPin);
    onSuccess();
  }

  const headings: Record<Step, string> = {
    verify: 'Enter current PIN',
    create: 'Choose a new PIN',
    confirm: 'Confirm your PIN',
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />
      <Animated.View style={[{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: colors.bg,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingTop: 24, paddingBottom: insets.bottom + 32,
        paddingHorizontal: 24, alignItems: 'center', gap: 32,
      }, sheetStyle]}>
        {/* Handle */}
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, position: 'absolute', top: 10 }} />

        <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, color: colors.ink, letterSpacing: -0.3 }}>
          {headings[step]}
        </Text>

        {error ? (
          <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.accent, marginTop: -16 }}>
            {error}
          </Text>
        ) : null}

        <PinInput
          value={pin}
          onChange={v => { setPin(v); setError(''); }}
          onComplete={step === 'verify' ? handleVerify : step === 'create' ? handleCreate : handleConfirm}
          shake={shake}
          onShakeDone={() => {
            setShake(false);
            setPin('');
            if (step === 'confirm') { setFirstPin(''); setStep('create'); }
          }}
        />
      </Animated.View>
    </Modal>
  );
}
