import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useAppUpdates } from '@/lib/hooks/use-app-updates.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function UpdatesSection() {
  const { colors } = useTheme();
  const { currentlyRunning, isUpdatePending, checking, checkForUpdate, restartToApply } = useAppUpdates();
  const style = useFadeIn(420);

  const versionLabel = currentlyRunning.isEmbeddedLaunch
    ? 'Built-in version'
    : `Update ${currentlyRunning.updateId?.slice(0, 8) ?? ''}`;
  const channelLabel = currentlyRunning.channel
    ? `Channel: ${currentlyRunning.channel}`
    : __DEV__
      ? 'Development build'
      : 'No update channel';

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="download-cloud" label="Updates" />
      <Card className="overflow-hidden rounded-2xl">
        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="package" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>{versionLabel}</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{channelLabel}</Text>
            </View>
          </View>
        </View>

        <View className="mx-4 h-px bg-line" />

        {isUpdatePending ? (
          <Pressable
            onPress={restartToApply}
            className={clsx(rowClass, 'active:opacity-60')}
            accessibilityLabel="Restart to apply update"
          >
            <View className="flex-row items-center gap-3">
              <RowIcon name="refresh-cw" color={colors.accent} bg={colors.accentSoft} />
              <View>
                <Text className="text-accent" style={rowLabelStyle}>Restart to Update</Text>
                <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>A new update has been downloaded</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.accent} />
          </Pressable>
        ) : (
          <Pressable
            onPress={checkForUpdate}
            disabled={checking}
            className={clsx(rowClass, 'active:opacity-60')}
            accessibilityLabel="Check for updates"
          >
            <View className="flex-row items-center gap-3">
              <RowIcon name="refresh-cw" />
              <Text className="text-ink" style={rowLabelStyle}>Check for Updates</Text>
            </View>
            {checking ? <ActivityIndicator size="small" color={colors.inkMuted} /> : <Feather name="chevron-right" size={16} color={colors.inkMuted} />}
          </Pressable>
        )}
      </Card>
    </Animated.View>
  );
}
