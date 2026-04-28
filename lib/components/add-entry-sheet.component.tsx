import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { useRef, useEffect, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ledger } from '@/lib/constants/theme';
import { useEntries } from '@/lib/hooks/use-entries.hook';

const fmtFull = (n: number) => `৳${n.toLocaleString('en-IN')}`;

const todayISO = () => new Date().toISOString().split('T')[0];

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

function SheetContent({ onClose }: { onClose: () => void }) {
  const { sheetEntry, saveEntry, deleteEntry, closeSheet } = useEntries();
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
    closeSheet();
  };

  const handleDelete = () => {
    if (entry) deleteEntry(entry.id);
    closeSheet();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetInner}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetHeaderSub}>{entry ? 'Edit' : 'New'}</Text>
            <Text style={styles.sheetTitle}>{entry ? 'adjust entry' : 'an entry'}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.circleBtn}>
            <Feather name="x" size={16} color={ledger.inkSoft} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date</Text>
          <Pressable onPress={() => setPickerVisible(true)} style={styles.inputBox}>
            <Text style={styles.inputText}>{formatDateLong(dateISO)}</Text>
            <Feather name="calendar" size={15} color={ledger.inkMuted} />
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
                <Text style={styles.currencySymbol}>৳</Text>
                <TextInput
                  value={amt}
                  onChangeText={v => updateAmount(i, v)}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  placeholderTextColor={ledger.inkMuted}
                  autoFocus={i === amounts.length - 1 && !entry}
                  style={styles.amountInput}
                />
              </View>
              {amounts.length > 1 && (
                <Pressable onPress={() => removeLine(i)} style={styles.removeBtn}>
                  <Feather name="minus" size={14} color={ledger.inkSoft} />
                </Pressable>
              )}
            </View>
          ))}

          <Pressable onPress={addLine} style={styles.addLineBtn}>
            <Feather name="plus" size={13} color={ledger.inkSoft} />
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
              placeholderTextColor={ledger.inkMuted}
              style={styles.noteInput}
            />
          </View>
        </View>

        <View style={styles.actions}>
          {entry && (
            <Pressable onPress={handleDelete} style={styles.deleteBtn}>
              <Feather name="trash-2" size={14} color={ledger.accent} />
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
      </ScrollView>

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
              textColor={ledger.ink}
            />
            <Pressable onPress={() => setPickerVisible(false)} style={styles.pickerDone}>
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

export function AddEntrySheet() {
  const { sheetOpen, closeSheet } = useEntries();
  const anim = useRef(new Animated.Value(0)).current;

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

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: ledger.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: ledger.line,
    minHeight: '78%',
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  sheetInner: {
    flex: 1,
  },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    color: ledger.inkMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sheetTitle: {
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 26,
    color: ledger.ink,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ledger.surfaceAlt,
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
    color: ledger.inkMuted,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  labelOptional: {
    color: ledger.inkMuted,
    fontWeight: '400',
  },
  inputBox: {
    backgroundColor: ledger.surfaceAlt,
    borderWidth: 1,
    borderColor: ledger.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: ledger.ink,
    fontFamily: 'DMSans_400Regular',
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
    color: ledger.inkSoft,
  },
  totalValue: {
    fontFamily: 'Fraunces_600SemiBold_Italic',
    fontSize: 15,
    color: ledger.accent,
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
    fontFamily: 'Fraunces_400Regular_Italic',
    fontSize: 18,
    color: ledger.inkMuted,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: ledger.ink,
    paddingVertical: 16,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: -0.2,
  },
  removeBtn: {
    width: 52,
    backgroundColor: ledger.surfaceAlt,
    borderWidth: 1,
    borderColor: ledger.line,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLineBtn: {
    borderWidth: 1,
    borderColor: ledger.line,
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
    color: ledger.inkSoft,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '500',
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: ledger.ink,
    fontFamily: 'DMSans_400Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  deleteBtn: {
    width: 56,
    backgroundColor: ledger.surfaceAlt,
    borderWidth: 1,
    borderColor: ledger.line,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: ledger.accent,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: ledger.surfaceAlt,
  },
  saveBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: ledger.bg,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  saveBtnTextDisabled: {
    color: ledger.inkMuted,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: ledger.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  pickerDone: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 8,
    backgroundColor: ledger.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pickerDoneText: {
    color: ledger.bg,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
});
