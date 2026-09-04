import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useBackup } from '@/lib/hooks/use-backup.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useBackupPromoDismissed, useDismissBackupPromo } from '@/lib/services/backup';

/**
 * One-time announcement of Drive backup, for people who already had the app
 * before it existed.
 *
 * A fresh install never sees this: the restore link on the onboarding welcome
 * step already covers that case, and someone with no data has nothing to back
 * up yet. So the banner is gated on there being at least one entry — that, not
 * install date, is what "existing user" usefully means here.
 *
 * It disappears for good once dismissed, and also once backup is switched on,
 * so it can never nag someone who has already acted on it.
 */
export function BackupPromoBanner() {
  const { colors } = useTheme();
  const { entries } = useEntries();
  const { available, enabled } = useBackup();
  const { data: dismissed } = useBackupPromoDismissed();
  const dismiss = useDismissBackupPromo();
  const { impact } = useHaptics();
  const style = useFadeIn(40);

  const hasEntries = entries.length > 0;
  if (!available || enabled || dismissed !== false || !hasEntries) return null;

  return (
    <Animated.View style={style} exiting={FadeOut.duration(180)} className="px-6 pb-1 pt-2">
      {/* The dismiss button is a sibling of the tappable area, not nested
          inside it. Nested Pressables can double-fire on Android, and here
          that would navigate to Settings on the very tap meant to dismiss. */}
      <View
        className="flex-row items-center rounded-2xl border border-line pr-3"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Pressable
          onPress={() => {
            impact();
            router.push('/settings/backup');
          }}
          accessibilityRole="button"
          accessibilityLabel="Set up Google Drive backup"
          className="min-w-0 flex-1 flex-row items-center gap-3 py-3.5 pl-4 pr-2 active:opacity-60"
        >
          <View
            className="h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.accent }}
          >
            <Feather name="upload-cloud" size={16} color="#ffffff" />
          </View>

          <View className="min-w-0 flex-1">
            <Text
              className="text-ink"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: -0.1 }}
            >
              Back up to Google Drive
            </Text>
            <Text
              className="mt-0.5 text-ink-soft"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}
            >
              Your entries only live on this phone. Turn on backup so you don&apos;t lose them.
            </Text>
          </View>
        </Pressable>

        {/* hitSlop rather than a larger box, so the target is comfortable
            without visually competing with the banner. */}
        <Pressable
          onPress={() => {
            impact();
            dismiss.mutate();
          }}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Dismiss backup reminder"
          className="p-1 active:opacity-50"
        >
          <Feather name="x" size={17} color={colors.inkMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
