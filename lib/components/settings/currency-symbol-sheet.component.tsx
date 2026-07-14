import type React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type CurrencySymbolSheetProps = {
  symbolInput: string;
  setSymbolInput: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const CurrencySymbolSheetContent: React.FC<CurrencySymbolSheetProps> = ({
  symbolInput,
  setSymbolInput,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <View className="p-6">
      <Text className="mb-5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
        Currency Symbol
      </Text>
      <TextInput
        className="mb-4 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 16 }}
        value={symbolInput}
        onChangeText={setSymbolInput}
        placeholder={DEFAULT_LOCALE.symbol}
        placeholderTextColor={colors.inkMuted}
        maxLength={3}
        autoFocus
      />
      <Pressable onPress={onSave} className="mb-2.5 items-center rounded-[10px] bg-accent py-3.5">
        <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Save</Text>
      </Pressable>
      <Pressable onPress={onCancel} className="items-center py-3">
        <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>Cancel</Text>
      </Pressable>
    </View>
  );
};
