import type React from 'react';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCsvExport } from '@/lib/hooks/use-csv-export.hook';
import { useCsvImport } from '@/lib/hooks/use-csv-import.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { CsvFormatSheetContent } from './csv-format-sheet.component';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsNavRow } from '../shared/settings-nav-row.component';

export const Data: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { entries, importEntries } = useEntries();
  const { exporting, handleExport } = useCsvExport(entries);
  const { importing, handleImport } = useCsvImport();

  const [formatSheetOpen, setFormatSheetOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const busy = exporting || importing;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Import & Export" subtitle="CSV is Poisha's backup format. There's no cloud sync — a file is the only way to move data between devices." />

      <SettingsNavRow icon="upload" label="Export CSV" onPress={handleExport} />
      <View className="h-px bg-line" />
      <SettingsNavRow icon="download" label="Import CSV" onPress={handleImport} />
      <View className="h-px bg-line" />
      <SettingsNavRow icon="info" label="CSV format" onPress={() => setFormatSheetOpen(true)} />

      {busy && (
        <View className="flex-row items-center gap-2.5 pt-5">
          <ActivityIndicator size="small" color={colors.inkMuted} />
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
            {exporting ? 'Preparing export…' : 'Reading file…'}
          </Text>
        </View>
      )}

      <Text
        className="pb-1 pt-9 text-ink"
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}
      >
        Danger zone
      </Text>
      <Text className="pb-1 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        Every entry will be permanently removed from this device. Export first if you might want them back — this cannot be undone.
      </Text>
      <SettingsNavRow icon="trash-2" label="Reset all data" destructive onPress={() => setResetModalOpen(true)} />

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
    </ScrollView>
  );
};
