import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { SwipeableEntryCard } from '@/lib/components/entries/swipeable-entry-card.component';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TEntry } from '@/lib/types';
import { formatDateShort } from '@/lib/utils/date.util';
import type { TPeriod } from '@/lib/utils/date.util';

type EntriesListProps = {
  filtered: TEntry[];
  grouped: Record<string, TEntry[]>;
  showGroups: boolean;
  period: TPeriod;
  openEdit: (entry: TEntry) => void;
  openCardId: SharedValue<string | null>;
};

export function EntriesList({ filtered, grouped, showGroups, period, openEdit, openCardId }: EntriesListProps) {
  const { fmtFull } = useLocale();

  return (
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
  );
}
