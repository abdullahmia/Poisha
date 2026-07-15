import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Add01Icon, Home01Icon, ListViewIcon, Settings01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TPalette } from '@/lib/types';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { usePressScale } from '@/lib/hooks/use-press-scale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

const TABS = [
  { name: 'index', label: 'Home', icon: Home01Icon },
  { name: 'explore', label: 'Entries', icon: ListViewIcon },
  { name: 'settings', label: 'Settings', icon: Settings01Icon },
];

type TabButtonProps = {
  label: string;
  icon: typeof Home01Icon;
  active: boolean;
  onPress: () => void;
  colors: TPalette;
};

const TabButton: React.FC<TabButtonProps> = ({ label, icon, active, onPress, colors }) => {
  const press = usePressScale(0.85);
  const focusBump = useSharedValue(1);

  useEffect(() => {
    if (active) {
      focusBump.value = withSequence(
        withSpring(1.25, { damping: 9, stiffness: 320 }),
        withSpring(1, { damping: 12, stiffness: 260 }),
      );
    }
  }, [active]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: press.scale.value * focusBump.value }],
  }));

  return (
    <Pressable
      className="flex-1 items-center justify-center gap-1 py-1"
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      <Animated.View style={iconStyle} pointerEvents="none">
        <HugeiconsIcon icon={icon} size={20} color={active ? colors.accent : colors.inkMuted} strokeWidth={active ? 2 : 1.5} />
      </Animated.View>
      <Text
        style={{
          fontFamily: 'DMSans_500Medium',
          fontSize: 10.5,
          letterSpacing: -0.1,
          color: active ? colors.accent : colors.inkMuted,
        }}
      >
        {label}
      </Text>
      {active && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          className="absolute bottom-0.5 h-1 w-1 rounded-full bg-accent"
        />
      )}
    </Pressable>
  );
};

const PoishaTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { openAdd } = useEntries();
  const { scheme, colors } = useTheme();
  const { impact, selection } = useHaptics();

  function handleTabPress(i: number, route: (typeof state.routes)[number]) {
    selection();
    const isFocused = state.index === i;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 px-6" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
      <View
        className="rounded-[32px]"
        style={{
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.22,
          shadowRadius: 26,
          elevation: 12,
        }}
      >
        <View className="overflow-hidden rounded-[32px]">
          <BlurView intensity={64} tint={scheme === 'dark' ? 'dark' : 'light'} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <View className="absolute inset-0 rounded-[32px] border border-line bg-surface/55" />
          <View className="flex-row items-center px-2 pb-2 pt-2.5">
            <TabButton
              label={TABS[0].label}
              icon={TABS[0].icon}
              active={state.index === 0}
              colors={colors}
              onPress={() => handleTabPress(0, state.routes[0])}
            />
            <TabButton
              label={TABS[1].label}
              icon={TABS[1].icon}
              active={state.index === 1}
              colors={colors}
              onPress={() => handleTabPress(1, state.routes[1])}
            />
            <TabButton
              label="Add"
              icon={Add01Icon}
              active={false}
              colors={colors}
              onPress={() => { impact(Haptics.ImpactFeedbackStyle.Medium); openAdd(); }}
            />
            <TabButton
              label={TABS[2].label}
              icon={TABS[2].icon}
              active={state.index === 2}
              colors={colors}
              onPress={() => handleTabPress(2, state.routes[2])}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs tabBar={props => <PoishaTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
