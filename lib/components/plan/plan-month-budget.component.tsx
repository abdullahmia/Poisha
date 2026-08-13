import { clsx } from 'clsx';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TPlanMonth } from '@/lib/hooks/use-plan-summary.hook';
import { Card } from '@/lib/ui/card.ui';

type PlanMonthBudgetProps = {
  months: TPlanMonth[];
  budget: number;
};

export function PlanMonthBudget({ months, budget }: PlanMonthBudgetProps) {
  const { fmt, fmtFull } = useLocale();
  const style = useFadeIn(140);

  return (
    <Animated.View style={style}>
      <View className="flex-row items-baseline justify-between px-6 pb-2 pt-8">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.2 }}>
          Against budget
        </Text>
        <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 1.8 }}>
          {fmtFull(budget)} / mo
        </Text>
      </View>

      <View className="px-4">
        <Card shadow className="rounded-[20px] px-4 py-1">
          {months.map((m, i) => {
            const actualPct = Math.min((m.actual / budget) * 100, 100);
            const plannedPct = Math.min((m.projected / budget) * 100, 100) - actualPct;
            const over = m.projected > budget;
            return (
              <View key={m.key} className={clsx('py-3.5', i > 0 && 'border-t border-line')}>
                <View className="mb-2 flex-row items-baseline justify-between">
                  <Text className="text-ink" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                    {m.label}
                  </Text>
                  {/* The percentage carries the warning; the bar segments stay
                      accent-coloured because an overrun here is a forecast, not
                      money already spent. */}
                  <Text
                    className={over ? 'text-danger' : 'text-ink-muted'}
                    style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 12 }}
                  >
                    {Math.round(m.percentOfBudget)}%
                  </Text>
                </View>
                <View className="h-1.5 flex-row overflow-hidden rounded-full bg-line">
                  <View className="h-1.5 bg-accent" style={{ width: `${actualPct}%` }} />
                  <View className="h-1.5 bg-accent opacity-30" style={{ width: `${Math.max(plannedPct, 0)}%` }} />
                </View>
                <View className="mt-1.5 flex-row justify-between">
                  <Text className="text-ink-muted" style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}>
                    {m.actual > 0 ? `${fmt(m.actual)} spent · ` : ''}{fmt(m.planned)} planned
                  </Text>
                  <Text className="text-ink-muted" style={{ fontFamily: 'DMSans_400Regular', fontSize: 11 }}>
                    {fmt(m.projected)} projected
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </Animated.View>
  );
}
