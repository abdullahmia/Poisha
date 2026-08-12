import { Pressable, Text, View } from 'react-native';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { DatePicker } from '@/lib/ui/date-picker.ui';
import { todayISO } from '@/lib/utils/date.util';

type DateFilterSheetProps = {
  visible: boolean;
  value: string | null;
  onSelect: (iso: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function DateFilterSheet({ visible, value, onSelect, onClear, onClose }: DateFilterSheetProps) {
  const { enabled } = usePlanMode();

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {(close) => (
        <View className="pt-2">
          {/* Uncapped while Plan Mode is on: picking a future day is the natural
              "what's planned on the 20th" gesture, and it's unambiguous because
              the chosen day is shown in the header. Capped at today otherwise. */}
          <DatePicker
            value={value ?? todayISO()}
            onChange={(iso) => { onSelect(iso); close(); }}
            maximumDate={enabled ? undefined : new Date()}
          />
          {value && (
            <Pressable
              onPress={() => { onClear(); close(); }}
              className="mx-5 mt-2 items-center rounded-2xl border border-line py-3"
            >
              <Text className="text-ink-soft" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                Clear filter
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </BottomSheet>
  );
}
