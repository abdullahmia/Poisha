import { useState } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryFilterChips } from '@/lib/components/explore/category-filter-chips.component';
import { DateFilterButton } from '@/lib/components/explore/date-filter-button.component';
import { DateFilterSheet } from '@/lib/components/explore/date-filter-sheet.component';
import { EntriesList } from '@/lib/components/explore/entries-list.component';
import { ExploreHeader } from '@/lib/components/explore/explore-header.component';
import { PeriodRangeNav } from '@/lib/components/explore/period-range-nav.component';
import { PeriodSelector } from '@/lib/components/explore/period-selector.component';
import { ResultsSummary } from '@/lib/components/explore/results-summary.component';
import { SortSelector } from '@/lib/components/explore/sort-selector.component';
import { StatsGrid } from '@/lib/components/explore/stats-grid.component';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useEntriesList } from '@/lib/hooks/use-entries-list.hook';

export default function ListScreen() {
  const { entries, openEdit } = useEntries();
  const { enabled: categoriesEnabled, categories } = useCategories();
  const insets = useSafeAreaInsets();
  const openCardId = useSharedValue<string | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

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
    categoryFilter,
    setCategoryFilter,
    dateFilter,
    setDateFilter,
    isDateFiltering,
  } = useEntriesList(entries);

  return (
    <>
      <EntriesList
        filtered={filtered}
        grouped={grouped}
        showGroups={showGroups}
        period={period}
        dateFilter={isDateFiltering ? dateFilter : undefined}
        openEdit={openEdit}
        openCardId={openCardId}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 12 }}>
            <ExploreHeader
              right={(
                <DateFilterButton
                  value={dateFilter}
                  onPress={() => setDatePickerVisible(true)}
                  onClear={() => setDateFilter(null)}
                />
              )}
            />
            {!isDateFiltering && <PeriodSelector period={period} onChange={handlePeriodChange} />}
            {/* Upcoming has no previous/next window to step through, same as
                the exact-day filter. */}
            {!isDateFiltering && period !== 'upcoming' && (
              <PeriodRangeNav period={period} setOffset={setOffset} range={range} canGoForward={canGoForward} />
            )}
            {categoriesEnabled && (
              <CategoryFilterChips categories={categories} value={categoryFilter} onChange={setCategoryFilter} />
            )}
            <StatsGrid stats={stats} period={isDateFiltering ? 'day' : period} />
            <SortSelector sort={sort} setSort={setSort} sorts={sorts} />
            <View className="mx-5 mt-[18px] h-px bg-line" />
            <ResultsSummary count={filtered.length} total={stats.total} />
          </View>
        }
      />
      <DateFilterSheet
        visible={datePickerVisible}
        value={dateFilter}
        onSelect={setDateFilter}
        onClear={() => setDateFilter(null)}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
}
