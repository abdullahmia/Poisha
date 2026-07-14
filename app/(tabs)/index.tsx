import { useFocusEffect } from 'expo-router';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart } from '@/lib/components/bar-chart.component';
import { EntryCard } from '@/lib/components/entry-card.component';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useHomeFadeIn } from '@/lib/hooks/use-home-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useMonthRange } from '@/lib/hooks/use-month-range.hook';
import { useMonthlySummary } from '@/lib/hooks/use-monthly-summary.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';

type BudgetBarProps = {
  spent: number;
  budget: number;
};

const BudgetBar: React.FC<BudgetBarProps> = ({ spent, budget }) => {
  const { colors } = useTheme();
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

  return (
    <View className="px-6 pb-5 pt-1">
      <View
        className="h-1.5 overflow-hidden rounded-full bg-line"
        onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      >
        <Animated.View
          className="h-1.5 rounded-full"
          style={[{ backgroundColor: exceeded ? colors.danger : colors.accent }, fillStyle]}
        />
      </View>
      <View className="mt-1.5 flex-row justify-between">
        <Text
          className={exceeded ? 'text-danger' : 'text-ink-muted'}
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}
        >
          {fmtFull(spent)} spent
        </Text>
        <Text
          className={exceeded ? 'text-danger' : 'text-ink-muted'}
          style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}
        >
          {displayPercent}% of {fmtFull(budget)}
        </Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const { entries, loading, openEdit } = useEntries();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { locale, fmt, fmtFull } = useLocale();
  const [monthOffset, setMonthOffset] = useState(0);
  const { refresh: refreshBudget } = useBudget();

  useFocusEffect(
    useCallback(() => {
      refreshBudget();
    }, [refreshBudget]),
  );

  const { monthLabel, monthKey, daysInMonth } = useMonthRange(monthOffset);
  const { total, count, txCount, chartData, maxDay, avgDay, budget } = useMonthlySummary(
    entries,
    monthKey,
    daysInMonth,
  );

  const { headerStyle, monthStyle, heroStyle, chartStyle, recentStyle, budgetBarStyle } = useHomeFadeIn(!loading);

  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 4);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg" style={{ paddingTop: insets.top }}>
        <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, letterSpacing: -0.3 }}>
          poisha
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View className="flex-row items-center justify-between px-6 pb-2 pt-7" style={headerStyle}>
        <View>
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, letterSpacing: -0.4, lineHeight: 26 }}>
            Poisha
          </Text>
          <Text className="mt-1 uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 2 }}>
            a quiet money journal
          </Text>
        </View>
        <View
          className="h-11 w-11 items-center justify-center rounded-full bg-accent"
          style={{ shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}
        >
          <Text className="text-bg" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 }}>{locale.symbol}</Text>
        </View>
      </Animated.View>

      <Animated.View className="flex-row items-center gap-3 px-6 pt-6" style={monthStyle}>
        <Pressable
          onPress={() => setMonthOffset(monthOffset - 1)}
          className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
          accessibilityLabel="Previous month"
        >
          <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 22, lineHeight: 26, marginTop: -1 }}>‹</Text>
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="mb-0.5 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2 }}>Summary</Text>
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 15, letterSpacing: -0.1 }}>
            {monthLabel}
          </Text>
        </View>
        <Pressable
          onPress={() => setMonthOffset(Math.min(0, monthOffset + 1))}
          disabled={monthOffset >= 0}
          className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
          style={monthOffset >= 0 ? { opacity: 0.3 } : undefined}
          accessibilityLabel="Next month"
        >
          <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 22, lineHeight: 26, marginTop: -1 }}>›</Text>
        </Pressable>
      </Animated.View>

      <Animated.View className="items-center px-6 pb-7 pt-5" style={heroStyle}>
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_300Light', fontSize: 56, letterSpacing: -1.5, lineHeight: 62 }}>
          {fmtFull(total)}
        </Text>
        <View className="mt-3.5 flex-row flex-wrap items-center justify-center gap-2 px-2">
          <Text className="text-ink-soft" style={{ fontSize: 12 }}>
            <Text className="text-ink" style={{ fontWeight: '500' }}>{count}</Text>
            {' entries'}
          </Text>
          <Text className="text-line" style={{ fontSize: 12 }}>·</Text>
          <Text className="text-ink-soft" style={{ fontSize: 12 }}>
            <Text className="text-ink" style={{ fontWeight: '500' }}>{txCount}</Text>
            {' items'}
          </Text>
          <Text className="text-line" style={{ fontSize: 12 }}>·</Text>
          <Text className="text-ink-soft" style={{ fontSize: 12 }}>
            <Text className="text-ink" style={{ fontWeight: '500' }}>{fmt(Math.round(avgDay))}</Text>
            {' / day'}
          </Text>
        </View>
      </Animated.View>

      {budget !== null && (
        <Animated.View style={budgetBarStyle}>
          <BudgetBar spent={total} budget={budget} />
        </Animated.View>
      )}

      <Animated.View style={chartStyle}>
        <Card shadow className="mx-4 rounded-[20px] p-4" style={{ paddingTop: 22, paddingBottom: 10 }}>
          <View className="mb-2 flex-row items-baseline justify-between px-1.5">
            <Text className="uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 1.6 }}>Daily flow</Text>
            {maxDay && (
              <Text className="text-ink-soft" style={{ fontSize: 11 }}>
                peak <Text className="font-semibold text-accent">{fmt(maxDay.amount)}</Text>
              </Text>
            )}
          </View>
          <BarChart data={chartData} height={120} />
          <View className="flex-row justify-between px-2 pt-1.5">
            <Text className="text-ink-muted" style={{ fontSize: 9, letterSpacing: 1 }}>1</Text>
            <Text className="text-ink-muted" style={{ fontSize: 9, letterSpacing: 1 }}>{daysInMonth}</Text>
          </View>
        </Card>
      </Animated.View>

      <Animated.View style={recentStyle}>
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
    </ScrollView>
  );
}
