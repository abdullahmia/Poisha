import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { sectionLabelStyle, type TFeatherName } from './settings-styles.constants';

export const RowIcon: React.FC<{ name: TFeatherName; color?: string; bg?: string }> = ({ name, color, bg }) => {
  const { colors } = useTheme();
  return (
    <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: bg ?? colors.surfaceAlt }}>
      <Feather name={name} size={16} color={color ?? colors.inkSoft} />
    </View>
  );
};

export const SectionHeader: React.FC<{ icon: TFeatherName; label: string }> = ({ icon, label }) => {
  const { colors } = useTheme();
  return (
    <View className="mb-2 flex-row items-center gap-1.5">
      <Feather name={icon} size={12} color={colors.inkMuted} />
      <Text className="uppercase text-ink-muted" style={sectionLabelStyle}>{label}</Text>
    </View>
  );
};
