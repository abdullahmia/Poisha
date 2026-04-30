import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Add01Icon, Home01Icon, ListViewIcon, Settings01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Tabs } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Palette } from '@/lib/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';

const TABS = [
  { name: 'index', label: 'Home', icon: Home01Icon },
  { name: 'explore', label: 'Entries', icon: ListViewIcon },
  { name: 'settings', label: 'Settings', icon: Settings01Icon },
];

interface TabButtonProps {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
  colors: Palette;
}

function TabButton({ tab, active, onPress, onLayout, colors }: TabButtonProps) {
  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
    >
      <View pointerEvents="none">
        <HugeiconsIcon
          icon={tab.icon}
          size={18}
          color={active ? colors.bg : colors.inkMuted}
          strokeWidth={active ? 2 : 1.5}
        />
      </View>
      {active && (
        <Text style={[styles.tabLabel, { color: colors.bg }]}>
          {tab.label}
        </Text>
      )}
    </Pressable>
  );
}

function PoishaTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { openAdd } = useEntries();
  const { colors } = useTheme();
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const initialized = useRef(false);

  const handleLayout = (i: number, x: number, width: number) => {
    setTabLayouts(prev => {
      const next = [...prev];
      next[i] = { x, width };

      // Set pill position instantly on first layout of the active tab
      if (!initialized.current && i === state.index) {
        pillX.value = x;
        pillW.value = width;
        initialized.current = true;
      }

      return next;
    });
  };

  const handleTabPress = (i: number, route: (typeof state.routes)[number]) => {
    const layout = tabLayouts[i];
    if (layout) {
      pillX.value = withSpring(layout.x, { damping: 24, stiffness: 300, mass: 0.8 });
      pillW.value = withSpring(layout.width, { damping: 24, stiffness: 300 });
    }
    const isFocused = state.index === i;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  const barStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderColor: colors.line,
  }), [colors]);

  const pillBg = useMemo(() => ({ backgroundColor: colors.ink }), [colors]);

  const addBtnStyle = useMemo(() => ({
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
  }), [colors]);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.bar, barStyle]}>
        <Animated.View style={[styles.pill, pillBg, pillStyle]} pointerEvents="none" />
        {state.routes.map((route, i) => {
          const tab = TABS[i];
          const isFocused = state.index === i;
          return (
            <TabButton
              key={route.key}
              tab={tab}
              active={isFocused}
              colors={colors}
              onPress={() => handleTabPress(i, route)}
              onLayout={(x, width) => handleLayout(i, x, width)}
            />
          );
        })}
        <Pressable onPress={openAdd} style={[styles.addBtn, addBtnStyle]} accessibilityLabel="Add entry">
          <View pointerEvents="none">
            <HugeiconsIcon icon={Add01Icon} size={20} color={colors.bg} strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={props => <PoishaTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  bar: {
    borderRadius: 999,
    borderWidth: 1,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 0,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
});
