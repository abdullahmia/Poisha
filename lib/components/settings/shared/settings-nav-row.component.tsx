import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TFeatherName } from './settings.types';

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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center py-[15px] active:opacity-45"
    >
      {/* Fixed-width icon column so every label starts on the same vertical
          line, and muted so the label leads instead of competing with it. */}
      <Feather
        name={icon}
        size={18}
        color={destructive ? colors.danger : colors.inkMuted}
        style={{ width: 28 }}
      />
      <Text
        className={clsx('min-w-0 flex-1', destructive ? 'text-danger' : 'text-ink')}
        style={{ fontFamily: 'Inter_400Regular', fontSize: 15.5, letterSpacing: -0.2 }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-2 pl-3">
        {value !== undefined && (
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }} numberOfLines={1}>
            {value}
          </Text>
        )}
        <Feather name="chevron-right" size={16} color={colors.inkMuted} />
      </View>
    </Pressable>
  );
};
