import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { EntryCard } from '@/lib/components/entries/entry-card.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { usePlanCutoff } from '@/lib/hooks/use-plan-cutoff.hook';
import { sumEntries } from '@/lib/utils/entries.util';

const MAX_VISIBLE = 5;

export function UpcomingSection() {
  const { entries, openEdit } = useEntries();
  const { fmtFull } = useLocale();
  const cutoff = usePlanCutoff();
  const style = useFadeIn(245);

  // Ascending — soonest first, the opposite of Recent and the whole point of
  // the section.
  const upcoming = entries
    .filter(e => e.date > cutoff)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  // No empty state by design: a user who never schedules anything sees a Home
  // screen identical to the one before this feature shipped.
  if (upcoming.length === 0) return null;

  const total = sumEntries(upcoming);
  const visible = upcoming.slice(0, MAX_VISIBLE);

  return (
    <Animated.View style={style}>
      <View className="flex-row items-baseline justify-between px-6 pb-2 pt-8">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.2 }}>
          Upcoming
        </Text>
        <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.8 }}>
          {upcoming.length} planned · {fmtFull(total)}
        </Text>
      </View>

      <View className="px-4 pt-1">
        {visible.map(e => (
          <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} />
        ))}
        {upcoming.length > MAX_VISIBLE && (
          <Text className="pb-1 pt-0.5 text-center text-ink-muted" style={{ fontSize: 11 }}>
            +{upcoming.length - MAX_VISIBLE} more in Browse › Upcoming
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
