import { type Palette } from '@/lib/constants/theme';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAwareScrollView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      backgroundColor: '#000000',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderTopWidth: 1,
      borderTopColor: c.line,
      minHeight: '78%' as unknown as number,
      maxHeight: '92%' as unknown as number,
      paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    },
    sheetInner: {
      flex: 1,
    },
    handle: {
      width: 42,
      height: 4,
      backgroundColor: c.line,
      borderRadius: 999,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 6,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 16,
    },
    sheetHeaderSub: {
      fontSize: 10,
      color: c.inkMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    sheetTitle: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 24,
      color: c.ink,
      letterSpacing: -0.4,
      marginTop: 2,
    },
    circleBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    field: {
      paddingHorizontal: 20,
    },
    label: {
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: c.inkMuted,
      fontWeight: '600',
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    labelOptional: {
      color: c.inkMuted,
      fontWeight: '400',
    },
    inputBox: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputText: {
      flex: 1,
      fontSize: 15,
      color: c.ink,
      fontFamily: 'Inter_400Regular',
    },
    amountsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 4,
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: 11,
      color: c.inkSoft,
    },
    totalValue: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 15,
      color: c.accent,
    },
    amountRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    amountInputBox: {
      flex: 1,
      paddingVertical: 0,
    },
    currencySymbol: {
      fontFamily: 'SpaceGrotesk_500Medium',
      fontSize: 17,
      color: c.inkMuted,
      marginRight: 10,
    },
    amountInput: {
      flex: 1,
      fontSize: 18,
      color: c.ink,
      paddingVertical: 16,
      fontFamily: 'Inter_500Medium',
      letterSpacing: -0.2,
    },
    removeBtn: {
      width: 52,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addLineBtn: {
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4,
    },
    addLineBtnText: {
      fontSize: 13,
      color: c.inkSoft,
      fontFamily: 'Inter_500Medium',
    },
    noteInput: {
      flex: 1,
      fontSize: 14,
      color: c.ink,
      fontFamily: 'Inter_400Regular',
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 26,
    },
    deleteBtn: {
      width: 56,
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
    },
    saveBtn: {
      flex: 1,
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 17,
      alignItems: 'center',
    },
    saveBtnDisabled: {
      backgroundColor: c.surfaceAlt,
    },
    saveBtnText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      color: c.bg,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    saveBtnTextDisabled: {
      color: c.inkMuted,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    pickerBox: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 24,
    },
    pickerDone: {
      alignSelf: 'flex-end',
      marginRight: 20,
      marginTop: 8,
      backgroundColor: c.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
    },
    pickerDoneText: {
      color: c.bg,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
  });
}

function SheetContent({ onClose }: { onClose: () => void }) {
  const { sheetEntry, saveEntry, deleteEntry, closeSheet } = useEntries();
  const { colors } = useTheme();
  const { locale, fmtFull } = useLocale();
  const { notification } = useHaptics();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const entry = sheetEntry;

  const [dateISO, setDateISO] = useState(entry?.date ?? todayISO());
  const [amounts, setAmounts] = useState<string[]>(entry?.amounts.map(String) ?? ['']);
  const [note, setNote] = useState(entry?.note ?? '');
  const [pickerVisible, setPickerVisible] = useState(false);

  const total = amounts.reduce((s, a) => s + (parseFloat(a) || 0), 0);
  const canSave = amounts.some(a => parseFloat(a) > 0);

  const updateAmount = (i: number, v: string) => {
    const next = [...amounts];
    next[i] = v.replace(/[^0-9.]/g, '');
    setAmounts(next);
  };

  const addLine = () => setAmounts([...amounts, '']);

  const removeLine = (i: number) => {
    if (amounts.length === 1) setAmounts(['']);
    else setAmounts(amounts.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    const cleaned = amounts.map(a => parseFloat(a)).filter(n => !isNaN(n) && n > 0);
    if (cleaned.length === 0) return;
    saveEntry({ id: entry?.id, date: dateISO, amounts: cleaned, note: note.trim() });
    notification(Haptics.NotificationFeedbackType.Success);
    closeSheet();
  };

  const handleDelete = () => {
    if (entry) deleteEntry(entry.id);
    notification(Haptics.NotificationFeedbackType.Warning);
    closeSheet();
  };

  return (
    <KeyboardGestureArea interpolator={Platform.OS === 'ios' ? 'ios' : 'linear'} style={styles.sheetInner}>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
        bounces={false}
      >
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetHeaderSub}>{entry ? 'Edit' : 'New'}</Text>
            <Text style={styles.sheetTitle}>{entry ? 'Adjust entry' : 'Add entry'}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.circleBtn}>
            <Feather name="x" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <Pressable onPress={() => setPickerVisible(true)} style={styles.inputBox}>
            <Text style={styles.inputText}>{formatDateLong(dateISO)}</Text>
            <Feather name="calendar" size={15} color={colors.inkMuted} />
          </Pressable>
        </View>

        <View style={[styles.field, { paddingTop: 20 }]}>
          <View style={styles.amountsHeader}>
            <Text style={styles.label}>Amounts</Text>
            <Text style={styles.totalLabel}>
              total{' '}
              <Text style={styles.totalValue}>{fmtFull(total)}</Text>
            </Text>
          </View>

          {amounts.map((amt, i) => (
            <View key={i} style={styles.amountRow}>
              <View style={[styles.inputBox, styles.amountInputBox]}>
                <Text style={styles.currencySymbol}>{locale.symbol}</Text>
                <TextInput
                  value={amt}
                  onChangeText={v => updateAmount(i, v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.inkMuted}
                  autoFocus={i === amounts.length - 1 && !entry}
                  style={styles.amountInput}
                />
              </View>
              {amounts.length > 1 && (
                <Pressable onPress={() => removeLine(i)} style={styles.removeBtn}>
                  <Feather name="minus" size={14} color={colors.inkSoft} />
                </Pressable>
              )}
            </View>
          ))}

          <Pressable onPress={addLine} style={styles.addLineBtn}>
            <Feather name="plus" size={13} color={colors.inkSoft} />
            <Text style={styles.addLineBtnText}>Add another amount</Text>
          </Pressable>
        </View>

        <View style={[styles.field, { paddingTop: 22 }]}>
          <Text style={styles.label}>
            Note <Text style={styles.labelOptional}>(optional)</Text>
          </Text>
          <View style={styles.inputBox}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="groceries, rent, etc."
              placeholderTextColor={colors.inkMuted}
              style={styles.noteInput}
            />
          </View>
        </View>

        <View style={styles.actions}>
          {entry && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={14} color={colors.accent} />
            </Pressable>
          )}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          >
            <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
              {entry ? 'Save changes' : 'Log entry'}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 8 }} />
      </KeyboardAwareScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <Pressable style={styles.pickerOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.pickerBox}>
            <DateTimePicker
              value={isoToDate(dateISO)}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, d) => { if (d) setDateISO(dateToISO(d)); }}
              style={{ width: '100%' }}
              textColor={colors.ink}
            />
            <Pressable onPress={() => setPickerVisible(false)} style={styles.pickerDone}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardGestureArea>
  );
}

export function AddEntrySheet() {
  const { sheetOpen, closeSheet } = useEntries();
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    if (sheetOpen) {
      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 28,
        stiffness: 200,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [sheetOpen]);

  const handleClose = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => closeSheet());
  };

  if (!sheetOpen) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const backdropOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.7, 0.7] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalRoot}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <SheetContent onClose={handleClose} />
        </Animated.View>
      </View>
    </Modal>
  );
}
