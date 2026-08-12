import { Text, View } from 'react-native';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { Card } from '@/lib/ui/card.ui';
import type { TPeriod } from '@/lib/utils/date.util';

type TStats = {
  total: number;
  count: number;
  items: number;
  uniqueDays: number;
  avgDay: number;
  avgEntry: number;
  highest: number;
};

type StatsGridProps = {
  stats: TStats;
  period: TPeriod;
};

export function StatsGrid({ stats, period }: StatsGridProps) {
  const { fmt, fmtFull } = useLocale();
  const upcoming = period === 'upcoming';

  // A per-day average over arbitrary future dates is meaningless, so Upcoming
  // averages per entry instead. Collapsed into one object rather than three
  // parallel three-way ternaries inline.
  const avg = upcoming
    ? { label: 'Avg / Entry', value: stats.avgEntry, sub: `${stats.count} planned` }
    : period === 'day'
      ? {
          label: 'Avg / Item',
          value: stats.items > 0 ? Math.round(stats.total / stats.items) : 0,
          sub: `${stats.items} item${stats.items !== 1 ? 's' : ''}`,
        }
      : {
          label: 'Avg / Day',
          value: stats.avgDay,
          sub: `${stats.uniqueDays} active day${stats.uniqueDays !== 1 ? 's' : ''}`,
        };

  return (
    <View className="mt-5 gap-2.5 px-4">
      <View className="flex-row gap-2.5">
        <Card variant="accent" className="min-h-[90px] flex-1 justify-between p-4">
          <Text className="uppercase text-accent" style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>
            {upcoming ? 'Total Planned' : 'Total Spent'}
          </Text>
          <Text className="text-accent" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>
            {stats.total > 0 ? fmt(stats.total) : fmtFull(0)}
          </Text>
          <Text className="mt-1 text-ink-muted" style={{ fontSize: 10, fontFamily: 'Inter_400Regular' }}>
            {stats.count} {stats.count === 1 ? 'entry' : 'entries'}
          </Text>
        </Card>
        <Card className="min-h-[90px] flex-1 justify-between p-4">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>
            {avg.label}
          </Text>
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>
            {avg.value > 0 ? fmt(avg.value) : '—'}
          </Text>
          <Text className="mt-1 text-ink-muted" style={{ fontSize: 10, fontFamily: 'Inter_400Regular' }}>
            {avg.sub}
          </Text>
        </Card>
      </View>
      <View className="flex-row gap-2.5">
        <Card className="min-h-[90px] flex-1 justify-between p-4">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>Entries</Text>
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.5 }}>{stats.count}</Text>
          <Text className="mt-1 text-ink-muted" style={{ fontSize: 10, fontFamily: 'Inter_400Regular' }}>
            {stats.items} item{stats.items !== 1 ? 's' : ''} total
          </Text>
        </Card>
        <Card className="min-h-[90px] flex-1 justify-between p-4">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>Highest</Text>
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>
            {stats.highest > 0 ? fmt(stats.highest) : '—'}
          </Text>
          <Text className="mt-1 text-ink-muted" style={{ fontSize: 10, fontFamily: 'Inter_400Regular' }}>single entry</Text>
        </Card>
      </View>
    </View>
  );
}
