import { Feather } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import type React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_TAB_ITEMS, TAB_ITEM_META } from '@/lib/constants';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTabBar } from '@/lib/hooks/use-tab-bar.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTabItem } from '@/lib/types';
import { isPinnedTabItem } from '@/lib/utils/tab-bar.util';
import { ScreenHeader } from '../shared/screen-header.component';
import { ReorderButtons } from '../todo/todo-taxonomy-shared.component';

const FEATURE_HINTS: Partial<Record<TTabItem, string>> = {
  plan: 'Turn on Plan Mode in Features to use this tab.',
  todo: 'Turn on Todo in Features to use this tab.',
};

function GroupLabel({ title, description }: { title: string; description: string }) {
  return (
    <View className="pb-1 pt-7">
      <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}>
        {title}
      </Text>
      <Text className="mt-1 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        {description}
      </Text>
    </View>
  );
}

/** A still copy of the real bar, so the effect of each change is visible here. */
function BarPreview({ items }: { items: TTabItem[] }) {
  const { colors } = useTheme();

  return (
    <View
      className="flex-row items-center rounded-[28px] border border-line bg-surface px-2 pb-2 pt-2.5"
      accessible
      accessibilityLabel={`Tab bar preview: ${items.map(item => TAB_ITEM_META[item].label).join(', ')}`}
    >
      {items.map(item => {
        const { label, icon } = TAB_ITEM_META[item];
        return (
          <View key={item} className="flex-1 items-center gap-1 py-1">
            <HugeiconsIcon icon={icon} size={20} color={colors.inkMuted} strokeWidth={1.5} />
            <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 10.5, letterSpacing: -0.1, color: colors.inkMuted }}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type ItemRowProps = {
  item: TTabItem;
  description?: string;
  dimmed?: boolean;
  children: React.ReactNode;
};

function ItemRow({ item, description, dimmed = false, children }: ItemRowProps) {
  const { colors } = useTheme();
  const { label, icon } = TAB_ITEM_META[item];

  return (
    <View className="flex-row items-center py-3.5">
      <View style={{ width: 28, opacity: dimmed ? 0.45 : 1 }}>
        <HugeiconsIcon icon={icon} size={18} color={colors.inkMuted} strokeWidth={1.5} />
      </View>
      <View className="min-w-0 flex-1" style={dimmed ? { opacity: 0.45 } : undefined}>
        <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15.5, letterSpacing: -0.2 }}>
          {label}
        </Text>
        {description && (
          <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>
            {description}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-2 pl-3">{children}</View>
    </View>
  );
}

type RoundButtonProps = {
  icon: 'plus' | 'minus';
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
};

function RoundButton({ icon, disabled = false, onPress, accessibilityLabel }: RoundButtonProps) {
  const { colors } = useTheme();
  const remove = icon === 'minus';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className={`h-8 w-8 items-center justify-center rounded-full active:opacity-70 ${remove ? 'bg-danger-soft' : 'bg-accent-soft'}`}
      style={disabled ? { opacity: 0.35 } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Feather name={icon} size={15} color={remove ? colors.danger : colors.accent} />
    </Pressable>
  );
}

export const TabBarSettings: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { selection } = useHaptics();
  const { items, order, isAvailable, isFull, setShown, move, reset } = useTabBar();

  const outOfBar = order.filter(item => !items.includes(item));

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Tab bar"
        subtitle={`Choose up to ${MAX_TAB_ITEMS} items for the bar along the bottom of the screen, and the order they sit in.`}
      />

      <BarPreview items={items} />

      <GroupLabel
        title="In the bar"
        description={`${items.length} of ${MAX_TAB_ITEMS} slots used. Add and Settings always stay in the bar.`}
      />
      {items.map((item, i) => {
        const pinned = isPinnedTabItem(item);
        const { label } = TAB_ITEM_META[item];
        return (
          <View key={item}>
            {i > 0 && <View className="ml-7 h-px bg-line" />}
            <ItemRow item={item} description={pinned ? 'Always in the bar' : undefined}>
              <ReorderButtons
                isFirst={i === 0}
                isLast={i === items.length - 1}
                onUp={() => { selection(); move(item, -1); }}
                onDown={() => { selection(); move(item, 1); }}
              />
              {pinned ? (
                <View className="h-8 w-8 items-center justify-center" accessibilityLabel={`${label} is always in the tab bar`}>
                  <Feather name="lock" size={13} color={colors.inkMuted} />
                </View>
              ) : (
                <RoundButton
                  icon="minus"
                  onPress={() => { selection(); setShown(item, false); }}
                  accessibilityLabel={`Remove ${label} from the tab bar`}
                />
              )}
            </ItemRow>
          </View>
        );
      })}

      <GroupLabel
        title="Not in the bar"
        description={
          isFull
            ? 'The bar is full. Remove something above to make room.'
            : 'Tap + to put one back in the bar.'
        }
      />
      {outOfBar.length === 0 ? (
        <Text className="py-3.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
          Everything is already in the bar.
        </Text>
      ) : (
        outOfBar.map((item, i) => {
          const available = isAvailable(item);
          const { label } = TAB_ITEM_META[item];
          return (
            <View key={item}>
              {i > 0 && <View className="ml-7 h-px bg-line" />}
              <ItemRow item={item} description={available ? undefined : FEATURE_HINTS[item]} dimmed={!available}>
                <RoundButton
                  icon="plus"
                  disabled={!available || isFull}
                  onPress={() => { selection(); setShown(item, true); }}
                  accessibilityLabel={`Add ${label} to the tab bar`}
                />
              </ItemRow>
            </View>
          );
        })
      )}

      <Pressable
        onPress={() => { selection(); reset(); }}
        className="mt-9 items-center rounded-xl border border-line py-3.5 active:opacity-65"
        accessibilityRole="button"
        accessibilityLabel="Reset tab bar to default"
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.inkSoft }}>
          Reset to default
        </Text>
      </Pressable>
    </ScrollView>
  );
};
