import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

interface BarChartProps {
  data: { day: number; amount: number }[];
  height?: number;
}

export function BarChart({ data, height = 120 }: BarChartProps) {
  const { colors } = useTheme();
  const max = Math.max(...data.map(d => d.amount), 1);

  return (
    <View style={[styles.root, { height }]}>
      {data.map((d, i) => {
        const barH = d.amount > 0 ? Math.max((d.amount / max) * height, 5) : 3;
        return (
          <View key={i} style={styles.barWrap}>
            <View
              style={[
                styles.bar,
                {
                  height: barH,
                  backgroundColor: d.amount > 0 ? colors.accent : colors.line,
                  opacity: d.amount > 0 ? 1 : 0.5,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
