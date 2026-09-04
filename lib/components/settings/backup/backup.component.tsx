import type React from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/lib/context/alert.context';
import { useBackup } from '@/lib/hooks/use-backup.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TBackupFrequency } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsNavRow } from '../shared/settings-nav-row.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

const FREQUENCIES: { value: TBackupFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'manual', label: 'Only when I tap' },
];

function formatWhen(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (sameDay) return `Today, ${time}`;

  return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${time}`;
}

export const Backup: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const showAlert = useAlert();
  const backup = useBackup();

  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const busy = backup.connecting || backup.backingUp || backup.restoring;
  const newest = backup.backups[0] ?? null;

  async function handleConnect() {
    try {
      await backup.connect();
    } catch (e: unknown) {
      showAlert({
        title: 'Could not connect',
        message: e instanceof Error ? e.message : 'Google sign-in failed. Please try again.',
      });
    }
  }

  async function handleBackupNow() {
    const result = await backup.runBackup();
    if (result.ok) {
      showAlert({
        title: 'Backed up',
        message: `${result.file.entryCount ?? 0} entries saved to Google Drive.`,
      });
      return;
    }
    showAlert({
      title: 'Backup failed',
      message: result.reason === 'busy' ? 'Another backup is already running.' : result.message,
    });
  }

  async function handleRestore() {
    if (!newest) return;
    const result = await backup.restore(newest.id);
    if (result.ok) {
      showAlert({ title: 'Restored', message: `${result.entryCount} entries restored to this device.` });
      return;
    }
    showAlert({ title: 'Restore failed', message: result.message });
  }

  // No client id in this build, or a device without Google Play Services.
  // Say so plainly instead of showing controls that cannot work.
  if (!backup.available && !backup.accountLoading) {
    return (
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Backup"
          subtitle="Google Drive backup isn't available on this device. You can still export a CSV from Import & Export."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Backup"
        subtitle="Keeps a copy of your entries, categories and settings in a private folder in your Google Drive. Your PIN is never backed up."
      />

      <SettingsNavRow
        icon="user"
        label="Google account"
        value={backup.email ?? (backup.accountLoading ? '…' : 'Not connected')}
        onPress={() => (backup.connected ? setDisconnectOpen(true) : handleConnect())}
      />

      {backup.needsReconnect && (
        <Text
          className="pb-1 text-danger"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}
        >
          Poisha no longer has access to this account. Tap above to reconnect.
        </Text>
      )}

      <View className="h-px bg-line" />

      <SettingsToggleRow
        label="Back up to Google Drive"
        description={
          backup.connected
            ? 'Uploads automatically when you open Poisha and the last backup is out of date.'
            : 'Connect a Google account first.'
        }
        value={backup.enabled}
        onValueChange={backup.setEnabled}
        disabled={!backup.connected}
      />

      {backup.connected && backup.enabled && (
        <>
          <View className="h-px bg-line" />
          <Text
            className="pb-1 pt-5 text-ink"
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}
          >
            How often
          </Text>
          <View className="flex-row gap-2 pb-1 pt-1">
            {FREQUENCIES.map(option => {
              const active = backup.frequency === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => backup.setFrequency(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  className="rounded-2xl px-4 py-2 active:opacity-50"
                  style={{ backgroundColor: active ? colors.accent : colors.surfaceAlt }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_500Medium',
                      fontSize: 13,
                      color: active ? '#ffffff' : colors.ink,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {backup.connected && (
        <>
          <View className="mt-5 h-px bg-line" />
          <View className="py-4">
            <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
              Last backup
            </Text>
            <Text
              className="mt-1 text-ink-muted"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}
            >
              {formatWhen(backup.lastBackupAt)}
              {newest?.entryCount != null ? ` · ${newest.entryCount} entries` : ''}
              {backup.lastStatus === 'failed' ? ' · last attempt failed' : ''}
            </Text>
          </View>

          <View className="h-px bg-line" />
          <SettingsNavRow icon="upload-cloud" label="Back up now" onPress={handleBackupNow} />
          <View className="h-px bg-line" />
          <SettingsNavRow
            icon="download-cloud"
            label="Restore from Google Drive"
            onPress={() => {
              if (!newest) {
                showAlert({ title: 'Nothing to restore', message: 'No backups found in your Google Drive yet.' });
                return;
              }
              setRestoreOpen(true);
            }}
          />
        </>
      )}

      {busy && (
        <View className="flex-row items-center gap-2.5 pt-5">
          <ActivityIndicator size="small" color={colors.inkMuted} />
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
            {backup.connecting ? 'Connecting…' : backup.backingUp ? 'Backing up…' : 'Restoring…'}
          </Text>
        </View>
      )}

      <ConfirmModal
        visible={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        title="Disconnect account"
        message="Poisha will stop backing up. Backups already in your Google Drive are kept."
        icon="user-x"
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Disconnect', variant: 'danger', onPress: () => void backup.disconnect() },
        ]}
      />

      <ConfirmModal
        visible={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title="Restore from backup"
        message={
          newest
            ? `This replaces everything on this device with the backup from ${formatWhen(newest.modifiedTime)}${
                newest.entryCount != null ? ` (${newest.entryCount} entries)` : ''
              }. This cannot be undone.`
            : ''
        }
        icon="download-cloud"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Restore', variant: 'danger', onPress: handleRestore },
        ]}
      />
    </ScrollView>
  );
};
