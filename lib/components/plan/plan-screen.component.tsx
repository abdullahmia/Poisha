import { Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { usePlanSummary } from '@/lib/hooks/use-plan-summary.hook';
import { PlanCategoryBreakdown } from './plan-category-breakdown.component';
import { PlanEmptyState } from './plan-empty-state.component';
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
      // flexGrow so the empty state can claim the space under the header and
      // centre in it, instead of hugging the top with a void beneath.
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: 110 + insets.bottom }}
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
      ListEmptyComponent={<PlanEmptyState />}
    />
  );
}
