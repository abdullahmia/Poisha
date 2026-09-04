import { useAlert } from '@/lib/context/alert.context';
import { useBackup } from '@/lib/hooks/use-backup.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { listBackups } from '@/lib/services/backup';
import type React from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';


export const OnboardingRestoreLink: React.FC = () => {
  const { colors } = useTheme();
  const showAlert = useAlert();
  const { available, connected, connect, restore } = useBackup();
  const [working, setWorking] = useState(false);

  if (!available) return null;

  async function handlePress() {
    setWorking(true);
    try {
      if (!connected) {
        const result = await connect();
        if (result.status !== 'connected') return; // cancelled — say nothing
      }

      const files = await listBackups();
      if (files.length === 0) {
        showAlert({ title: 'No backups found', message: 'This Google account has no Poisha backups yet.' });
        return;
      }

      const newest = files[0];
      const when = new Date(newest.modifiedTime).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      showAlert({
        title: 'Restore this backup?',
        message: `From ${when}${newest.entryCount != null ? ` · ${newest.entryCount} entries` : ''}. This replaces anything currently on this device.`,
        icon: 'download-cloud',
        actions: [
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Restore',
            variant: 'solid',
            onPress: () => {
              setWorking(true);
              restore(newest.id)
                .then(result => {
                  showAlert(
                    result.ok
                      ? { title: 'Restored', message: `${result.entryCount} entries are back. Now set a PIN for this device.` }
                      : { title: 'Restore failed', message: result.message },
                  );
                })
                .finally(() => setWorking(false));
            },
          },
        ],
      });
    } catch (e: unknown) {
      showAlert({
        title: 'Could not connect',
        message: e instanceof Error ? e.message : 'Google sign-in failed. Please try again.',
      });
    } finally {
      setWorking(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={working}
      accessibilityRole="button"
      accessibilityLabel="Restore from Google Drive"
      className="mt-4 flex-row items-center justify-center gap-2 py-2 active:opacity-50"
    >
      {working && <ActivityIndicator size="small" color={colors.inkMuted} />}
      <View>
        <Text className="text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>
          {working ? 'Working…' : 'Restore from Google Drive'}
        </Text>
      </View>
    </Pressable>
  );
};
