import { clsx } from 'clsx';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwipeableEntryCard } from '@/lib/components/swipeable-entry-card.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useEntriesList } from '@/lib/hooks/use-entries-list.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { Card } from '@/lib/ui/card.ui';
import { formatDateShort } from '@/lib/utils/date.util';
import type { TPeriod } from '@/lib/utils/date.util';

const PERIODS: { key: TPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

export default function ListScreen() {
  const { entries, openEdit } = useEntries();
  const insets = useSafeAreaInsets();
  const { fmt, fmtFull } = useLocale();
  const openCardId = useSharedValue<string | null>(null);

  const {
    period,
    sort,
    setSort,
    setOffset,
    sorts,
    handlePeriodChange,
    range,
    filtered,
    stats,
    grouped,
    canGoForward,
    showGroups,
  } = useEntriesList(entries);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-7">
        <Text className="uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_500Medium' }}>
          Browse
        </Text>
        <Text className="mt-1 text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, letterSpacing: -0.5 }}>
          Entries
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-5"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {PERIODS.map(p => (
          <Pressable
            key={p.key}
            onPress={() => handlePeriodChange(p.key)}
            className={clsx(
              'rounded-full border px-5 py-2.5',
              period === p.key ? 'border-accent bg-accent' : 'border-line bg-surface',
            )}
          >
            <Text
              className={period === p.key ? 'text-white' : 'text-ink-soft'}
              style={{ fontFamily: period === p.key ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 13 }}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {period !== 'all' && (
        <View className="mt-4 flex-row items-center gap-3 px-5">
          <Pressable
            onPress={() => setOffset(o => o - 1)}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
            accessibilityLabel="Previous period"
          >
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 24, lineHeight: 28, marginTop: -1 }}>‹</Text>
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16, letterSpacing: -0.2 }}>
              {range.label}
            </Text>
            {range.label !== range.sublabel && (
              <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11 }}>
                {range.sublabel}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => setOffset(o => Math.min(0, o + 1))}
            disabled={!canGoForward}
            className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
            style={!canGoForward ? { opacity: 0.25 } : undefined}
            accessibilityLabel="Next period"
          >
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 24, lineHeight: 28, marginTop: -1 }}>›</Text>
          </Pressable>
        </View>
      )}

      <View className="mt-5 gap-2.5 px-4">
        <View className="flex-row gap-2.5">
          <Card variant="accent" className="min-h-[90px] flex-1 justify-between p-4">
            <Text className="uppercase text-accent" style={{ fontSize: 10, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>
              Total Spent
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
              {period === 'day' ? 'Avg / Item' : 'Avg / Day'}
            </Text>
            <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 22, letterSpacing: -0.5 }} numberOfLines={1} adjustsFontSizeToFit>
              {period === 'day'
                ? (stats.items > 0 ? fmt(Math.round(stats.total / stats.items)) : '—')
                : (stats.avgDay > 0 ? fmt(stats.avgDay) : '—')}
            </Text>
            <Text className="mt-1 text-ink-muted" style={{ fontSize: 10, fontFamily: 'Inter_400Regular' }}>
              {period === 'day'
                ? `${stats.items} item${stats.items !== 1 ? 's' : ''}`
                : `${stats.uniqueDays} active day${stats.uniqueDays !== 1 ? 's' : ''}`}
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

      <View className="mt-[18px] flex-row items-center gap-3 pl-5">
        <Text className="shrink-0 uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 1.5, fontFamily: 'Inter_500Medium' }}>
          Sort
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6, paddingRight: 20 }}>
          {sorts.map(s => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              className={clsx(
                'rounded-full border px-3.5 py-1.5',
                sort === s.key ? 'border-ink-soft bg-surface-alt' : 'border-line bg-surface',
              )}
            >
              <Text
                className={sort === s.key ? 'text-ink' : 'text-ink-muted'}
                style={{ fontSize: 12, fontFamily: 'Inter_500Medium' }}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mx-5 mt-[18px] h-px bg-line" />

      {filtered.length > 0 && (
        <View className="px-6 pb-1 pt-3.5">
          <Text className="text-ink-muted" style={{ fontSize: 11, letterSpacing: 0.5, fontFamily: 'Inter_400Regular' }}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'} · {fmtFull(stats.total)}
          </Text>
        </View>
      )}

      <View className="px-4 pt-3">
        {filtered.length === 0 ? (
          <View className="items-center py-14">
            <View className="mb-4 h-[52px] w-[52px] items-center justify-center rounded-full border border-line bg-surface">
              <Text className="text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20 }}>0</Text>
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 }}>No entries</Text>
            <Text className="mt-1.5 px-8 text-center text-ink-muted" style={{ fontSize: 12, fontFamily: 'Inter_400Regular' }}>
              {period === 'all'
                ? 'Tap + to create your first entry'
                : 'No spending recorded in this period'}
            </Text>
          </View>
        ) : showGroups ? (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
            return (
              <View key={date} className="mb-[22px]">
                <View className="mb-2.5 flex-row items-baseline justify-between border-b border-line px-2 pb-2.5">
                  <Text className="uppercase text-ink-soft" style={{ fontSize: 11, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
                    {formatDateShort(date)}
                  </Text>
                  <Text className="text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13, letterSpacing: -0.2 }}>
                    {fmtFull(dayTotal)}
                  </Text>
                </View>
                {items.map(e => (
                  <SwipeableEntryCard key={e.id} entry={e} onEdit={openEdit} openCardId={openCardId} />
                ))}
              </View>
            );
          })
        ) : (
          filtered.map(e => (
            <SwipeableEntryCard key={e.id} entry={e} onEdit={openEdit} openCardId={openCardId} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
