import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TFeatherName } from './settings-styles.constants';

type SettingsNavRowProps = {
  icon: TFeatherName;
  label: string;
  /** Right-hand value shown before the chevron, e.g. a currency symbol. */
  value?: string;
  /** Destructive rows render in `danger` — the one colour that survives. */
  destructive?: boolean;
  onPress: () => void;
};

export const SettingsNavRow: React.FC<SettingsNavRowProps> = ({
  icon,
  label,
  value,
  destructive = false,
  onPress,
}) => {
  const { colors } = useTheme();
  const tint = destructive ? colors.danger : colors.inkSoft;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={clsx('flex-row items-center justify-between py-4 active:opacity-50')}
    >
      <View className="min-w-0 flex-1 flex-row items-center gap-3.5">
        <Feather name={icon} size={19} color={tint} />
        <Text
          className={clsx('min-w-0 flex-1', destructive ? 'text-danger' : 'text-ink')}
          style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2 pl-3">
        {value !== undefined && (
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }} numberOfLines={1}>
            {value}
          </Text>
        )}
        <Feather name="chevron-right" size={18} color={colors.inkMuted} />
      </View>
    </Pressable>
  );
};
