import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TSmsItem } from '@/lib/types';
import { hasCurrencyMismatch, isLowConfidence, ruleLabelFor } from '@/lib/utils/sms-item.util';

type SmsReviewCardProps = {
  item: TSmsItem;
  onAccept: () => void;
  onEdit: () => void;
  onDismiss: () => void;
  /** Low-confidence items open with the message already showing. */
  defaultExpanded?: boolean;
  disabled?: boolean;
};

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export const SmsReviewCard: React.FC<SmsReviewCardProps> = ({
  item,
  onAccept,
  onEdit,
  onDismiss,
  defaultExpanded = false,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { fmtFull, locale } = useLocale();
  const { impact } = useHaptics();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const mismatch = hasCurrencyMismatch(item, locale.symbol);
  const uncertain = isLowConfidence(item);

  const meta = [ruleLabelFor(item), formatTime(item.receivedAt), item.reference]
    .filter(Boolean)
    .join(' · ');

  return (
    <View className="mb-3 rounded-2xl border border-line bg-surface p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text
            className="text-ink"
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}
            numberOfLines={1}
          >
            {item.merchant || ruleLabelFor(item)}
          </Text>
          <Text
            className="mt-1 text-ink-muted"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}
            numberOfLines={1}
          >
            {meta}
          </Text>
        </View>

        <Text
          className="text-ink"
          style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, letterSpacing: -0.5 }}
        >
          {item.amount === null ? '—' : fmtFull(item.amount)}
        </Text>
      </View>

      {/* A currency we can't reconcile is flagged, never converted: TLocale
          carries a symbol but no currency code, so there is nothing reliable to
          convert against, and a silent conversion would be worse than a
          visible mismatch. */}
      {mismatch && (
        <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-surface-alt px-3 py-2">
          <Feather name="alert-triangle" size={13} color={colors.inkMuted} />
          <Text
            className="min-w-0 flex-1 text-ink-soft"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}
          >
            This message is in {item.currency}, but Poisha shows {locale.symbol}. The amount is not converted.
          </Text>
        </View>
      )}

      {/* The raw message, one tap away. This is the trust mechanism — a review
          screen that won't show you what it read isn't reviewable. */}
      {item.body && (
        <Pressable
          onPress={() => setExpanded(v => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide original message' : 'Show original message'}
          className="mt-3 flex-row items-center gap-1.5 active:opacity-60"
        >
          <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={13} color={colors.inkMuted} />
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 11 }}>
            {expanded ? 'Hide message' : 'Show message'}
          </Text>
          {uncertain && (
            <Text className="ml-1 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11 }}>
              · check this one
            </Text>
          )}
        </Pressable>
      )}

      {expanded && item.body && (
        <Text
          className="mt-2 rounded-xl bg-bg p-3 text-ink-muted"
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 17 }}
        >
          {item.body}
        </Text>
      )}

      <View className="mt-4 flex-row items-center gap-2">
        <Pressable
          onPress={() => {
            impact();
            onAccept();
          }}
          disabled={disabled || item.amount === null}
          accessibilityRole="button"
          accessibilityLabel="Add this transaction"
          className="flex-1 items-center rounded-2xl bg-accent py-2.5 active:opacity-80"
          style={disabled || item.amount === null ? { opacity: 0.4 } : undefined}
        >
          <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
            Add
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            impact();
            onEdit();
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Edit before adding"
          className="items-center rounded-2xl border border-line px-5 py-2.5 active:opacity-60"
        >
          <Text className="text-ink" style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }}>
            Edit
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            impact();
            onDismiss();
          }}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss this transaction"
          className="h-10 w-10 items-center justify-center rounded-2xl border border-line active:opacity-60"
        >
          <Feather name="x" size={16} color={colors.inkMuted} />
        </Pressable>
      </View>
    </View>
  );
};
