import { clsx } from 'clsx';
import type React from 'react';
import { View } from 'react-native';

type TDayAmount = { day: number; amount: number };

type BarChartProps = {
  data: TDayAmount[];
  /** Planned spend per day, same day-indexed shape as `data`. Drawn as a ghost
   *  segment stacked above the solid actual bar. */
  planned?: TDayAmount[];
  height?: number;
};

export const BarChart: React.FC<BarChartProps> = ({ data, planned, height = 120 }) => {
  // Scale against both series so a large planned day can't overflow the track.
  const max = Math.max(...data.map(d => d.amount), ...(planned?.map(d => d.amount) ?? []), 1);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => {
        const p = planned?.[i];
        const plannedAmount = p && p.day === d.day ? p.amount : 0;
        const barH = d.amount > 0 ? Math.max((d.amount / max) * height, 5) : 3;
        const plannedH = plannedAmount > 0 ? Math.max((plannedAmount / max) * height, 5) : 0;
        return (
          <View key={i} className="flex-1 justify-end">
            {plannedH > 0 && (
              <View className="mb-px rounded-t bg-accent opacity-30" style={{ height: plannedH }} />
            )}
            <View
              className={clsx('rounded-t', d.amount > 0 ? 'bg-accent' : 'bg-line opacity-50')}
              style={{ height: barH }}
            />
          </View>
        );
      })}
    </View>
  );
};
