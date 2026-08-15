import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TThemePreference } from '@/lib/types';
import { DARK_THEME, LIGHT_THEME } from '@/lib/constants';
import { ScreenHeader } from '../shared/screen-header.component';

type TOption = { key: TThemePreference; label: string };

const OPTIONS: TOption[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
];

// A miniature of the app: page, a title bar and two rows. Painted from the real
// palette constants rather than hardcoded hexes, so it can never drift from what
// tapping it actually produces.
const Preview: React.FC<{ option: TThemePreference; systemScheme: 'light' | 'dark' }> = ({
  option,
  systemScheme,
}) => {
  const resolved = option === 'system' ? systemScheme : option;
  const p = resolved === 'dark' ? DARK_THEME : LIGHT_THEME;

  return (
    <View
      className="h-[104px] w-full overflow-hidden rounded-xl"
      style={{ backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }}
    >
      <View className="px-2.5 pt-3">
        <View className="h-1.5 w-9 rounded-full" style={{ backgroundColor: p.ink }} />
        <View className="mt-1.5 h-1 w-6 rounded-full" style={{ backgroundColor: p.inkMuted }} />
      </View>
      <View className="mt-3 gap-1.5 px-2.5">
        {[0, 1].map(i => (
          <View
            key={i}
            className="h-5 flex-row items-center rounded-md px-1.5"
            style={{ backgroundColor: p.surface, borderWidth: 1, borderColor: p.line }}
          >
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: p.accent }} />
            <View className="ml-1.5 h-1 flex-1 rounded-full" style={{ backgroundColor: p.inkMuted }} />
          </View>
        ))}
      </View>
    </View>
  );
};

export const Appearance: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { preference, systemScheme, colors, setPreference } = useTheme();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Appearance" subtitle="Choose how Poisha looks. System follows your device setting." />

      <View className="flex-row gap-3 pt-2">
        {OPTIONS.map(o => {
          const selected = preference === o.key;
          return (
            <Pressable
              key={o.key}
              onPress={() => setPreference(o.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={o.label}
              className="flex-1 active:opacity-70"
            >
              <Preview option={o.key} systemScheme={systemScheme} />
              <Text
                className={clsx('mt-2.5 text-center', selected ? 'text-ink' : 'text-ink-soft')}
                style={{ fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular', fontSize: 13 }}
              >
                {o.label}
              </Text>
              <View className="mt-1.5 items-center">
                <View
                  className="h-[18px] w-[18px] items-center justify-center rounded-full"
                  style={{ borderWidth: selected ? 5 : 1.5, borderColor: selected ? colors.ink : colors.line }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text className="pt-8 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        Changes apply immediately.
      </Text>
    </ScrollView>
  );
};
