import { ScrollView, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntriesList } from '@/lib/components/explore/entries-list.component';
import { ExploreHeader } from '@/lib/components/explore/explore-header.component';
import { PeriodRangeNav } from '@/lib/components/explore/period-range-nav.component';
import { PeriodSelector } from '@/lib/components/explore/period-selector.component';
import { ResultsSummary } from '@/lib/components/explore/results-summary.component';
import { SortSelector } from '@/lib/components/explore/sort-selector.component';
import { StatsGrid } from '@/lib/components/explore/stats-grid.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useEntriesList } from '@/lib/hooks/use-entries-list.hook';

export default function ListScreen() {
  const { entries, openEdit } = useEntries();
  const insets = useSafeAreaInsets();
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
      <ExploreHeader />
      <PeriodSelector period={period} onChange={handlePeriodChange} />
      <PeriodRangeNav period={period} setOffset={setOffset} range={range} canGoForward={canGoForward} />
      <StatsGrid stats={stats} period={period} />
      <SortSelector sort={sort} setSort={setSort} sorts={sorts} />
      <View className="mx-5 mt-[18px] h-px bg-line" />
      <ResultsSummary count={filtered.length} total={stats.total} />
      <EntriesList
        filtered={filtered}
        grouped={grouped}
        showGroups={showGroups}
        period={period}
        openEdit={openEdit}
        openCardId={openCardId}
      />
    </ScrollView>
  );
}
