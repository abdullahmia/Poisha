import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppUpdates } from '@/lib/hooks/use-app-updates.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { ScreenHeader } from './screen-header.component';
import { SettingsNavRow } from './settings-nav-row.component';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-4">
      <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
        {label}
      </Text>
      <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { currentlyRunning, isUpdatePending, checking, checkForUpdate, restartToApply } = useAppUpdates();

  const versionLabel = currentlyRunning.isEmbeddedLaunch
    ? 'Built-in'
    : `Update ${currentlyRunning.updateId?.slice(0, 8) ?? ''}`;
  const channelLabel = currentlyRunning.channel ?? (__DEV__ ? 'Development' : 'None');

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="About" />

      <View className="items-center py-4">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, letterSpacing: -0.4 }}>
          Poisha
        </Text>
        <Text className="mt-1.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
          a quiet money journal
        </Text>
      </View>

      <InfoRow label="Version" value={versionLabel} />
      <View className="h-px bg-line" />
      <InfoRow label="Channel" value={channelLabel} />
      <View className="h-px bg-line" />

      {isUpdatePending ? (
        <SettingsNavRow icon="refresh-cw" label="Restart to apply update" onPress={restartToApply} />
      ) : checking ? (
        <View className="flex-row items-center gap-2.5 py-4">
          <ActivityIndicator size="small" color={colors.inkMuted} />
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
            Checking for updates…
          </Text>
        </View>
      ) : (
        <SettingsNavRow icon="download-cloud" label="Check for updates" onPress={checkForUpdate} />
      )}

      <Text className="pt-8 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        All data is stored locally on this device. Nothing is uploaded anywhere.
      </Text>
    </ScrollView>
  );
}
