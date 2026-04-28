import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntryCard } from '@/lib/components/entry-card.component';
import { type Palette } from '@/lib/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';

type Period = 'day' | 'week' | 'month' | 'year' | 'all';
type SortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'date-desc', label: 'Newest' },
  { key: 'date-asc', label: 'Oldest' },
  { key: 'amount-desc', label: 'Highest ৳' },
  { key: 'amount-asc', label: 'Lowest ৳' },
];

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface PeriodRange {
  start: string;
  end: string;
  label: string;
  sublabel: string;
}

function getPeriodRange(period: Period, offset: number): PeriodRange {
  if (period === 'all') return { start: '', end: '', label: 'All Time', sublabel: 'every entry' };

  const now = new Date();

  if (period === 'day') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const iso = toISO(d);
    const label = offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      start: iso,
      end: iso,
      label,
      sublabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }

  if (period === 'week') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dow + 6) % 7) + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const startFmt = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFmt = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      start: toISO(monday),
      end: toISO(sunday),
      label: offset === 0 ? 'This Week' : `${startFmt} – ${endFmt}`,
      sublabel: `${startFmt} – ${endFmt}, ${sunday.getFullYear()}`,
    };
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: toISO(d),
      end: toISO(end),
      label: offset === 0 ? 'This Month' : d.toLocaleDateString('en-US', { month: 'long' }),
      sublabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  const year = now.getFullYear() + offset;
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: offset === 0 ? 'This Year' : String(year),
    sublabel: String(year),
  };
}

