import { type Href, Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetBar } from '@/lib/components/home/budget-bar.component';
import { DailyFlowChart } from '@/lib/components/home/daily-flow-chart.component';
import { HomeHeader } from '@/lib/components/home/home-header.component';
import { LoadingSplash } from '@/lib/components/home/loading-splash.component';
import { MonthHero } from '@/lib/components/home/month-hero.component';
import { MonthNav } from '@/lib/components/home/month-nav.component';
import { RecentEntries } from '@/lib/components/home/recent-entries.component';
import { UpcomingSection } from '@/lib/components/home/upcoming-section.component';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useMonthRange } from '@/lib/hooks/use-month-range.hook';
import { useMonthlySummary } from '@/lib/hooks/use-monthly-summary.hook';
import { useTabBar } from '@/lib/hooks/use-tab-bar.hook';
import type { TTabItem } from '@/lib/types';

const TAB_HREFS: Partial<Record<TTabItem, Href>> = {
  entries: '/explore',
  plan: '/plan',
  todo: '/todo',
  settings: '/settings',
};

/**
 * Index is where the app lands: on launch, after unlock, and whenever Plan or
 * Todo redirect away because their feature is off. When Home is out of the bar,
 * it hands over to the first tab that is in it, so the user never lands on a
 * screen the bar can't get them back to.
 */
export default function HomeRoute() {
  const { items, loading } = useTabBar();

  if (loading) return <LoadingSplash />;
  if (!items.includes('home')) {
    // Settings is pinned, so there is always at least one route to land on.
    const first = items.find(item => TAB_HREFS[item] !== undefined);
    if (first) return <Redirect href={TAB_HREFS[first]!} />;
  }

  return <HomeScreen />;
}

function HomeScreen() {
  const { entries, loading } = useEntries();
  const insets = useSafeAreaInsets();
  const [monthOffset, setMonthOffset] = useState(0);
  const { refresh: refreshBudget } = useBudget();

  useFocusEffect(
    useCallback(() => {
      refreshBudget();
    }, [refreshBudget]),
  );

  const { monthLabel, monthKey, daysInMonth } = useMonthRange(monthOffset);
  const {
    total,
    plannedTotal,
    count,
    txCount,
    chartData,
    plannedByDay,
    maxDay,
    avgDay,
    budget,
  } = useMonthlySummary(entries, monthKey, daysInMonth);

  if (loading) {
    return <LoadingSplash />;
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader />
      <MonthNav monthOffset={monthOffset} setMonthOffset={setMonthOffset} monthLabel={monthLabel} />
      <MonthHero total={total} count={count} txCount={txCount} avgDay={avgDay} plannedTotal={plannedTotal} />
      {budget !== null && <BudgetBar spent={total} planned={plannedTotal} budget={budget} />}
      <DailyFlowChart
        chartData={chartData}
        plannedByDay={plannedByDay}
        maxDay={maxDay}
        daysInMonth={daysInMonth}
      />
      <UpcomingSection />
      <RecentEntries />
    </ScrollView>
  );
}
