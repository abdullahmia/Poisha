import { Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function PlanningSection() {
  const { colors } = useTheme();
  const { enabled, setEnabled } = usePlanMode();
  const style = useFadeIn(300);

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="calendar" label="Planning" />
      <Card className="overflow-hidden rounded-2xl">
        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="calendar" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Enable Plan Mode</Text>
              {/* The off state is where the explanatory copy earns its place —
                  that's when the user is deciding whether to flip it. */}
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>
                {enabled ? 'On' : 'Schedule future entries'}
              </Text>
            </View>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>
    </Animated.View>
  );
}
