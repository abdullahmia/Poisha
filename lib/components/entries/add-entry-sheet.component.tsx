import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { useRef, useState } from 'react';
import { KeyboardAwareScrollView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useEntryForm } from '@/lib/hooks/use-entry-form.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { DatePicker } from '@/lib/ui/date-picker.ui';
import { formatDateLong } from '@/lib/utils/date.util';

type SheetContentProps = { onClose: () => void };

const SheetContent: React.FC<SheetContentProps> = ({ onClose }) => {
  const { sheetEntry: entry } = useEntries();
  const { colors } = useTheme();
  const { locale, fmtFull } = useLocale();
  const {
    dateISO,
    setDateISO,
    note,
    setNote,
    amountFields,
    amounts,
    updateAmount,
    addLine,
    removeLine,
    total,
    canSave,
    handleSave,
    handleDelete,
  } = useEntryForm(entry);

  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerJustClosed = useRef(false);

  return (
    <KeyboardGestureArea interpolator={Platform.OS === 'ios' ? 'ios' : 'linear'} className="flex-1">
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        bounces={false}
      >
        <View className="flex-row items-center justify-between px-6 pb-4 pt-3">
          <View>
            <Text className="uppercase tracking-widest text-ink-muted" style={{ fontSize: 10, letterSpacing: 2 }}>
              {entry ? 'Edit' : 'New'}
            </Text>
            <Text className="mt-0.5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24, letterSpacing: -0.4 }}>
              {entry ? 'Adjust entry' : 'Add entry'}
            </Text>
          </View>
          <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
            <Feather name="x" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>

        <View className="px-5">
          <Text
            className="mb-2 px-1 uppercase text-ink-muted"
            style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
          >
            Date
          </Text>
          <Pressable
            onPress={() => {
              if (pickerJustClosed.current) {
                pickerJustClosed.current = false;
                return;
              }
              setPickerVisible(true);
            }}
            className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4 py-[15px]"
          >
            <Text className="flex-1 text-ink" style={{ fontSize: 15, fontFamily: 'Inter_400Regular' }}>
              {formatDateLong(dateISO)}
            </Text>
            <Feather name="calendar" size={15} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View className="px-5 pt-5">
          <View className="mb-2 flex-row items-baseline justify-between px-1">
            <Text
              className="uppercase text-ink-muted"
              style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
            >
              Amounts
            </Text>
            <Text className="text-ink-soft" style={{ fontSize: 11 }}>
              total{' '}
              <Text className="text-accent" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 }}>
                {fmtFull(total)}
              </Text>
            </Text>
          </View>

          {amountFields.map((field, i) => (
            <View key={field.id} className="mb-2 flex-row gap-2">
              <View className="flex-1 flex-row items-center rounded-2xl border border-line bg-surface-alt px-4">
                <Text
                  className="mr-2.5 text-ink-muted"
                  style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 }}
                >
                  {locale.symbol}
                </Text>
                <TextInput
                  value={amounts[i]?.value ?? ''}
                  onChangeText={v => updateAmount(i, v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.inkMuted}
                  autoFocus={i === amountFields.length - 1 && !entry}
                  className="flex-1 py-4 text-ink"
                  style={{ fontSize: 18, fontFamily: 'Inter_500Medium', letterSpacing: -0.2 }}
                />
              </View>
              {amountFields.length > 1 && (
                <Pressable
                  onPress={() => removeLine(i)}
                  className="w-[52px] items-center justify-center rounded-2xl border border-line bg-surface-alt"
                >
                  <Feather name="minus" size={14} color={colors.inkSoft} />
                </Pressable>
              )}
            </View>
          ))}

          <Pressable
            onPress={addLine}
            className="mt-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-line py-3"
          >
            <Feather name="plus" size={13} color={colors.inkSoft} />
            <Text className="text-ink-soft" style={{ fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              Add another amount
            </Text>
          </Pressable>
        </View>

        <View className="px-5 pt-[22px]">
          <Text
            className="mb-2 px-1 uppercase text-ink-muted"
            style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}
          >
            Note <Text className="normal-case text-ink-muted" style={{ fontWeight: '400' }}>(optional)</Text>
          </Text>
          <View className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4 py-[15px]">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="groceries, rent, etc."
              placeholderTextColor={colors.inkMuted}
              className="flex-1 text-ink"
              style={{ fontSize: 14, fontFamily: 'Inter_400Regular' }}
            />
          </View>
        </View>

        <View className="flex-row gap-2.5 px-5 pt-[26px]">
          {entry && (
            <Pressable onPress={handleDelete} className="w-14 items-center justify-center rounded-2xl border border-line bg-surface-alt py-4">
              <Feather name="trash-2" size={14} color={colors.accent} />
            </Pressable>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            className={clsx(
              'flex-1 items-center rounded-2xl py-[17px]',
              canSave ? 'bg-accent' : 'bg-surface-alt',
            )}
          >
            <Text
              className={clsx('uppercase', canSave ? 'text-bg' : 'text-ink-muted')}
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.6 }}
            >
              {entry ? 'Save changes' : 'Log entry'}
            </Text>
          </Pressable>
        </View>

        <View className="h-2" />
      </KeyboardAwareScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => { pickerJustClosed.current = true; setPickerVisible(false); }}
        >
          <Pressable className="rounded-t-3xl bg-surface pt-5 pb-6">
            <DatePicker value={dateISO} onChange={setDateISO} maximumDate={new Date()} />
            <Pressable
              onPress={() => { pickerJustClosed.current = true; setPickerVisible(false); }}
              className="mr-5 mt-2 self-end rounded-full bg-accent px-5 py-2.5"
            >
              <Text className="text-bg" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardGestureArea>
  );
};

export const AddEntrySheet: React.FC = () => {
  const { sheetOpen, closeSheet } = useEntries();
  return (
    <BottomSheet
      visible={sheetOpen}
      onClose={closeSheet}
      sheetStyle={{ minHeight: '88%' as unknown as number, maxHeight: '96%' as unknown as number }}
    >
      {(close) => <SheetContent onClose={close} />}
    </BottomSheet>
  );
};
