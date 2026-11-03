import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/lib/components/settings/shared/screen-header.component';
import { useAlert } from '@/lib/context/alert.context';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useSms } from '@/lib/hooks/use-sms.hook';
import type { TDraft, TSmsItem } from '@/lib/types';
import { formatDateShort } from '@/lib/utils/date.util';
import { isLowConfidence } from '@/lib/utils/sms-item.util';
import { SmsEditSheet } from './sms-edit-sheet.component';
import { SmsReviewCard } from './sms-review-card.component';
import { SmsReviewEmpty, type TSmsEmptyReason } from './sms-review-empty.component';

function groupByDate(items: TSmsItem[]): [string, TSmsItem[]][] {
  const groups = new Map<string, TSmsItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.date);
    if (bucket) bucket.push(item);
    else groups.set(item.date, [item]);
  }
  // The query already sorts by received_at DESC, so insertion order is already
  // newest-first and needs no second sort.
  return [...groups.entries()];
}

export const SmsReviewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { fmtFull } = useLocale();
  const { impact, notification } = useHaptics();
  const showAlert = useAlert();
  const {
    available,
    enabled,
    permission,
    granted,
    queue,
    accept,
    acceptAll,
    dismiss,
    requestPermission,
    accepting,
  } = useSms();

  const [editing, setEditing] = useState<TSmsItem | null>(null);

  const { sure, unsure, total } = useMemo(() => {
    const sureItems = queue.filter(i => !isLowConfidence(i));
    const unsureItems = queue.filter(isLowConfidence);
    return {
      sure: sureItems,
      unsure: unsureItems,
      total: queue.reduce((sum, i) => sum + (i.amount ?? 0), 0),
    };
  }, [queue]);

  const emptyReason: TSmsEmptyReason | null = !available
    ? 'unavailable'
    : !enabled
      ? 'disabled'
      : !granted
        ? permission === 'blocked'
          ? 'blocked'
          : 'denied'
        : queue.length === 0
          ? 'clear'
          : null;

  const confirmAcceptAll = () => {
    impact();
    showAlert({
      title: `Add all ${queue.length}?`,
      message: 'Each one becomes an entry exactly as shown. You can edit or delete them afterwards.',
      actions: [
        {
          label: 'Add all',
          onPress: () => {
            void acceptAll(queue).then(() => notification(Haptics.NotificationFeedbackType.Success));
          },
        },
        { label: 'Cancel', variant: 'ghost' },
      ],
    });
  };

  const handleEditConfirm = (draft: TDraft) => {
    const item = editing;
    setEditing(null);
    if (!item) return;
    void accept(item, draft).then(() => notification(Haptics.NotificationFeedbackType.Success));
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-bg"
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: 32 + insets.bottom,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Review"
          subtitle="From your bank and wallet messages. Nothing is added until you confirm."
        />

        {emptyReason ? (
          <SmsReviewEmpty reason={emptyReason} onRequestPermission={() => void requestPermission()} />
        ) : (
          <>
            <View className="mb-5 flex-row items-baseline gap-2">
              <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                {queue.length} pending
              </Text>
              <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                · {fmtFull(total)} total
              </Text>
            </View>

            {groupByDate(sure).map(([date, items]) => (
              <View key={date}>
                <Text
                  className="mb-2 mt-1 uppercase text-ink-muted"
                  style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
                >
                  {formatDateShort(date)}
                </Text>
                {items.map(item => (
                  <SmsReviewCard
                    key={item.id}
                    item={item}
                    disabled={accepting}
                    onAccept={() => void accept(item).then(() => notification(Haptics.NotificationFeedbackType.Success))}
                    onEdit={() => setEditing(item)}
                    onDismiss={() => void dismiss(item.id)}
                  />
                ))}
              </View>
            ))}

            {/* Kept visually separate rather than mixed in, with the original
                message already open — a parse we're unsure about should never
                look as settled as one we're confident in. */}
            {unsure.length > 0 && (
              <View className="mt-4">
                <Text
                  className="mb-2 uppercase text-ink-muted"
                  style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
                >
                  Not sure about these ({unsure.length})
                </Text>
                {unsure.map(item => (
                  <SmsReviewCard
                    key={item.id}
                    item={item}
                    defaultExpanded
                    disabled={accepting}
                    onAccept={() => void accept(item).then(() => notification(Haptics.NotificationFeedbackType.Success))}
                    onEdit={() => setEditing(item)}
                    onDismiss={() => void dismiss(item.id)}
                  />
                ))}
              </View>
            )}

            {queue.length > 1 && (
              <Pressable
                onPress={confirmAcceptAll}
                disabled={accepting}
                accessibilityRole="button"
                className="mt-2 items-center rounded-2xl border border-line py-3.5 active:opacity-60"
              >
                <Text className="text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }}>
                  Add all {queue.length}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>

      <SmsEditSheet item={editing} onClose={() => setEditing(null)} onConfirm={handleEditConfirm} />
    </>
  );
};
