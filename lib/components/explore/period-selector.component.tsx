import { clsx } from 'clsx';
import { Pressable, ScrollView, Text } from 'react-native';
import type { TPeriod } from '@/lib/utils/date.util';

const PERIODS: { key: TPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

type PeriodSelectorProps = {
  period: TPeriod;
  onChange: (period: TPeriod) => void;
};

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-5"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {PERIODS.map(p => (
        <Pressable
          key={p.key}
          onPress={() => onChange(p.key)}
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
  );
}
