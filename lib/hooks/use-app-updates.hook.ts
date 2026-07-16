import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export function useAppUpdates() {
  const { currentlyRunning, isUpdatePending } = Updates.useUpdates();
  const [checking, setChecking] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!Updates.isEnabled) {
      Alert.alert('Updates unavailable', 'Over-the-air updates only work in production and preview builds, not in this development build.');
      return;
    }

    setChecking(true);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        Alert.alert("You're up to date", 'No new updates are available.');
        return;
      }

      await Updates.fetchUpdateAsync();
      Alert.alert('Update ready', 'A new version has been downloaded. Restart now to apply it?', [
        { text: 'Later', style: 'cancel' },
        { text: 'Restart', onPress: () => Updates.reloadAsync() },
      ]);
    } catch (error) {
      Alert.alert('Update check failed', error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setChecking(false);
    }
  }, []);

  const restartToApply = useCallback(() => {
    Updates.reloadAsync();
  }, []);

  return { currentlyRunning, isUpdatePending, checking, checkForUpdate, restartToApply };
}
