import { clsx } from 'clsx';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { TSortKey } from '@/lib/hooks/use-entries-list.hook';

type SortSelectorProps = {
  sort: TSortKey;
  setSort: (sort: TSortKey) => void;
  sorts: { key: TSortKey; label: string }[];
};

export function SortSelector({ sort, setSort, sorts }: SortSelectorProps) {
  return (
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
  );
}
