import { clsx } from 'clsx';
import type React from 'react';
import { Switch, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type SettingsToggleRowProps = {
  label: string;
  /** One-line explanation under the label. */
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Greys out and blocks the switch — used for channels under an off master. */
  disabled?: boolean;
};

export const SettingsToggleRow: React.FC<SettingsToggleRowProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}) => {
  const { colors } = useTheme();

  return (
    <View className={clsx('flex-row items-center justify-between gap-4 py-4', disabled && 'opacity-40')}>
      <View className="min-w-0 flex-1">
        <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
          {label}
        </Text>
        {description && (
          <Text
            className="mt-1 text-ink-muted"
            style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}
          >
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
};
