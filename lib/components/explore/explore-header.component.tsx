import type React from 'react';
import { Text, View } from 'react-native';

type ExploreHeaderProps = { right?: React.ReactNode };

export function ExploreHeader({ right }: ExploreHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-6 pt-7">
      <View>
        <Text className="uppercase text-ink-muted" style={{ fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_500Medium' }}>
          Browse
        </Text>
        <Text className="mt-1 text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, letterSpacing: -0.5 }}>
          Entries
        </Text>
      </View>
      {right}
    </View>
  );
}
