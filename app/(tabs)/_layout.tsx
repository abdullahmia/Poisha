import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Add01Icon, Home01Icon, ListViewIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ledger } from '@/lib/constants/theme';
import { useEntries } from '@/lib/hooks/use-entries.hook';

const TABS = [
  { name: 'index', label: 'Home', icon: Home01Icon },
  { name: 'explore', label: 'Entries', icon: ListViewIcon },
];

interface TabButtonProps {
  tab: (typeof TABS)[number];
  active: boolean;
  onPress: () => void;
  onLayout: (x: number, width: number) => void;
}

function TabButton({ tab, active, onPress, onLayout }: TabButtonProps) {
  const labelOpacity = useSharedValue(active ? 1 : 0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    labelOpacity.value = withTiming(active ? 1 : 0, { duration: 180 });
    if (active) {
      iconScale.value = withSequence(
        withSpring(1.22, { damping: 10, stiffness: 420 }),
        withSpring(1, { damping: 18, stiffness: 360 }),
      );
    }
  }, [active]);

  const labelStyle = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      style={styles.tab}
      onPress={onPress}
      onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)}
    >
      <Animated.View style={iconStyle}>
        <HugeiconsIcon
          icon={tab.icon}
          size={18}
          color={active ? ledger.ink : ledger.inkMuted}
          strokeWidth={active ? 2 : 1.5}
        />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, labelStyle]}>
        {tab.label}
      </Animated.Text>
    </Pressable>
  );
}

function LedgerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { openAdd } = useEntries();
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  useEffect(() => {
    const layout = tabLayouts[state.index];
    if (!layout) return;
    pillX.value = withSpring(layout.x, { damping: 22, stiffness: 260, mass: 0.85 });
    pillW.value = withSpring(layout.width, { damping: 22, stiffness: 260 });
  }, [state.index, tabLayouts]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
  }));

  const handleLayout = (i: number, x: number, width: number) => {
    setTabLayouts(prev => {
      const next = [...prev];
      next[i] = { x, width };
      return next;
    });
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
        {state.routes.map((route, i) => {
          const tab = TABS[i];
          const isFocused = state.index === i;
          return (
            <TabButton
              key={route.key}
              tab={tab}
              active={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLayout={(x, width) => handleLayout(i, x, width)}
            />
          );
        })}
        <Pressable onPress={openAdd} style={styles.addBtn} accessibilityLabel="Add entry">
          <HugeiconsIcon icon={Add01Icon} size={20} color={ledger.bg} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={props => <LedgerTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
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
    backgroundColor: ledger.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ledger.line,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(240,236,229,0.08)',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: ledger.ink,
    letterSpacing: -0.13,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ledger.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ledger.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
});
