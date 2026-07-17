import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { router } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function CategoriesSection() {
  const { colors } = useTheme();
  const { enabled, setEnabled } = useCategories();
  const style = useFadeIn(315);

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="tag" label="Categories" />
      <Card className="overflow-hidden rounded-2xl">
        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="tag" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Enable Categories</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{enabled ? 'On' : 'Off'}</Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>

        {enabled && (
          <>
            <View className="mx-4 h-px bg-line" />
            <Pressable
              onPress={() => router.push('/category-management')}
              className={clsx(rowClass, 'active:opacity-60')}
              accessibilityLabel="Manage Categories"
            >
              <View className="flex-row items-center gap-3">
                <RowIcon name="list" />
                <Text className="text-ink" style={rowLabelStyle}>Manage Categories</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.inkMuted} />
            </Pressable>
          </>
        )}
      </Card>
    </Animated.View>
  );
}
