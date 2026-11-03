import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useSms } from '@/lib/hooks/use-sms.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { ruleLabelFor } from '@/lib/utils/sms-item.util';

/**
 * Surfaces the review queue from Home.
 *
 * Unlike `BackupPromoBanner` there is no dismiss button, and that is
 * deliberate: this isn't an announcement, it's a count of work waiting. It goes
 * away by being acted on. A dismiss would let the queue grow silently, which is
 * the one outcome that makes the feature worse than not having it.
 */
export function SmsReviewBanner() {
  const { colors } = useTheme();
  const { enabled, pendingCount, queue } = useSms();
  const { impact } = useHaptics();
  const style = useFadeIn(40);

  if (!enabled || pendingCount === 0) return null;

  // Named from whatever has already loaded; the count comes from the cheap
  // COUNT query, so the two can briefly disagree — the count is the honest one.
  const senders = [...new Set(queue.map(ruleLabelFor))].slice(0, 2).join(', ');

  return (
    <Animated.View style={style} className="px-6 pb-1 pt-2">
      <Pressable
        onPress={() => {
          impact();
          router.push('/review');
        }}
        accessibilityRole="button"
        accessibilityLabel={`Review ${pendingCount} detected transactions`}
        className="flex-row items-center gap-3 rounded-2xl border border-line py-3.5 pl-4 pr-3 active:opacity-60"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.accent }}
        >
          <Feather name="message-square" size={16} color="#ffffff" />
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: -0.1 }}>
            {pendingCount === 1 ? '1 transaction to review' : `${pendingCount} transactions to review`}
          </Text>
          {senders.length > 0 && (
            <Text
              className="mt-0.5 text-ink-soft"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}
              numberOfLines={1}
            >
              From {senders}
            </Text>
          )}
        </View>

        <Feather name="chevron-right" size={18} color={colors.inkMuted} />
      </Pressable>
    </Animated.View>
  );
}
