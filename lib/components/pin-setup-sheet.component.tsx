import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinInput } from '@/lib/components/pin-input.component';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePinWizard } from '@/lib/hooks/use-pin-wizard.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';

type Mode = 'enable' | 'change' | 'disable';

type PinSetupSheetProps = {
  visible: boolean;
  mode: Mode;
  onClose: () => void;
  onSuccess: () => void;
};

export const PinSetupSheet: React.FC<PinSetupSheetProps> = ({ visible, mode, onClose, onSuccess }) => {
  const { colors } = useTheme();
  const { enableLock, changePin, unlock, disableLock } = useLock();
  const { notification } = useHaptics();
  const insets = useSafeAreaInsets();

  const needsVerify = mode === 'change' || mode === 'disable';
  const [verifying, setVerifying] = useState(needsVerify);
  const [verifyPin, setVerifyPin] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifyShake, setVerifyShake] = useState(false);

  const wizard = usePinWizard(async pin => {
    if (mode === 'enable') await enableLock(pin);
    else await changePin(pin);
    onSuccess();
  });

  async function handleVerify(entered: string) {
    const ok = await unlock(entered);
    if (!ok) {
      notification(Haptics.NotificationFeedbackType.Error);
      setVerifyShake(true);
      setVerifyError('Wrong PIN');
      return;
    }
    if (mode === 'disable') {
      await disableLock();
      onSuccess();
      return;
    }
    setVerifyPin('');
    setVerifying(false);
  }

  const heading = verifying
    ? mode === 'disable' ? 'Verify to disable' : 'Enter current PIN'
    : wizard.step === 'create' ? 'Choose a new PIN' : 'Confirm your PIN';

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={{ backgroundColor: colors.bg }}>
      <View
        className="items-center gap-8 px-6 pt-4"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.3 }}>
          {heading}
        </Text>

        {verifying ? (
          <>
            {verifyError ? (
              <Text className="-mt-4 text-accent" style={{ fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
                {verifyError}
              </Text>
            ) : null}
            <PinInput
              value={verifyPin}
              onChange={v => { setVerifyPin(v); setVerifyError(''); }}
              onComplete={handleVerify}
              shake={verifyShake}
              onShakeDone={() => { setVerifyShake(false); setVerifyPin(''); }}
            />
          </>
        ) : (
          <>
            {wizard.error ? (
              <Text className="-mt-4 text-accent" style={{ fontFamily: 'DMSans_400Regular', fontSize: 13 }}>
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
          </>
        )}
      </View>
    </BottomSheet>
  );
};
