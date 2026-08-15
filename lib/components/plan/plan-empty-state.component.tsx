import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useEntriesSheet } from '@/lib/context/entries-sheet.context';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { dateToISO, isoToDate, todayISO } from '@/lib/utils/date.util';

// Placeholder rows shaped like real entry cards. They teach what will land here
// far better than a lone icon does — the shape is the explanation.
function GhostRow({ opacity }: { opacity: number }) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-2xl border border-dashed border-line px-3.5 py-3"
      style={{ opacity }}
    >
      <View className="h-9 w-9 rounded-xl bg-surface-alt" />
      <View className="flex-1 gap-1.5">
        <View className="h-2 w-16 rounded-full bg-surface-alt" />
        <View className="h-2 w-10 rounded-full bg-surface-alt" />
      </View>
      <View className="h-2.5 w-11 rounded-full bg-surface-alt" />
    </View>
  );
}

export function PlanEmptyState() {
  const { colors } = useTheme();
  const { openAdd } = useEntriesSheet();

  // Open the form already on tomorrow — on today it would offer to *log* rather
  // than schedule, which is not what the button says.
  function handleSchedule() {
    const d = isoToDate(todayISO());
    d.setDate(d.getDate() + 1);
    openAdd(dateToISO(d));
  }

  return (
    <View className="flex-1 items-center justify-center px-8 pb-16">
      <View className="w-full max-w-[300px] gap-2.5">
        <GhostRow opacity={0.9} />
        <GhostRow opacity={0.5} />
        <GhostRow opacity={0.22} />
      </View>

      <Text
        className="mt-9 text-ink"
        style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 19, letterSpacing: -0.3 }}
      >
        Nothing planned yet
      </Text>
      <Text
        className="mt-2 max-w-[290px] text-center text-ink-muted"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}
      >
        Schedule rent, a subscription, or anything you know is coming. It stays out of your totals until its date
        arrives, then counts automatically.
      </Text>

      <Pressable
        onPress={handleSchedule}
        className="mt-7 flex-row items-center gap-2 rounded-2xl bg-accent px-6 py-4 active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel="Schedule an expense"
      >
        <Feather name="plus" size={15} color={colors.bg} />
        <Text className="text-bg" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.2 }}>
          Schedule an expense
        </Text>
      </Pressable>
    </View>
  );
}
