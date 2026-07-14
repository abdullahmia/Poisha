import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';

type TPinWizardStep = 'create' | 'confirm';

/**
 * Shared "choose a PIN, then confirm it" state machine used by both the PIN
 * onboarding flow and the settings PIN-setup sheet. Calls `onConfirmed` once
 * the two entries match.
 */
export function usePinWizard(onConfirmed: (pin: string) => void | Promise<void>) {
  const { notification } = useHaptics();
  const [step, setStep] = useState<TPinWizardStep>('create');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleChange = (v: string) => {
    setPin(v);
    setError('');
  };

  function handleCreateComplete(entered: string) {
    setFirstPin(entered);
    setPin('');
    setStep('confirm');
  }

  async function handleConfirmComplete(entered: string) {
    if (entered !== firstPin) {
      notification(Haptics.NotificationFeedbackType.Error);
      setShake(true);
      setError("PINs don't match");
      return;
    }
    await onConfirmed(firstPin);
  }

  const handleComplete = step === 'create' ? handleCreateComplete : handleConfirmComplete;

  const handleShakeDone = () => {
    setShake(false);
    setPin('');
    if (step === 'confirm') {
      setFirstPin('');
      setStep('create');
    }
  };

  return { step, pin, error, shake, handleChange, handleComplete, handleShakeDone };
}
