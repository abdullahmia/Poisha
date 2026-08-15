import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type ScreenHeaderProps = {
  title: string;
  /** Optional one-line description under the title. */
  subtitle?: string;
};

// Shared chrome for every Settings sub-screen: back chevron on its own line,
// then a large left-aligned title beneath it.
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle }) => {
  const { colors } = useTheme();

  return (
    <View className="pb-5 pt-2">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-9 w-9 items-center justify-start active:opacity-50"
      >
        <Feather name="arrow-left" size={22} color={colors.ink} />
      </Pressable>
      <Text
        className="mt-3 text-ink"
        style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 32, letterSpacing: -0.8 }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-2 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};
