import { BarChart } from '@/lib/components/bar-chart.component';
import { EntryCard } from '@/lib/components/entry-card.component';
import { type Palette } from '@/lib/constants/theme';
import { Card } from '@/lib/ui/card.ui';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BudgetBarProps {
  spent: number;
  budget: number;
  colors: Palette;
}

function BudgetBar({ spent, budget, colors }: BudgetBarProps) {
  const { fmtFull } = useLocale();
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const exceeded = percent > 100;
  const displayPercent = Math.round(percent);
  const [trackWidth, setTrackWidth] = useState(0);
  const fillSv = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) {
      fillSv.value = withTiming(
        (Math.min(percent, 100) / 100) * trackWidth,
        { duration: 400, easing: Easing.out(Easing.quad) },
      );
    }
  }, [percent, trackWidth]);

  const fillStyle = useAnimatedStyle(() => ({ width: fillSv.value }));
  const fillColor = exceeded ? '#e84040' : colors.accent;
  const labelColor = exceeded ? '#e84040' : colors.inkMuted;

  return (
    <View style={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 20 }}>
      <View
        style={{ height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: 'hidden' }}
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: fillColor }, fillStyle]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: labelColor }}>
          {fmtFull(spent)} spent
        </Text>
        <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, color: labelColor }}>
          {displayPercent}% of {fmtFull(budget)}
        </Text>
      </View>
    </View>
  );
}

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
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
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
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.16,
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
  const { locale, fmt, fmtFull } = useLocale();
  const [monthOffset, setMonthOffset] = useState(0);
  const { budget, getProgress, refresh: refreshBudget } = useBudget();

  useFocusEffect(
    useCallback(() => {
      refreshBudget();
    }, [refreshBudget]),
  );

  const styles = useMemo(() => createStyles(colors), [colors]);

  const sv0 = useSharedValue(0);
  const sv1 = useSharedValue(0);
  const sv2 = useSharedValue(0);
  const sv3 = useSharedValue(0);
  const sv4 = useSharedValue(0);
  const sv5 = useSharedValue(0);

  useEffect(() => {
    if (!loading) {
      const config = { duration: 420, easing: Easing.out(Easing.cubic) };
      sv0.value = withTiming(1, config);
      sv1.value = withDelay(70,  withTiming(1, config));
      sv2.value = withDelay(140, withTiming(1, config));
      sv3.value = withDelay(210, withTiming(1, config));
      sv4.value = withDelay(280, withTiming(1, config));
      sv5.value = withDelay(210, withTiming(1, config));
    }
  }, [loading]);

  const headerStyle    = useAnimatedStyle(() => ({ opacity: sv0.value, transform: [{ translateY: (1 - sv0.value) * 12 }] }));
  const monthStyle     = useAnimatedStyle(() => ({ opacity: sv1.value, transform: [{ translateY: (1 - sv1.value) * 18 }] }));
  const heroStyle      = useAnimatedStyle(() => ({ opacity: sv2.value, transform: [{ translateY: (1 - sv2.value) * 18 }] }));
  const chartStyle     = useAnimatedStyle(() => ({ opacity: sv3.value, transform: [{ translateY: (1 - sv3.value) * 18 }] }));
  const recentStyle    = useAnimatedStyle(() => ({ opacity: sv4.value, transform: [{ translateY: (1 - sv4.value) * 18 }] }));
  const budgetBarStyle = useAnimatedStyle(() => ({ opacity: sv5.value, transform: [{ translateY: (1 - sv5.value) * 18 }] }));

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

  const progress = getProgress(total);

  useEffect(() => {
    if (!progress.exceeded || budget === null) return;
    AsyncStorage.getItem('poisha_budget_exceeded_month').then(stored => {
      if (stored === monthKey) return;
      Alert.alert(
        'Budget reached',
        `You've spent ${fmtFull(total)} this month, exceeding your ${fmtFull(budget)} budget.`,
        [{ text: 'OK' }],
      );
      AsyncStorage.setItem('poisha_budget_exceeded_month', monthKey);
    });
  }, [progress.exceeded, monthKey, total, budget]);

  const recent = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 4),
    [entries],
  );

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>poisha</Text>
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
      <Animated.View style={[styles.header, headerStyle]}>
        <View>
          <Text style={styles.brandName}>Poisha</Text>
          <Text style={styles.brandTagline}>a quiet money journal</Text>
        </View>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeText}>{locale.symbol}</Text>
        </View>
      </Animated.View>

      {/* Month selector */}
      <Animated.View style={[styles.monthSelector, monthStyle]}>
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
      </Animated.View>

      {/* Hero total */}
      <Animated.View style={[styles.heroSection, heroStyle]}>
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
      </Animated.View>

      {/* Budget bar */}
      {budget !== null && (
        <Animated.View style={budgetBarStyle}>
          <BudgetBar spent={total} budget={budget} colors={colors} />
        </Animated.View>
      )}

      {/* Chart */}
      <Animated.View style={chartStyle}>
        <Card shadow style={{ marginHorizontal: 16, padding: 16, paddingTop: 22, paddingBottom: 10, borderRadius: 20 }}>
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
        </Card>
      </Animated.View>

      {/* Recent */}
      <Animated.View style={recentStyle}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent</Text>
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
      </Animated.View>
    </ScrollView>
  );
}
