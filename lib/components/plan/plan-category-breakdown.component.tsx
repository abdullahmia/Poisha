import { clsx } from 'clsx';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import type { TPlanCategorySlice } from '@/lib/hooks/use-plan-summary.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';

type PlanCategoryBreakdownProps = {
  slices: TPlanCategorySlice[];
};

export function PlanCategoryBreakdown({ slices }: PlanCategoryBreakdownProps) {
  const { fmt } = useLocale();
  const { colors } = useTheme();
  const style = useFadeIn(175);

  return (
    <Animated.View style={style}>
      <View className="px-6 pb-2 pt-8">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, letterSpacing: -0.2 }}>
          Where it&apos;s going
        </Text>
      </View>

      <View className="px-4">
        <Card shadow className="rounded-[20px] px-4 py-1">
          {slices.map((s, i) => {
            // A null category is the Uncategorized fold-in — it keeps the shares
            // summing to the total instead of quietly dropping entries.
            const color = s.category?.color ?? colors.inkMuted;
            return (
              <View key={s.category?.id ?? 'uncategorized'} className={clsx('py-3', i > 0 && 'border-t border-line')}>
                <View className="mb-2 flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
                    <Text style={{ fontSize: 15 }}>{s.category?.icon ?? '❔'}</Text>
                    <Text className="min-w-0 flex-1 text-ink" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }} numberOfLines={1}>
                      {s.category?.name ?? 'Uncategorized'}
                    </Text>
                  </View>
                  <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 13, letterSpacing: -0.2 }}>
                    {fmt(s.total)}
                  </Text>
                </View>
                <View className="h-1.5 overflow-hidden rounded-full bg-line">
                  <View className="h-1.5 rounded-full" style={{ width: `${s.share * 100}%`, backgroundColor: color }} />
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </Animated.View>
  );
}
