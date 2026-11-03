import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type SelectChipProps = {
  label: string;
  selected: boolean;
  /** When given, a selected chip adopts this colour instead of the accent. */
  color?: string;
  icon?: keyof typeof Feather.glyphMap;
  /** Leading emoji, shown before the label — lists carry one, tags don't. */
  emoji?: string;
  onPress: () => void;
};

/**
 * The one chip used by every picker in the module — list, priority, tag, due
 * filter, sort. Keeping them identical is what makes an unfamiliar row of
 * options read as "tap one of these" without a label explaining it.
 */
export const SelectChip: React.FC<SelectChipProps> = ({ label, selected, color, icon, emoji, onPress }) => {
  const { colors } = useTheme();
  const tint = color ?? colors.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className="flex-row items-center gap-1.5 rounded-full border px-3 py-2 active:opacity-65"
      style={{
        borderColor: selected ? tint : colors.line,
        backgroundColor: selected ? `${tint}1f` : 'transparent',
      }}
    >
      {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : null}
      {icon && <Feather name={icon} size={12} color={selected ? tint : colors.inkMuted} />}
      <Text
        style={{
          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
          fontSize: 13,
          letterSpacing: -0.1,
          color: selected ? tint : colors.inkSoft,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
};

type FieldLabelProps = {
  children: string;
  /** Right-hand affordance, e.g. a "Clear" or "Manage" link. */
  action?: { label: string; onPress: () => void };
};

export const FieldLabel: React.FC<FieldLabelProps> = ({ children, action }) => {
  const { colors } = useTheme();

  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text
        className="uppercase text-ink-muted"
        style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}
      >
        {children}
      </Text>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8} className="active:opacity-60">
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11.5, color: colors.accent }}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
};
