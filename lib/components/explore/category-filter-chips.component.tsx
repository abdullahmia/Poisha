import { clsx } from 'clsx';
import { Pressable, ScrollView, Text } from 'react-native';
import type { TCategory, TCategoryFilter } from '@/lib/types';

type CategoryFilterChipsProps = {
  categories: TCategory[];
  value: TCategoryFilter;
  onChange: (value: TCategoryFilter) => void;
};

export function CategoryFilterChips({ categories, value, onChange }: CategoryFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-3"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      <Chip label="All" selected={value === 'all'} onPress={() => onChange('all')} />
      {categories.map(category => (
        <Chip
          key={category.id}
          label={`${category.icon} ${category.name}`}
          selected={value === category.id}
          onPress={() => onChange(category.id)}
        />
      ))}
      <Chip label="Uncategorized" selected={value === 'uncategorized'} onPress={() => onChange('uncategorized')} />
    </ScrollView>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={clsx(
        'rounded-full border px-4 py-2',
        selected ? 'border-accent bg-accent' : 'border-line bg-surface',
      )}
    >
      <Text
        className={selected ? 'text-white' : 'text-ink-soft'}
        style={{ fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_500Medium', fontSize: 12 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