const fmtFull = (n: number) => `৳${n.toLocaleString('en-IN')}`;
const fmt = (n: number) => {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  if (n >= 10000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString('en-IN')}`;
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {},

    header: {
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 0,
    },
    headerSub: {
      fontSize: 11,
      color: c.inkMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontFamily: 'Inter_500Medium',
    },
    headerTitle: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 30,
      color: c.ink,
      letterSpacing: -0.5,
      marginTop: 4,
    },

    pillsScroll: {
      marginTop: 20,
    },
    pillsWrap: {
      paddingHorizontal: 20,
      gap: 8,
    },
    pill: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    pillActive: {
      backgroundColor: c.accent,
      borderColor: c.accent,
    },
    pillText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: c.inkSoft,
    },
    pillTextActive: {
      fontFamily: 'Inter_600SemiBold',
      color: '#ffffff',
    },

    navigator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 16,
      gap: 12,
    },
    navBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navBtnDisabled: {
      opacity: 0.25,
    },
    navArrow: {
      fontFamily: 'Inter_400Regular',
      fontSize: 24,
      color: c.inkSoft,
      lineHeight: 28,
      marginTop: -1,
    },
    navCenter: {
      flex: 1,
      alignItems: 'center',
    },
    navLabel: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 16,
      color: c.ink,
      letterSpacing: -0.2,
    },
    navSublabel: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: c.inkMuted,
      marginTop: 2,
    },

    statsGrid: {
      paddingHorizontal: 16,
      marginTop: 20,
      gap: 10,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: c.line,
      minHeight: 90,
      justifyContent: 'space-between',
    },
    statCardAccent: {
      backgroundColor: c.accentSoft,
      borderColor: c.line,
    },
    statLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      color: c.inkMuted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    statLabelAccent: {
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      color: c.accent,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    statValue: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 22,
      color: c.ink,
      letterSpacing: -0.5,
    },
    statValueAccent: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 22,
      color: c.accent,
      letterSpacing: -0.5,
    },
    statMeta: {
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      color: c.inkMuted,
      marginTop: 4,
    },

    sortRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 20,
      marginTop: 18,
      gap: 12,
    },
    sortLabel: {
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
      color: c.inkMuted,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      flexShrink: 0,
    },
    sortChips: {
      flexDirection: 'row',
      gap: 6,
      paddingRight: 20,
    },
    sortChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    sortChipActive: {
      backgroundColor: c.surfaceAlt,
      borderColor: c.inkSoft,
    },
    sortChipText: {
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      color: c.inkMuted,
    },
    sortChipTextActive: {
      color: c.ink,
    },

    divider: {
      height: 1,
      backgroundColor: c.line,
      marginHorizontal: 20,
      marginTop: 18,
    },

    resultsSummary: {
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 4,
    },
    resultsText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      color: c.inkMuted,
      letterSpacing: 0.5,
    },

    list: {
      paddingHorizontal: 16,
      paddingTop: 12,
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
      borderBottomColor: c.line,
      marginBottom: 10,
    },
    groupDate: {
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
      color: c.inkSoft,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    groupTotal: {
      fontFamily: 'SpaceGrotesk_500Medium',
      fontSize: 13,
      color: c.inkMuted,
      letterSpacing: -0.2,
    },

    emptyState: {
      paddingVertical: 56,
      alignItems: 'center',
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    emptyIconText: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 20,
      color: c.inkMuted,
    },
    emptyTitle: {
      fontFamily: 'SpaceGrotesk_500Medium',
      fontSize: 17,
      color: c.inkSoft,
    },
    emptyHint: {
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      color: c.inkMuted,
      marginTop: 6,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
  });
}

export default function ListScreen() {
  const { entries, openEdit } = useEntries();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState<SortKey>('date-desc');

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handlePeriodChange = (p: Period) => { setPeriod(p); setOffset(0); };

  const range = useMemo(() => getPeriodRange(period, offset), [period, offset]);

  const filtered = useMemo(() => {
    const base = period === 'all'
      ? [...entries]
      : entries.filter(e => e.date >= range.start && e.date <= range.end);

    return base.sort((a, b) => {
      if (sort === 'date-desc') return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
      if (sort === 'date-asc') return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      const aT = a.amounts.reduce((s, n) => s + n, 0);
      const bT = b.amounts.reduce((s, n) => s + n, 0);
      return sort === 'amount-desc' ? bT - aT : aT - bT;
    });
  }, [entries, period, offset, sort, range]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
    const count = filtered.length;
    const items = filtered.reduce((s, e) => s + e.amounts.length, 0);
    const uniqueDays = new Set(filtered.map(e => e.date)).size;
    const avgDay = uniqueDays > 0 ? Math.round(total / uniqueDays) : 0;
    const highest = filtered.reduce((m, e) => {
      const t = e.amounts.reduce((a, b) => a + b, 0);
      return t > m ? t : m;
    }, 0);
    return { total, count, items, uniqueDays, avgDay, highest };
  }, [filtered]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [filtered]);

  const canGoForward = period !== 'all' && offset < 0;
  const showGroups = sort === 'date-desc' || sort === 'date-asc';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 110 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Browse</Text>
        <Text style={styles.headerTitle}>Entries</Text>
      </View>

      {/* Period pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillsScroll}
        contentContainerStyle={styles.pillsWrap}
      >
        {PERIODS.map(p => (
          <Pressable
            key={p.key}
            onPress={() => handlePeriodChange(p.key)}
            style={[styles.pill, period === p.key && styles.pillActive]}
          >
            <Text style={[styles.pillText, period === p.key && styles.pillTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Period navigator */}
      {period !== 'all' && (
        <View style={styles.navigator}>
          <Pressable
            onPress={() => setOffset(o => o - 1)}
            style={styles.navBtn}
            accessibilityLabel="Previous period"
          >
            <Text style={styles.navArrow}>‹</Text>
          </Pressable>
          <View style={styles.navCenter}>
            <Text style={styles.navLabel}>{range.label}</Text>
            {range.label !== range.sublabel && (
              <Text style={styles.navSublabel}>{range.sublabel}</Text>
            )}
          </View>
          <Pressable
            onPress={() => setOffset(o => Math.min(0, o + 1))}
            disabled={!canGoForward}
            style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
            accessibilityLabel="Next period"
          >
            <Text style={styles.navArrow}>›</Text>
          </Pressable>
        </View>
      )}

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabelAccent}>Total Spent</Text>
            <Text style={styles.statValueAccent} numberOfLines={1} adjustsFontSizeToFit>
              {stats.total > 0 ? fmt(stats.total) : '৳0'}
            </Text>
            <Text style={styles.statMeta}>
              {stats.count} {stats.count === 1 ? 'entry' : 'entries'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              {period === 'day' ? 'Avg / Item' : 'Avg / Day'}
            </Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {period === 'day'
                ? (stats.items > 0 ? fmt(Math.round(stats.total / stats.items)) : '—')
                : (stats.avgDay > 0 ? fmt(stats.avgDay) : '—')}
            </Text>
            <Text style={styles.statMeta}>
              {period === 'day'
                ? `${stats.items} item${stats.items !== 1 ? 's' : ''}`
                : `${stats.uniqueDays} active day${stats.uniqueDays !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Entries</Text>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statMeta}>{stats.items} item{stats.items !== 1 ? 's' : ''} total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Highest</Text>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {stats.highest > 0 ? fmt(stats.highest) : '—'}
            </Text>
            <Text style={styles.statMeta}>single entry</Text>
          </View>
        </View>
      </View>

      {/* Sort bar */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
          {SORTS.map(s => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sortChip, sort === s.key && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, sort === s.key && styles.sortChipTextActive]}>{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.divider} />

      {filtered.length > 0 && (
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsText}>
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'} · {fmtFull(stats.total)}
          </Text>
        </View>
      )}

      {/* List */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>0</Text>
            </View>
            <Text style={styles.emptyTitle}>No entries</Text>
            <Text style={styles.emptyHint}>
              {period === 'all'
                ? 'Tap + to create your first entry'
                : 'No spending recorded in this period'}
            </Text>
          </View>
        ) : showGroups ? (
          Object.entries(grouped).map(([date, items]) => {
            const dayTotal = items.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0);
            return (
              <View key={date} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupDate}>{formatDate(date)}</Text>
                  <Text style={styles.groupTotal}>{fmtFull(dayTotal)}</Text>
                </View>
                {items.map(e => (
                  <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} />
                ))}
              </View>
            );
          })
        ) : (
          filtered.map(e => (
            <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
