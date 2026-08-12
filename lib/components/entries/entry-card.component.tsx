import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { usePlanCutoff } from '@/lib/hooks/use-plan-cutoff.hook';
import type { TEntry } from '@/lib/types';
import { Card } from '@/lib/ui/card.ui';
import { isoToDate, isUpcomingISO } from '@/lib/utils/date.util';

type EntryCardProps = {
  entry: TEntry;
  onClick: () => void;
};

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onClick }) => {
  const { fmt, fmtFull } = useLocale();
  const { categories } = useCategories();
  const cutoff = usePlanCutoff();

  const category = entry.categoryId ? categories.find(c => c.id === entry.categoryId) : undefined;
  const total = entry.amounts.reduce((a, b) => a + b, 0);
  const multi = entry.amounts.length > 1;
  const planned = isUpcomingISO(entry.date, cutoff);
  const d = isoToDate(entry.date);

  return (
    <Pressable
      onPress={onClick}
      className={clsx('mb-2.5')}
      style={({ pressed }) => (pressed ? { opacity: 0.7, transform: [{ scale: 0.985 }] } : undefined)}
    >
      <Card
        shadow
        className="relative flex-row items-center justify-between overflow-hidden border-0 p-4"
        style={{ shadowOpacity: 0.22 }}
      >
        {(category || multi) && (
          <View
            className={clsx('absolute bottom-0 left-0 top-0 w-[3px]', !category && 'bg-accent', planned && 'opacity-40')}
            style={category ? { backgroundColor: category.color } : undefined}
          />
        )}

        <View className="min-w-0 flex-1 flex-row items-center gap-3.5">
          <View
            className={clsx(
              'h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl',
              !category && (multi ? 'border border-line bg-accent-soft' : 'bg-surface-alt'),
            )}
            style={category ? { backgroundColor: `${category.color}22`, borderWidth: 1, borderColor: category.color } : undefined}
          >
            {category ? (
              <Text style={{ fontSize: 20 }}>{category.icon}</Text>
            ) : (
              <>
                <Text
                  className={clsx(multi ? 'text-accent' : 'text-ink-soft')}
                  style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, lineHeight: 18 }}
                >
                  {d.getDate()}
                </Text>
                <Text
                  className={clsx('mt-0.5 uppercase tracking-widest', multi ? 'text-accent opacity-75' : 'text-ink-muted')}
                  style={{ fontSize: 8, letterSpacing: 1.5 }}
                >
                  {d.toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-ink" style={{ fontFamily: 'Inter_500Medium', fontSize: 13, letterSpacing: -0.1 }}>
              {d.toLocaleDateString('en-US', { weekday: 'long' })}
            </Text>
            <View className="mt-0.5 flex-row items-center gap-1.5">
              {planned && (
                <View className="rounded-full border border-line px-1.5 py-[1px]">
                  <Text
                    className="uppercase text-ink-muted"
                    style={{ fontSize: 8, letterSpacing: 1, fontFamily: 'Inter_600SemiBold' }}
                  >
                    Planned
                  </Text>
                </View>
              )}
              <Text className="min-w-0 flex-1 text-ink-muted" style={{ fontSize: 11 }} numberOfLines={1}>
                {multi ? `${entry.amounts.length} items` : entry.note || category?.name || '—'}
              </Text>
            </View>
          </View>
        </View>

        <View className="items-end pl-3">
          <Text
            className={clsx(planned ? 'text-ink-soft' : multi ? 'text-accent' : 'text-ink')}
            style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.3 }}
          >
            {fmtFull(total)}
          </Text>
          {multi && (
            <Text className="mt-1 max-w-[130px] text-ink-muted" style={{ fontSize: 10 }} numberOfLines={1}>
              {entry.amounts.map(a => fmt(a)).join(' · ')}
            </Text>
          )}
        </View>
      </Card>
    </Pressable>
  );
};
