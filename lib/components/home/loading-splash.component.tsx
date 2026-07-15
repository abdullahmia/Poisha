import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function LoadingSplash() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center justify-center bg-bg" style={{ paddingTop: insets.top }}>
      <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 26, letterSpacing: -0.3 }}>
        poisha
      </Text>
    </View>
  );
}
