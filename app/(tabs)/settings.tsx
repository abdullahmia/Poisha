import { Alert, ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PinSetupSheet } from '@/lib/components/pin-setup-sheet.component';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { entriesToCsv, csvToEntries } from '@/lib/utils/csv.util';
import { useState } from 'react';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors, toggleScheme } = useTheme();
  const { entries, importEntries } = useEntries();
  const { lockEnabled, disableLock, unlock } = useLock();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [setupSheet, setSetupSheet] = useState<{ visible: boolean; mode: 'enable' | 'change' }>({ visible: false, mode: 'enable' });
  const [disablePin, setDisablePin] = useState('');
  const [disableShake, setDisableShake] = useState(false);
  const [showDisableInput, setShowDisableInput] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = entriesToCsv(entries);
      const file = new File(Paths.cache, 'poisha-export.csv');
      file.write(csv);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Not available', 'Sharing is not supported on this device.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Poisha' });
    } catch (e: unknown) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
      if (result.canceled) return;
      const csv = await new File(result.assets[0].uri).text();
      const imported = csvToEntries(csv);
      if (imported.length === 0) {
        Alert.alert('Import failed', 'The file could not be parsed.');
        return;
      }
      Alert.alert(
        'Import CSV',
        `Found ${imported.length} entries. How would you like to import?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Merge',
            onPress: () => {
              importEntries(imported, false);
              Alert.alert('Done', `Imported ${imported.length} entries.`);
            },
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              importEntries(imported, true);
              Alert.alert('Done', `Imported ${imported.length} entries.`);
            },
          },
        ]
      );
    } catch (e: unknown) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'The file could not be parsed.');
    } finally {
      setImporting(false);
    }
  }

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
  };

  const divider = {
    height: 1,
    backgroundColor: colors.line,
    marginHorizontal: 16,
  };

  const sectionLabel = {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.inkMuted,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  };

  const sectionCard = {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden' as const,
  };

  const rowLabel = { fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.ink };
  const rowSub   = { fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.inkSoft, marginTop: 2 };
  const chevron  = { fontFamily: 'Inter_400Regular', fontSize: 18, color: colors.inkMuted };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 110 + insets.bottom,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: 28, paddingBottom: 8 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, color: colors.ink, letterSpacing: -0.5 }}>
          Settings
        </Text>
      </View>

      {/* Appearance section */}
      <View style={{ marginTop: 24 }}>
        <Text style={sectionLabel}>Appearance</Text>
        <View style={sectionCard}>
          <View style={rowStyle}>
            <View>
              <Text style={rowLabel}>Theme</Text>
              <Text style={rowSub}>{scheme === 'dark' ? 'Dark' : 'Light'}</Text>
            </View>
            <Switch
              value={scheme === 'dark'}
              onValueChange={toggleScheme}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>
        </View>
      </View>

      {/* Data section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Data</Text>
        <View style={sectionCard}>
          {/* Export CSV */}
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Export CSV"
          >
            <View>
              <Text style={rowLabel}>Export CSV</Text>
              <Text style={rowSub}>Share all entries as a file</Text>
            </View>
            {exporting
              ? <ActivityIndicator size="small" color={colors.inkMuted} />
              : <Text style={chevron}>↑</Text>
            }
          </Pressable>

          <View style={divider} />

          {/* Import CSV */}
          <Pressable
            onPress={handleImport}
            disabled={importing}
            style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Import CSV"
          >
            <View>
              <Text style={rowLabel}>Import CSV</Text>
              <Text style={rowSub}>Restore entries from a file</Text>
            </View>
            {importing
              ? <ActivityIndicator size="small" color={colors.inkMuted} />
              : <Text style={chevron}>↓</Text>
            }
          </Pressable>
        </View>
      </View>

      {/* Security section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Security</Text>
        <View style={sectionCard}>
          {/* App Lock toggle */}
          <View style={rowStyle}>
            <View>
              <Text style={rowLabel}>App Lock</Text>
              <Text style={rowSub}>{lockEnabled ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={val => {
                if (val) {
                  setSetupSheet({ visible: true, mode: 'enable' });
                } else {
                  Alert.alert(
                    'Disable lock?',
                    "You'll need your PIN.",
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Disable', style: 'destructive', onPress: () => setShowDisableInput(true) },
                    ]
                  );
                }
              }}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Inline PIN verify for disabling */}
          {showDisableInput && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.inkSoft }}>Enter PIN to confirm</Text>
              {disableShake && (
                <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.accent }}>Wrong PIN</Text>
              )}
              {/* Reuse PinSetupSheet in verify-only mode by opening the sheet */}
              <Pressable
                onPress={async () => {
                  const ok = await unlock(disablePin);
                  if (ok) {
                    await disableLock();
                    setShowDisableInput(false);
                    setDisablePin('');
                  } else {
                    setDisableShake(true);
                    setTimeout(() => setDisableShake(false), 500);
                  }
                }}
                style={({ pressed }) => ({ marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: pressed ? colors.surfaceAlt : colors.surface, borderWidth: 1, borderColor: colors.line })}
              >
                <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 14, color: colors.accent }}>Verify & Disable</Text>
              </Pressable>
            </View>
          )}

          {/* Change PIN row — only when lock is enabled */}
          {lockEnabled && (
            <>
              <View style={divider} />
              <Pressable
                onPress={() => setSetupSheet({ visible: true, mode: 'change' })}
                style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
                accessibilityLabel="Change PIN"
              >
                <View>
                  <Text style={rowLabel}>Change PIN</Text>
                </View>
                <Text style={chevron}>›</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <PinSetupSheet
        visible={setupSheet.visible}
        mode={setupSheet.mode}
        onClose={() => setSetupSheet(s => ({ ...s, visible: false }))}
        onSuccess={() => setSetupSheet(s => ({ ...s, visible: false }))}
      />
    </ScrollView>
  );
}
