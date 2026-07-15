import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export function HomeHeader() {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const style = useFadeIn(0);

  return (
    <Animated.View className="flex-row items-center justify-between px-6 pb-2 pt-7" style={style}>
      <View>
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, letterSpacing: -0.4, lineHeight: 26 }}>
          Poisha
        </Text>
        <Text className="mt-1 uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 2 }}>
          a quiet money journal
        </Text>
      </View>
      <View
        className="h-11 w-11 items-center justify-center rounded-full bg-accent"
        style={{ shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}
      >
        <Text className="text-bg" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 }}>{locale.symbol}</Text>
      </View>
    </Animated.View>
  );
}
