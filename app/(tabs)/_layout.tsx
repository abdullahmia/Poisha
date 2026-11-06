import { TAB_ITEM_META } from '@/lib/constants';
import { useEntriesSheet } from '@/lib/context/entries-sheet.context';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { usePressScale } from '@/lib/hooks/use-press-scale.hook';
import { useTabBar } from '@/lib/hooks/use-tab-bar.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TPalette, TTabItem } from '@/lib/types';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import type React from 'react';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabButtonProps = {
  label: string;
  icon: (typeof TAB_ITEM_META)[TTabItem]['icon'];
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


// Derived from what expo-router's <Tabs> actually passes, rather than imported
// from @react-navigation — the two packages ship structurally different tab-bar
// prop types, and importing the wrong one fails to typecheck at the call site.
type PoishaTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const PoishaTabBar: React.FC<PoishaTabBarProps> = ({ state, emitter, navigateToTab }) => {
  const insets = useSafeAreaInsets();
  const { openAdd } = useEntriesSheet();
  const { colors } = useTheme();
  const { impact, selection } = useHaptics();
  // Already capped and ordered — Settings › Tab bar decides what is here.
  const { items } = useTabBar();

  function handleTabPress(i: number, route: (typeof state.routes)[number]) {
    selection();
    const isFocused = state.index === i;
    const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigateToTab(route.key);
    }
  }

  function renderItem(item: TTabItem) {
    const { label, icon, route } = TAB_ITEM_META[item];

    if (route === null) {
      return (
        <TabButton
          key={item}
          label={label}
          icon={icon}
          active={false}
          colors={colors}
          onPress={() => { impact(Haptics.ImpactFeedbackStyle.Medium); openAdd(); }}
        />
      );
    }

    const i = state.routes.findIndex(r => r.name === route);
    if (i === -1) return null;
    return (
      <TabButton
        key={item}
        label={label}
        icon={icon}
        active={state.index === i}
        colors={colors}
        onPress={() => handleTabPress(i, state.routes[i])}
      />
    );
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
          <View className="absolute inset-0 rounded-[32px] border border-line bg-surface" />
          <View className="flex-row items-center px-2 pb-2 pt-2.5">
            {items.map(renderItem)}
          </View>
        </View>
      </View>
    </View>
  );
};

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={props => <PoishaTabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, freezeOnBlur: true }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="plan" />
      <Tabs.Screen name="todo" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
