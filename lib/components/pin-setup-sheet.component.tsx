import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinInput } from '@/lib/components/pin-input.component';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import * as Haptics from 'expo-haptics';

type Mode = 'enable' | 'change' | 'disable';
type Step = 'verify' | 'create' | 'confirm';

interface PinSetupSheetProps {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinSetupSheet({ visible, mode, onClose, onSuccess }: PinSetupSheetProps) {
  const { colors } = useTheme();
  const { enableLock, changePin, unlock, disableLock } = useLock();
  const { notification } = useHaptics();
  const insets = useSafeAreaInsets();

  const initialStep: Step = (mode === 'change' || mode === 'disable') ? 'verify' : 'create';
  const [step, setStep] = useState<Step>(initialStep);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  async function handleVerify(entered: string) {
    const ok = await unlock(entered);
    if (!ok) { notification(Haptics.NotificationFeedbackType.Error); setShake(true); setError('Wrong PIN'); return; }
    if (mode === 'disable') {
      await disableLock();
      onSuccess();
      return;
    }
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
      notification(Haptics.NotificationFeedbackType.Error);
      setShake(true);
      setError("PINs don't match");
      return;
    }
    if (mode === 'enable') await enableLock(firstPin);
    else await changePin(firstPin);
    onSuccess();
  }

  const headings: Record<Step, string> = {
    verify: mode === 'disable' ? 'Verify to disable' : 'Enter current PIN',
    create: 'Choose a new PIN',
    confirm: 'Confirm your PIN',
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      sheetStyle={{ backgroundColor: colors.bg }}
    >
      <View style={{ paddingTop: 16, paddingBottom: insets.bottom + 8, paddingHorizontal: 24, alignItems: 'center', gap: 32 }}>
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
      </View>
    </BottomSheet>
  );
}
