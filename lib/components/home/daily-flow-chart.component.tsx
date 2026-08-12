import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { BarChart } from '@/lib/components/common/bar-chart.component';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { Card } from '@/lib/ui/card.ui';

type TDayAmount = { day: number; amount: number };

type DailyFlowChartProps = {
  chartData: TDayAmount[];
  plannedByDay: TDayAmount[];
  maxDay: TDayAmount | null;
  daysInMonth: number;
};

export function DailyFlowChart({ chartData, plannedByDay, maxDay, daysInMonth }: DailyFlowChartProps) {
  const { fmt } = useLocale();
  const style = useFadeIn(210);
  const hasPlanned = plannedByDay.some(d => d.amount > 0);

  return (
    <Animated.View style={style}>
      <Card shadow className="mx-4 rounded-[20px] p-4" style={{ paddingTop: 22, paddingBottom: 10 }}>
        <View className="mb-2 flex-row items-baseline justify-between px-1.5">
          <Text className="uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 1.6 }}>Daily flow</Text>
          {maxDay && (
            <Text className="text-ink-soft" style={{ fontSize: 11 }}>
              peak <Text className="font-semibold text-accent">{fmt(maxDay.amount)}</Text>
            </Text>
          )}
        </View>
        <BarChart data={chartData} planned={plannedByDay} height={120} />
        <View className="flex-row items-center justify-between px-2 pt-1.5">
          <Text className="text-ink-muted" style={{ fontSize: 9, letterSpacing: 1 }}>1</Text>
          {hasPlanned && (
            <View className="flex-row items-center gap-1.5">
              <View className="h-1.5 w-2.5 rounded-sm bg-accent opacity-30" />
              <Text className="text-ink-muted" style={{ fontSize: 9, letterSpacing: 0.6 }}>planned</Text>
            </View>
          )}
          <Text className="text-ink-muted" style={{ fontSize: 9, letterSpacing: 1 }}>{daysInMonth}</Text>
        </View>
      </Card>
    </Animated.View>
  );
}
