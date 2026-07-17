import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCsvExport } from '@/lib/hooks/use-csv-export.hook';
import { useCsvImport } from '@/lib/hooks/use-csv-import.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { CsvFormatSheetContent } from './csv-format-sheet.component';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function DataSection() {
  const { colors } = useTheme();
  const { entries, importEntries } = useEntries();
  const { exporting, handleExport } = useCsvExport(entries);
  const { importing, handleImport } = useCsvImport();
  const style = useFadeIn(210);

  const [formatSheetOpen, setFormatSheetOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="database" label="Data" />
      <Card className="overflow-hidden rounded-2xl">
        <Pressable
          onPress={handleExport}
          disabled={exporting}
          className={clsx(rowClass, 'active:opacity-60')}
          accessibilityLabel="Export CSV"
        >
          <View className="flex-row items-center gap-3">
            <RowIcon name="upload" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Export CSV</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Share all entries as a file</Text>
            </View>
          </View>
          {exporting ? <ActivityIndicator size="small" color={colors.inkMuted} /> : <Feather name="chevron-right" size={16} color={colors.inkMuted} />}
        </Pressable>

        <View className="mx-4 h-px bg-line" />

        <View className={clsx(rowClass, 'pr-2')}>
          <Pressable onPress={handleImport} disabled={importing} className="flex-1 flex-row items-center gap-3" accessibilityLabel="Import CSV">
            <RowIcon name="download" />
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-ink" style={rowLabelStyle}>Import CSV</Text>
                <Pressable onPress={() => setFormatSheetOpen(true)} hitSlop={8} accessibilityLabel="Show CSV format">
                  <Feather name="info" size={13} color={colors.inkMuted} />
                </Pressable>
              </View>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Restore entries from a file</Text>
            </View>
          </Pressable>
          {importing ? <ActivityIndicator size="small" color={colors.inkMuted} /> : <Feather name="chevron-right" size={16} color={colors.inkMuted} />}
        </View>

        <View className="mx-4 h-px bg-line" />

        <Pressable
          onPress={() => setResetModalOpen(true)}
          className={clsx(rowClass, 'active:opacity-60')}
          accessibilityLabel="Reset all data"
        >
          <View className="flex-row items-center gap-3">
            <RowIcon name="trash-2" color={colors.accent} bg={colors.accentSoft} />
            <View>
              <Text className="text-accent" style={rowLabelStyle}>Reset All Data</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Permanently delete all entries</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={colors.accent} />
        </Pressable>
      </Card>

      <BottomSheet visible={formatSheetOpen} onClose={() => setFormatSheetOpen(false)}>
        {() => <CsvFormatSheetContent onClose={() => setFormatSheetOpen(false)} />}
      </BottomSheet>

      <ConfirmModal
        visible={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset All Data"
        message="This will permanently delete all your entries. This cannot be undone."
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Reset', variant: 'danger', onPress: () => importEntries([], true) },
        ]}
      />
    </Animated.View>
  );
}
