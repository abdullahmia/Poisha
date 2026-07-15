import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export function SettingsHero() {
  const { colors } = useTheme();
  const style = useFadeIn(0);

  return (
    <Animated.View className="items-center pb-7 pt-8" style={style}>
      <View
        className="h-14 w-14 items-center justify-center rounded-full bg-accent"
        style={{ shadowColor: colors.accent, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 }}
      >
        <Feather name="settings" size={22} color={colors.bg} />
      </View>
      <Text className="mt-3 text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 26, letterSpacing: -0.4 }}>
        Settings
      </Text>
      <Text className="mt-1 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
        Tune how Poisha looks, protects, and tracks
      </Text>
    </Animated.View>
  );
}
