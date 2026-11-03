import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSms } from '@/lib/hooks/use-sms.hook';
import { useSmsRules } from '@/lib/hooks/use-sms-rules.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { SMS_BACKFILL_DAYS } from '@/lib/utils/sms-scan.util';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsGroup } from '../shared/settings-group.component';
import { SettingsNavRow } from '../shared/settings-nav-row.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

function formatWhen(ms: number | null): string {
  if (ms === null) return 'Never';
  const date = new Date(ms);
  const minutesAgo = Math.floor((Date.now() - ms) / 60000);
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

type TPending = 'disable' | 'clear' | null;

export const Sms: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    available,
    enabled,
    granted,
    blocked,
    pendingCount,
    lastScanAt,
    setEnabled,
    requestPermission,
    scan,
    backfill,
    clearData,
    scanning,
  } = useSms();

  const { enabledCount: enabledRuleCount } = useSmsRules();

  const [pending, setPending] = useState<TPending>(null);

  const padding = { paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 };

  // No dead toggle on a device that physically cannot do this — explain and
  // stop, the same way the backup screen handles a missing Google client id.
  if (!available) {
    return (
      <ScrollView className="flex-1 bg-bg" contentContainerStyle={padding} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Automatic expenses" />
        <View className="rounded-2xl border border-line bg-surface p-5">
          <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>
            Not available on this device
          </Text>
          <Text
            className="mt-2 text-ink-soft"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
          >
            Reading bank messages needs an Android phone with SMS. On iPhone and tablets there is no way for an app to
            see your messages at all, so Poisha can&apos;t offer this here.
          </Text>
        </View>
      </ScrollView>
    );
  }

  const handleToggle = (next: boolean) => {
    // Turning it on is immediate; turning it off deletes the queue, so it asks.
    if (next) void setEnabled(true).then(() => requestPermission());
    else setPending('disable');
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={padding} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Automatic expenses"
        subtitle="Poisha reads the messages your bank and wallet send, and suggests entries from them."
      />

      <SettingsToggleRow
        label="Read bank messages"
        description="Detected transactions wait in Review. Nothing is added to your entries until you confirm it."
        value={enabled}
        onValueChange={handleToggle}
      />

      {enabled && !granted && (
        <View className="mt-3 rounded-2xl border border-line bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <Feather name="lock" size={14} color={colors.inkMuted} />
            <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
              Permission needed
            </Text>
          </View>
          <Text
            className="mt-2 text-ink-soft"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}
          >
            {blocked
              ? 'Message access was turned off permanently. Poisha can’t ask again — allow it in Android settings.'
              : 'Poisha needs permission to read your messages before it can spot transactions.'}
          </Text>
          <Pressable
            onPress={() => (blocked ? void Linking.openSettings() : void requestPermission())}
            accessibilityRole="button"
            className="mt-3 items-center rounded-2xl bg-accent py-2.5 active:opacity-80"
          >
            <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {blocked ? 'Open Android settings' : 'Allow message access'}
            </Text>
          </Pressable>
        </View>
      )}

      {enabled && granted && (
        <SettingsGroup label="Scanning">
          <SettingsNavRow
            icon="inbox"
            label="Waiting for review"
            value={String(pendingCount)}
            onPress={() => router.push('/review')}
          />
          <SettingsNavRow
            icon="refresh-cw"
            label={scanning ? 'Scanning…' : 'Scan now'}
            value={formatWhen(lastScanAt)}
            onPress={() => void scan()}
          />
          {/* Scanning starts from the moment you switch the feature on, so
              history is opt-in. A silent backfill of a multi-year inbox would
              bury the queue in transactions already long reconciled. */}
          <SettingsNavRow
            icon="clock"
            label={`Scan the last ${SMS_BACKFILL_DAYS} days`}
            onPress={() => void backfill()}
          />
        </SettingsGroup>
      )}

      {enabled && (
        <SettingsGroup label="Senders">
          <SettingsNavRow
            icon="filter"
            label="Message rules"
            value={String(enabledRuleCount)}
            onPress={() => router.push('/settings/sms-rules')}
          />
        </SettingsGroup>
      )}

      <SettingsGroup label="Privacy">
        <View className="py-4">
          <Text
            className="text-ink-soft"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
          >
            Messages are read on your phone and never uploaded. The text of a message is deleted as soon as you confirm
            or dismiss it, and anything left over is cleared after 30 days.
            {'\n\n'}
            Detected transactions are not included in your Google Drive backup — only the entries you confirm.
          </Text>
        </View>
      </SettingsGroup>

      {enabled && (
        <SettingsGroup label="Danger zone">
          <SettingsNavRow
            icon="trash-2"
            label="Delete detected transactions"
            destructive
            onPress={() => setPending('clear')}
          />
        </SettingsGroup>
      )}

      <ConfirmModal
        visible={pending === 'disable'}
        onClose={() => setPending(null)}
        title="Turn off automatic expenses?"
        message={
          pendingCount > 0
            ? `Poisha stops reading new messages, and the ${pendingCount} ${pendingCount === 1 ? 'transaction' : 'transactions'} waiting for review will be deleted.\n\nEntries you already confirmed are untouched.`
            : 'Poisha stops reading new messages. Entries you already confirmed are untouched.\n\nIf you turn this back on later, it starts from that moment — it won’t go back and read the messages in between.'
        }
        icon="message-square"
        destructive
        actions={[
          { label: 'Turn off', variant: 'danger', onPress: () => void setEnabled(false) },
          { label: 'Cancel', variant: 'ghost' },
        ]}
      />

      <ConfirmModal
        visible={pending === 'clear'}
        onClose={() => setPending(null)}
        title="Delete detected transactions?"
        message="Everything waiting for review is removed and scanning restarts from now. Entries you already confirmed are untouched."
        icon="trash-2"
        destructive
        actions={[
          { label: 'Delete', variant: 'danger', onPress: () => void clearData() },
          { label: 'Cancel', variant: 'ghost' },
        ]}
      />
    </ScrollView>
  );
};
