import { Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { usePlanSummary } from '@/lib/hooks/use-plan-summary.hook';
import { PlanCategoryBreakdown } from './plan-category-breakdown.component';
import { PlanEntriesList } from './plan-entries-list.component';
import { PlanHeader } from './plan-header.component';
import { PlanMonthBudget } from './plan-month-budget.component';
import { PlanSummary } from './plan-summary.component';

export function PlanScreen() {
  const { openEdit } = useEntries();
  const insets = useSafeAreaInsets();
  const openCardId = useSharedValue<string | null>(null);
  const {
    plannedTotal,
    count,
    nextDue,
    thisMonth,
    months,
    categoryBreakdown,
    budget,
  } = usePlanSummary();

  const isEmpty = count === 0;

  return (
    <PlanEntriesList
      months={months}
      openEdit={openEdit}
      openCardId={openCardId}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
      ListHeaderComponent={
        <View style={{ paddingBottom: 12 }}>
          <PlanHeader />
          {/* At zero the screen is a title and one sentence, not a wall of ৳0 —
              this is what every user sees the moment they flip Plan Mode on. */}
          {!isEmpty && (
            <>
              <PlanSummary
                plannedTotal={plannedTotal}
                count={count}
                nextDue={nextDue}
                thisMonth={thisMonth}
              />
              {budget !== null && <PlanMonthBudget months={months} budget={budget} />}
              {categoryBreakdown.length > 0 && <PlanCategoryBreakdown slices={categoryBreakdown} />}
              <View className="px-6 pb-2 pt-8">
                <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.2 }}>
                  Scheduled
                </Text>
              </View>
            </>
          )}
        </View>
      }
      ListEmptyComponent={
        <View className="items-center px-8 py-14">
          <View className="mb-4 h-[52px] w-[52px] items-center justify-center rounded-full border border-line bg-surface">
            <Text style={{ fontSize: 20 }}>🗓</Text>
          </View>
          <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 }}>
            Nothing planned yet
          </Text>
          <Text className="mt-1.5 text-center text-ink-muted" style={{ fontSize: 12, fontFamily: 'Inter_400Regular' }}>
            Tap + and pick a future date to schedule an expense.
          </Text>
        </View>
      }
    />
  );
}
