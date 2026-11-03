import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { useRef, useState } from 'react';
import { Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { CategoryPicker } from '@/lib/components/entries/category-picker.component';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TDraft, TSmsItem } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { DatePicker } from '@/lib/ui/date-picker.ui';
import { formatDateLong } from '@/lib/utils/date.util';
import { defaultNoteFor, ruleLabelFor } from '@/lib/utils/sms-item.util';

type SmsEditSheetProps = {
  item: TSmsItem | null;
  onClose: () => void;
  onConfirm: (draft: TDraft) => void;
};

/**
 * Correct a parse before accepting it.
 *
 * Deliberately NOT the global `AddEntrySheet`: that one is driven by
 * `EntriesSheetProvider` and keyed on an existing entry, whereas this edits a
 * draft that does not exist yet and has to carry provenance back out. Single
 * amount only — a bank message describes one transaction, and the multi-line
 * amount list would imply we had parsed line items we hadn't.
 */
const SheetContent: React.FC<{ item: TSmsItem; onClose: () => void; onConfirm: (d: TDraft) => void }> = ({
  item,
  onClose,
  onConfirm,
}) => {
  const { colors } = useTheme();
  const { locale, fmtFull } = useLocale();
  const { enabled: categoriesEnabled, categories } = useCategories();
  const { enabled: planModeEnabled } = usePlanMode();

  const [amount, setAmount] = useState(item.amount === null ? '' : String(item.amount));
  const [dateISO, setDateISO] = useState(item.date);
  const [note, setNote] = useState(defaultNoteFor(item));
  const [categoryId, setCategoryId] = useState<string | null>(item.categoryId);

  const [pickerVisible, setPickerVisible] = useState(false);
  const pickerJustClosed = useRef(false);

  const parsed = parseFloat(amount);
  const valid = !isNaN(parsed) && parsed > 0;

  const confirm = () => {
    if (!valid) return;
    onConfirm({
      date: dateISO,
      amounts: [parsed],
      note: note.trim(),
      categoryId,
      source: 'sms',
      sourceRef: item.id,
    });
  };

  return (
    <KeyboardGestureArea interpolator={Platform.OS === 'ios' ? 'ios' : 'linear'} className="flex-1">
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bottomOffset={24} bounces={false}>
        <View className="flex-row items-center justify-between px-6 pb-4 pt-3">
          <View className="min-w-0 flex-1">
            <Text className="uppercase tracking-widest text-ink-muted" style={{ fontSize: 10, letterSpacing: 2 }}>
              From {ruleLabelFor(item)}
            </Text>
            <Text className="mt-0.5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24, letterSpacing: -0.4 }}>
              Check and add
            </Text>
          </View>
          <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
            <Feather name="x" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>

        {item.body && (
          <View className="px-5 pb-1">
            <Text
              className="rounded-xl bg-surface-alt p-3 text-ink-muted"
              style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 17 }}
            >
              {item.body}
            </Text>
          </View>
        )}

        <View className="px-5 pt-5">
          <View className="mb-2 flex-row items-baseline justify-between px-1">
            <Text className="uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
              Amount
            </Text>
            {valid && (
              <Text className="text-accent" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15 }}>
                {fmtFull(parsed)}
              </Text>
            )}
          </View>
          <View className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4">
            <Text className="mr-2.5 text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 }}>
              {locale.symbol}
            </Text>
            <TextInput
              value={amount}
              // Same masking as the entry form — the keyboard type is a hint,
              // not a guarantee, on every Android keyboard.
              onChangeText={raw => setAmount(raw.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.inkMuted}
              className="flex-1 py-4 text-ink"
              style={{ fontSize: 18, fontFamily: 'Inter_500Medium', letterSpacing: -0.2 }}
            />
          </View>
        </View>

        <View className="px-5 pt-[22px]">
          <Text className="mb-2 px-1 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
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

        {categoriesEnabled && <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />}

        <View className="px-5 pt-[22px]">
          <Text className="mb-2 px-1 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
            Note
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

        <View className="px-5 pt-[26px]">
          <Pressable
            onPress={confirm}
            disabled={!valid}
            className={clsx('items-center rounded-2xl py-[17px]', valid ? 'bg-accent' : 'bg-surface-alt')}
          >
            <Text
              className={clsx('uppercase', valid ? 'text-bg' : 'text-ink-muted')}
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.6 }}
            >
              Add entry
            </Text>
          </Pressable>
        </View>

        <View className="h-2" />
      </KeyboardAwareScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => {
            pickerJustClosed.current = true;
            setPickerVisible(false);
          }}
        >
          <Pressable className="rounded-t-3xl bg-surface pb-6 pt-5">
            {/* Capped at today unless Plan Mode is on, matching the entry form.
                An SMS is always about something that already happened anyway. */}
            <DatePicker value={dateISO} onChange={setDateISO} maximumDate={planModeEnabled ? undefined : new Date()} />
            <Pressable
              onPress={() => {
                pickerJustClosed.current = true;
                setPickerVisible(false);
              }}
              className="mr-5 mt-2 self-end rounded-full bg-accent px-5 py-2.5"
            >
              <Text className="text-bg" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                Done
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardGestureArea>
  );
};

export const SmsEditSheet: React.FC<SmsEditSheetProps> = ({ item, onClose, onConfirm }) => (
  <BottomSheet
    visible={item !== null}
    onClose={onClose}
    sheetStyle={{ minHeight: '80%' as unknown as number, maxHeight: '96%' as unknown as number }}
  >
    {close => (item ? <SheetContent item={item} onClose={close} onConfirm={onConfirm} /> : null)}
  </BottomSheet>
);
