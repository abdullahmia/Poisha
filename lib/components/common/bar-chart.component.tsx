import { clsx } from 'clsx';
import type React from 'react';
import { View } from 'react-native';

type BarChartProps = {
  data: { day: number; amount: number }[];
  height?: number;
};

export const BarChart: React.FC<BarChartProps> = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.amount), 1);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height }}>
      {data.map((d, i) => {
        const barH = d.amount > 0 ? Math.max((d.amount / max) * height, 5) : 3;
        return (
          <View key={i} className="flex-1 justify-end">
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
