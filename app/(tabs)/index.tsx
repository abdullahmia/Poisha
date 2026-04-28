import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from '@/lib/components/bar-chart.component';
import { EntryCard } from '@/lib/components/entry-card.component';
import { type Palette } from '@/lib/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';

const fmt = (n: number) => {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  if (n >= 10000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString('en-IN')}`;
};

const fmtFull = (n: number) => `৳${n.toLocaleString('en-IN')}`;

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      paddingHorizontal: 0,
    },
    loadingScreen: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 26,
      color: c.inkSoft,
      letterSpacing: -0.3,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 28,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brandName: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 22,
      color: c.ink,
      letterSpacing: -0.4,
      lineHeight: 26,
    },
    brandTagline: {
      fontSize: 11,
      color: c.inkMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginTop: 4,
    },
    brandBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 8,
    },
    brandBadgeText: {
      fontFamily: 'SpaceGrotesk_700Bold',
      fontSize: 16,
      color: c.bg,
    },
    monthSelector: {
      paddingHorizontal: 24,
      paddingTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    navBtnText: {
      fontFamily: 'Inter_400Regular',
      fontSize: 22,
      color: c.inkSoft,
      lineHeight: 26,
      marginTop: -1,
    },
    monthLabelWrap: {
      flex: 1,
      alignItems: 'center',
    },
    monthSublabel: {
      fontSize: 10,
      color: c.inkMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    monthName: {
      fontFamily: 'SpaceGrotesk_500Medium',
      fontSize: 15,
      color: c.ink,
      letterSpacing: -0.1,
    },
    heroSection: {
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 28,
      alignItems: 'center',
    },
    heroAmount: {
      fontFamily: 'SpaceGrotesk_300Light',
      fontSize: 56,
      color: c.ink,
      letterSpacing: -1.5,
      lineHeight: 62,
    },
    heroStats: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginTop: 14,
      paddingHorizontal: 8,
    },
    heroStat: {
      fontSize: 12,
      color: c.inkSoft,
    },
    heroStatNum: {
      color: c.ink,
      fontWeight: '500',
    },
    heroDot: {
      color: c.line,
    },
    chartCard: {
      marginHorizontal: 16,
      padding: 16,
      paddingTop: 22,
      paddingBottom: 10,
      backgroundColor: c.surface,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 6,
      marginBottom: 8,
    },
    chartTitle: {
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      color: c.inkMuted,
    },
    chartPeak: {
      fontSize: 11,
      color: c.inkSoft,
    },
    chartPeakValue: {
      color: c.accent,
      fontWeight: '600',
    },
    chartFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      paddingTop: 6,
    },
    chartFooterLabel: {
      fontSize: 9,
      color: c.inkMuted,
      letterSpacing: 1,
    },
    recentHeader: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 8,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    recentTitle: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 18,
      color: c.ink,
      letterSpacing: -0.2,
    },
    recentCount: {
      fontSize: 10,
      color: c.inkMuted,
      letterSpacing: 1.8,
      textTransform: 'uppercase',
    },
    recentList: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    emptyState: {
      paddingVertical: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 13,
      color: c.inkMuted,
    },
  });
}

export default function HomeScreen() {
  const { entries, loading, openEdit } = useEntries();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [monthOffset, setMonthOffset] = useState(0);

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { monthLabel, monthKey, daysInMonth } = useMemo(() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return {
      monthLabel: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      daysInMonth: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
    };
  }, [monthOffset]);

  const monthEntries = useMemo(
    () => entries.filter(e => e.date.startsWith(monthKey)),
    [entries, monthKey],
  );

  const total = useMemo(
    () => monthEntries.reduce((s, e) => s + e.amounts.reduce((a, b) => a + b, 0), 0),
    [monthEntries],
  );

  const count = monthEntries.length;
  const txCount = monthEntries.reduce((s, e) => s + e.amounts.length, 0);

  const chartData = useMemo(() => {
    const map: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) map[i] = 0;
    monthEntries.forEach(e => {
      const day = parseInt(e.date.split('-')[2], 10);
      map[day] = (map[day] || 0) + e.amounts.reduce((a, b) => a + b, 0);
    });
    return Object.entries(map).map(([day, amount]) => ({ day: parseInt(day), amount }));
  }, [monthEntries, daysInMonth]);

  const maxDay = useMemo(() => {
    if (chartData.every(d => d.amount === 0)) return null;
    return chartData.reduce((m, d) => d.amount > (m?.amount ?? 0) ? d : m, null as typeof chartData[0] | null);
  }, [chartData]);

  const uniqueDays = new Set(monthEntries.map(e => e.date)).size;
  const avgDay = count > 0 ? total / uniqueDays : 0;

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4),
    [entries],
  );

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>ledger</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 110 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandName}>ledger</Text>
          <Text style={styles.brandTagline}>a quiet money journal</Text>
        </View>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>৳</Text>
        </View>
      </View>

      {/* Month selector */}
      <View style={styles.monthSelector}>
        <Pressable
          onPress={() => setMonthOffset(monthOffset - 1)}
          style={styles.navBtn}
          accessibilityLabel="Previous month"
        >
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <View style={styles.monthLabelWrap}>
          <Text style={styles.monthSublabel}>Summary</Text>
          <Text style={styles.monthName}>{monthLabel}</Text>
        </View>
        <Pressable
          onPress={() => setMonthOffset(Math.min(0, monthOffset + 1))}
          disabled={monthOffset >= 0}
          style={[styles.navBtn, monthOffset >= 0 && { opacity: 0.3 }]}
          accessibilityLabel="Next month"
        >
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </View>

      {/* Hero total */}
      <View style={styles.heroSection}>
        <Text style={styles.heroAmount}>{fmtFull(total)}</Text>
        <View style={styles.heroStats}>
          <Text style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{count}</Text>
            {' entries'}
          </Text>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{txCount}</Text>
            {' items'}
          </Text>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{fmt(Math.round(avgDay))}</Text>
            {' / day'}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Daily flow</Text>
          {maxDay && (
            <Text style={styles.chartPeak}>
              peak <Text style={styles.chartPeakValue}>{fmt(maxDay.amount)}</Text>
            </Text>
          )}
        </View>
        <BarChart data={chartData} height={120} />
        <View style={styles.chartFooter}>
          <Text style={styles.chartFooterLabel}>1</Text>
          <Text style={styles.chartFooterLabel}>{daysInMonth}</Text>
        </View>
      </View>

      {/* Recent */}
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>recent</Text>
        <Text style={styles.recentCount}>last {recent.length}</Text>
      </View>

      <View style={styles.recentList}>
        {recent.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No entries yet. Tap + to log one.</Text>
          </View>
        ) : (
          recent.map((e, i) => (
            <EntryCard key={e.id} entry={e} onClick={() => openEdit(e)} index={i} />
          ))
        )}
      </View>
    </ScrollView>
  );
}
