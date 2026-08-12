import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { EntryCard } from '@/lib/components/entries/entry-card.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { usePlanCutoff } from '@/lib/hooks/use-plan-cutoff.hook';

export function RecentEntries() {
  const { entries, openEdit } = useEntries();
  const cutoff = usePlanCutoff();
  const style = useFadeIn(280);

  // Planned entries are excluded — sorted newest-first they'd otherwise sit
  // permanently at the top of "Recent", which is the opposite of recent. With
  // Plan Mode off the cutoff lets everything through, as it did pre-feature.
  const recent = entries
    .filter(e => e.date <= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 4);

  return (
    <Animated.View style={style}>
      <View className="flex-row items-baseline justify-between px-6 pb-2 pt-8">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.2 }}>
          Recent
        </Text>
        <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.8 }}>
          last {recent.length}
        </Text>
      </View>

      <View className="px-4 pt-1">
        {recent.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-ink-muted" style={{ fontSize: 13 }}>No entries yet. Tap + to log one.</Text>
          </View>
        ) : (
          recent.map(e => (
            <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} />
          ))
        )}
      </View>
    </Animated.View>
  );
}
