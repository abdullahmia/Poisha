import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TEntry } from '@/lib/types';
import { Card } from '@/lib/ui/card.ui';

type PlanSummaryProps = {
  plannedTotal: number;
  count: number;
  nextDue: { entry: TEntry; daysAway: number } | null;
  thisMonth: { actual: number; planned: number; projected: number };
};

function dueLabel(daysAway: number): string {
  if (daysAway <= 0) return 'today';
  if (daysAway === 1) return 'tomorrow';
  return `in ${daysAway} days`;
}

export function PlanSummary({ plannedTotal, count, nextDue, thisMonth }: PlanSummaryProps) {
  const { fmt, fmtFull } = useLocale();
  const { categories } = useCategories();
  const style = useFadeIn(70);

  const nextName = nextDue
    ? nextDue.entry.note ||
      categories.find(c => c.id === nextDue.entry.categoryId)?.name ||
      'Next entry'
    : null;

  return (
    <Animated.View style={style}>
      <View className="items-center px-6 pb-6 pt-5">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_300Light', fontSize: 56, letterSpacing: -1.5, lineHeight: 62 }}>
          {fmtFull(plannedTotal)}
        </Text>
        <View className="mt-3.5 flex-row flex-wrap items-center justify-center gap-2 px-2">
          <Text className="text-ink-soft" style={{ fontSize: 12 }}>
            <Text className="text-ink" style={{ fontWeight: '500' }}>{count}</Text>
            {count === 1 ? ' planned' : ' planned'}
          </Text>
          {nextDue && (
            <>
              <Text className="text-line" style={{ fontSize: 12 }}>·</Text>
              <Text className="text-ink-soft" style={{ fontSize: 12 }} numberOfLines={1}>
                {'next '}
                <Text className="text-ink" style={{ fontWeight: '500' }}>{nextName}</Text>
                {` ${dueLabel(nextDue.daysAway)}`}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Planned money never stands alone — it sits beside what's already gone
          this month. Solid ink = real spend, ink-soft = planned (matching
          EntryCard's muting), accent = the sum that actually matters. */}
      <Card shadow className="mx-4 flex-row rounded-[20px] px-2 py-4">
        <View className="flex-1 items-center">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
            Spent
          </Text>
          <Text className="mt-1.5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, letterSpacing: -0.3 }} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(thisMonth.actual)}
          </Text>
        </View>
        <View className="w-px self-stretch bg-line" />
        <View className="flex-1 items-center">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
            Planned
          </Text>
          <Text className="mt-1.5 text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, letterSpacing: -0.3 }} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(thisMonth.planned)}
          </Text>
        </View>
        <View className="w-px self-stretch bg-line" />
        <View className="flex-1 items-center">
          <Text className="uppercase text-accent" style={{ fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
            Projected
          </Text>
          <Text className="mt-1.5 text-accent" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, letterSpacing: -0.3 }} numberOfLines={1} adjustsFontSizeToFit>
            {fmt(thisMonth.projected)}
          </Text>
        </View>
      </Card>
      <Text className="px-6 pt-2 text-center text-ink-muted" style={{ fontSize: 10 }}>
        this month
      </Text>
    </Animated.View>
  );
}
