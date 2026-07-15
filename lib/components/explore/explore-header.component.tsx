import { Text, View } from 'react-native';

export function ExploreHeader() {
  return (
    <View className="px-6 pt-7">
      <Text className="uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_500Medium' }}>
        Browse
      </Text>
      <Text className="mt-1 text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, letterSpacing: -0.5 }}>
        Entries
      </Text>
    </View>
  );
}
