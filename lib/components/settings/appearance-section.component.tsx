import { Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function AppearanceSection() {
  const { scheme, colors, toggleScheme } = useTheme();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();
  const style = useFadeIn(70);

  return (
    <Animated.View style={style}>
      <SectionHeader icon="sliders" label="Appearance" />
      <Card className="overflow-hidden rounded-2xl">
        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name={scheme === 'dark' ? 'moon' : 'sun'} />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Theme</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{scheme === 'dark' ? 'Dark' : 'Light'}</Text>
            </View>
          </View>
          <Switch
            value={scheme === 'dark'}
            onValueChange={toggleScheme}
            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>

        <View className="mx-4 h-px bg-line" />

        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="zap" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Haptic Feedback</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{hapticsEnabled ? 'On' : 'Off'}</Text>
            </View>
          </View>
          <Switch
            value={hapticsEnabled}
            onValueChange={setHapticsEnabled}
            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>
    </Animated.View>
  );
}
