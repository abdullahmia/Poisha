import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { TCategory } from '@/lib/types';

type CategoryPickerProps = {
  categories: TCategory[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
};

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ categories, value, onChange }) => {
  if (categories.length === 0) return null;

  return (
    <View className="pt-[22px]">
      <Text
        className="mb-2 px-5 uppercase text-ink-muted"
        style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
      >
        Category <Text className="normal-case text-ink-muted" style={{ fontWeight: '400' }}>(optional)</Text>
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {categories.map(category => {
          const selected = value === category.id;
          return (
            <Pressable
              key={category.id}
              onPress={() => onChange(selected ? null : category.id)}
              className={clsx(
                'flex-row items-center gap-1.5 rounded-2xl border px-3.5 py-2.5',
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface-alt',
              )}
            >
              <Text style={{ fontSize: 15 }}>{category.icon}</Text>
              <Text
                className={selected ? 'text-accent' : 'text-ink-soft'}
                style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}
              >
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
