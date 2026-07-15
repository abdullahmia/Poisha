import { Text, View } from 'react-native';
import { useLocale } from '@/lib/hooks/use-locale.hook';

type ResultsSummaryProps = {
  count: number;
  total: number;
};

export function ResultsSummary({ count, total }: ResultsSummaryProps) {
  const { fmtFull } = useLocale();

  if (count === 0) return null;

  return (
    <View className="px-6 pb-1 pt-3.5">
      <Text className="text-ink-muted" style={{ fontSize: 11, letterSpacing: 0.5, fontFamily: 'Inter_400Regular' }}>
        {count} {count === 1 ? 'result' : 'results'} · {fmtFull(total)}
      </Text>
    </View>
  );
}
