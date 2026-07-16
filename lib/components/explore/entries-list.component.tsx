import { useMemo } from 'react';
import type React from 'react';
import { SectionList, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { SwipeableEntryCard } from '@/lib/components/entries/swipeable-entry-card.component';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TEntry } from '@/lib/types';
import { formatDateShort } from '@/lib/utils/date.util';
import type { TPeriod } from '@/lib/utils/date.util';

type TSection = { title: string; dayTotal: number; data: TEntry[] };

type EntriesListProps = {
  filtered: TEntry[];
  grouped: Record<string, TEntry[]>;
  showGroups: boolean;
  period: TPeriod;
  openEdit: (entry: TEntry) => void;
  openCardId: SharedValue<string | null>;
  ListHeaderComponent?: React.ReactElement;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

function sumAmounts(entries: TEntry[]) {
  return entries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
}

export function EntriesList({
  filtered,
  grouped,
  showGroups,
  period,
  openEdit,
  openCardId,
  ListHeaderComponent,
  contentContainerStyle,
}: EntriesListProps) {
  const { fmtFull } = useLocale();

  // SectionList's flat item list is what gets virtualized — only rows near the
  // viewport ever mount their gesture handler + animated styles, unlike the
  // previous plain `.map()` inside a ScrollView which mounted every entry at once.
  const sections = useMemo((): TSection[] => {
    if (!showGroups) return [{ title: '', dayTotal: 0, data: filtered }];
    return Object.entries(grouped).map(([date, items]) => ({
      title: date,
      dayTotal: sumAmounts(items),
      data: items,
    }));
  }, [filtered, grouped, showGroups]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      className="flex-1 bg-bg"
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
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
      }
      renderSectionHeader={showGroups ? ({ section }) => (
        <View className="mb-2.5 flex-row items-baseline justify-between border-b border-line bg-bg px-6 pb-2.5">
          <Text className="uppercase text-ink-soft" style={{ fontSize: 11, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
            {formatDateShort(section.title)}
          </Text>
          <Text className="text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13, letterSpacing: -0.2 }}>
            {fmtFull(section.dayTotal)}
          </Text>
        </View>
      ) : undefined}
      renderSectionFooter={showGroups ? () => <View style={{ height: 22 }} /> : undefined}
      renderItem={({ item }) => (
        <View className="px-4">
          <SwipeableEntryCard entry={item} onEdit={openEdit} openCardId={openCardId} />
        </View>
      )}
    />
  );
}
