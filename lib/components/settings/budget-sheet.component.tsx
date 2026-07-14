import type React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type BudgetSheetProps = {
  budgetInput: string;
  setBudgetInput: (v: string) => void;
  hasBudget: boolean;
  onSave: () => void;
  onRemove: () => void;
  onCancel: () => void;
};

export const BudgetSheetContent: React.FC<BudgetSheetProps> = ({
  budgetInput,
  setBudgetInput,
  hasBudget,
  onSave,
  onRemove,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <View className="p-6">
      <Text className="mb-1.5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
        Monthly Budget
      </Text>
      <Text className="mb-5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
        Leave empty to disable the budget indicator.
      </Text>
      <TextInput
        className="mb-4 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 16 }}
        keyboardType="numeric"
        value={budgetInput}
        onChangeText={setBudgetInput}
        placeholder="e.g. 5000"
        placeholderTextColor={colors.inkMuted}
        autoFocus
      />
      <Pressable onPress={onSave} className="mb-2.5 items-center rounded-[10px] bg-accent py-3.5">
        <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Save</Text>
      </Pressable>
      {hasBudget && (
        <Pressable onPress={onRemove} className="mb-1 items-center py-3">
          <Text className="text-danger" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>Remove Budget</Text>
        </Pressable>
      )}
      <Pressable onPress={onCancel} className="items-center py-3">
        <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>Cancel</Text>
      </Pressable>
    </View>
  );
};
