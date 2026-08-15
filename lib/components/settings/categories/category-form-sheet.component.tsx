import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { EmojiPicker } from './emoji-picker.component';

export const COLOR_SWATCHES = [
  '#e8734a', '#4a90c0', '#8a6bc0', '#c0a34a',
  '#c04a8a', '#4ac07a', '#c05a4a', '#8a8a8a',
  '#4a7fc0', '#c0704a', '#5ac0a3', '#a34ac0',
];

type CategoryFormSheetContentProps = {
  isEdit: boolean;
  name: string;
  setName: (v: string) => void;
  icon: string;
  setIcon: (v: string) => void;
  color: string;
  setColor: (v: string) => void;
  pickerOpen: boolean;
  setPickerOpen: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

export const CategoryFormSheetContent: React.FC<CategoryFormSheetContentProps> = ({
  isEdit,
  name,
  setName,
  icon,
  setIcon,
  color,
  setColor,
  pickerOpen,
  setPickerOpen,
  onSave,
  onCancel,
}) => {
  const { colors } = useTheme();

  return (
    <View className="p-6">
      <Text className="mb-5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
        {isEdit ? 'Edit Category' : 'New Category'}
      </Text>

      <View className="mb-4 flex-row gap-2.5">
        <Pressable
          onPress={() => setPickerOpen(!pickerOpen)}
          className={clsx(
            'h-[50px] w-16 items-center justify-center rounded-[10px] border',
            pickerOpen ? 'border-accent bg-accent-soft' : 'border-line bg-bg',
          )}
          accessibilityLabel="Choose emoji"
        >
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </Pressable>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor={colors.inkMuted}
          autoFocus
          className="flex-1 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
        />
      </View>

      {pickerOpen && (
        <View className="mb-4">
          <EmojiPicker
            value={icon}
            onChange={emoji => {
              setIcon(emoji);
              setPickerOpen(false);
            }}
          />
        </View>
      )}

      <Text
        className="mb-2 uppercase text-ink-muted"
        style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}
      >
        Color
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2.5">
        {COLOR_SWATCHES.map(swatch => (
          <Pressable
            key={swatch}
            onPress={() => setColor(swatch)}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: swatch, borderWidth: color === swatch ? 2 : 0, borderColor: colors.ink }}
          >
            {color === swatch && <Feather name="check" size={14} color="#ffffff" />}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={onSave}
        disabled={!name.trim()}
        className={clsx('mb-2.5 items-center rounded-[10px] py-3.5', name.trim() ? 'bg-accent' : 'bg-surface-alt')}
      >
        <Text
          className={name.trim() ? 'text-white' : 'text-ink-muted'}
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
        >
          Save
        </Text>
      </Pressable>
      <Pressable onPress={onCancel} className="items-center py-3">
        <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>Cancel</Text>
      </Pressable>
    </View>
  );
};
