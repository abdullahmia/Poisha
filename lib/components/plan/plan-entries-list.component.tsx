import type React from 'react';
import { useMemo } from 'react';
import { SectionList, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { SwipeableEntryCard } from '@/lib/components/entries/swipeable-entry-card.component';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TPlanMonth } from '@/lib/hooks/use-plan-summary.hook';
import type { TEntry } from '@/lib/types';
import { formatDateShort } from '@/lib/utils/date.util';

type TSection = { title: string; total: number; data: TEntry[] };

type PlanEntriesListProps = {
  months: TPlanMonth[];
  openEdit: (entry: TEntry) => void;
  openCardId: SharedValue<string | null>;
  ListHeaderComponent?: React.ReactElement;
  ListEmptyComponent?: React.ReactElement;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

// Grouped by month, not by date — explore/entries-list.component.tsx renders
// formatDateShort() on its section titles, so feeding it month keys would print
// garbage. SwipeableEntryCard is the part worth sharing, and it is shared.
export function PlanEntriesList({
  months,
  openEdit,
  openCardId,
  ListHeaderComponent,
  ListEmptyComponent,
  contentContainerStyle,
}: PlanEntriesListProps) {
  const { fmtFull } = useLocale();

  const sections = useMemo(
    (): TSection[] => months.map(m => ({ title: m.label, total: m.planned, data: m.entries })),
    [months],
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={item => item.id}
      className="flex-1 bg-bg"
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      renderSectionHeader={({ section }) => (
        <View className="mb-2.5 flex-row items-baseline justify-between border-b border-line bg-bg px-6 pb-2.5">
          <Text className="uppercase text-ink-soft" style={{ fontSize: 11, letterSpacing: 1.4, fontFamily: 'Inter_500Medium' }}>
            {section.title}
          </Text>
          <Text className="text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13, letterSpacing: -0.2 }}>
            {fmtFull(section.total)}
          </Text>
        </View>
      )}
      renderSectionFooter={() => <View style={{ height: 22 }} />}
      renderItem={({ item }) => (
        <View className="px-4">
          <Text className="px-1 pb-1 text-ink-muted" style={{ fontSize: 10, letterSpacing: 0.4 }}>
            {formatDateShort(item.date)}
          </Text>
          <SwipeableEntryCard entry={item} onEdit={openEdit} openCardId={openCardId} />
        </View>
      )}
    />
  );
}
