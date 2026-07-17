import { useCallback, useState } from 'react';
import * as Updates from 'expo-updates';
import { useAlert } from '@/lib/context/alert.context';

export function useAppUpdates() {
  const showAlert = useAlert();
  const { currentlyRunning, isUpdatePending } = Updates.useUpdates();
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) {
      showAlert({ title: 'Updates unavailable', message: 'Over-the-air updates aren\'t available in this build.' });
      return;
    }

    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        showAlert({ title: "You're up to date", message: 'No new updates are available.' });
        return;
      }

      await Updates.fetchUpdateAsync();
      showAlert({
        title: 'Update ready',
        message: 'A new version has been downloaded. Restart now to apply it?',
        actions: [
          { label: 'Later', variant: 'outline' },
          { label: 'Restart', variant: 'solid', onPress: () => Updates.reloadAsync() },
        ],
      });
    } catch (error) {
      showAlert({ title: 'Update check failed', message: error instanceof Error ? error.message : 'Something went wrong.' });
    } finally {
      setChecking(false);
    }
  }, [showAlert]);

  const restartToApply = useCallback(() => {
    Updates.reloadAsync();
  }, []);

  return { currentlyRunning, isUpdatePending, checking, checkForUpdate, restartToApply };
}
