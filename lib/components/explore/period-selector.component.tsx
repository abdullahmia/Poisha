import { clsx } from 'clsx';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import type { TPeriod } from '@/lib/utils/date.util';

const PERIODS: { key: TPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
  // Rendered unconditionally, not gated on having planned entries — a chip that
  // only appears once you've used the feature can't teach you it exists. The
  // list's empty state does the teaching.
  { key: 'upcoming', label: 'Upcoming' },
];

type PeriodSelectorProps = {
  period: TPeriod;
  onChange: (period: TPeriod) => void;
};

export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  // Read the flag here rather than taking a prop: PERIODS is module-level and
  // the parent screen has no other reason to know about Plan Mode.
  const { enabled } = usePlanMode();
  const periods = useMemo(
    () => (enabled ? PERIODS : PERIODS.filter(p => p.key !== 'upcoming')),
    [enabled],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-5"
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
    >
      {periods.map(p => (
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
