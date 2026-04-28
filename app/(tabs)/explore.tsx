import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntryCard } from '@/lib/components/entry-card.component';
import { ledger } from '@/lib/constants/theme';
import { useEntries } from '@/lib/hooks/use-entries.hook';

const fmtFull = (n: number) => `৳${n.toLocaleString('en-IN')}`;

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export default function ListScreen() {
  const { entries, openEdit } = useEntries();
  const insets = useSafeAreaInsets();

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [entries],
  );

  const grouped = useMemo(() => {
    const g: Record<string, typeof sorted> = {};
    sorted.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [sorted]);

  const total = entries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 110 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>All time</Text>
        <Text style={styles.headerTitle}>everything</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalAmount}>{fmtFull(total)}</Text>
          <Text style={styles.totalSub}>across {entries.length} entries</Text>
        </View>
      </View>

      {/* Grouped list */}
      <View style={styles.list}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyDot}>·</Text>
            <Text style={styles.emptyTitle}>nothing yet</Text>
            <Text style={styles.emptyHint}>Tap + to create your first entry</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
            return (
              <View key={date} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupDate}>{formatDate(date)}</Text>
                  <Text style={styles.groupTotal}>{fmtFull(dayTotal)}</Text>
                </View>
                {items.map((e, i) => (
                  <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} index={i} />
                ))}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ledger.bg,
  },
  content: {},
  header: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 0,
  },
  headerSub: {
    fontSize: 11,
    color: ledger.inkMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 36,
    color: ledger.ink,
    letterSpacing: -1.1,
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 14,
  },
  totalAmount: {
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 28,
    color: ledger.ink,
    letterSpacing: -0.6,
  },
  totalSub: {
    fontSize: 12,
    color: ledger.inkSoft,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  group: {
    marginBottom: 22,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ledger.line,
    marginBottom: 10,
  },
  groupDate: {
    fontSize: 11,
    color: ledger.inkSoft,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  groupTotal: {
    fontSize: 11,
    color: ledger.inkMuted,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyDot: {
    fontSize: 44,
    color: ledger.inkMuted,
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 18,
    color: ledger.inkSoft,
  },
  emptyHint: {
    fontSize: 12,
    color: ledger.inkMuted,
    marginTop: 6,
  },
});
