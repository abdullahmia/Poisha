import { Alert, ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PinSetupSheet } from '@/lib/components/pin-setup-sheet.component';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { biometricService } from '@/lib/services/biometric.service';
import { biometricLabel, biometricIcon } from '@/lib/utils/biometric.utils';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { entriesToCsv, csvToEntries } from '@/lib/utils/csv.util';
import { useState } from 'react';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors, toggleScheme } = useTheme();
  const { entries, importEntries } = useEntries();
  const { lockEnabled, biometricType, biometricEnabled, enableBiometric, disableBiometric } = useLock();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [setupSheet, setSetupSheet] = useState<{ visible: boolean; mode: 'enable' | 'change' | 'disable' }>({ visible: false, mode: 'enable' });

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

          <View style={divider} />

          <View style={rowStyle}>
            <View>
              <Text style={rowLabel}>Haptic Feedback</Text>
              <Text style={rowSub}>{hapticsEnabled ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
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

          <View style={divider} />

          {/* Reset Data */}
          <Pressable
            onPress={() => {
              Alert.alert(
                'Reset All Data',
                'This will permanently delete all your entries. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => importEntries([], true),
                  },
                ]
              );
            }}
            style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Reset all data"
          >
            <View>
              <Text style={[rowLabel, { color: colors.accent }]}>Reset All Data</Text>
              <Text style={rowSub}>Permanently delete all entries</Text>
            </View>
            <Text style={[chevron, { color: colors.accent }]}>›</Text>
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
                  setSetupSheet({ visible: true, mode: 'disable' });
                }
              }}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>


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

          {/* Biometric toggle — only when lock is enabled and device supports biometrics */}
          {lockEnabled && biometricType !== 'none' && (
            <>
              <View style={divider} />
              <View style={rowStyle}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {biometricIcon(biometricType) && (
                    <HugeiconsIcon icon={biometricIcon(biometricType)!} size={18} color={colors.inkSoft} />
                  )}
                  <View>
                    <Text style={rowLabel}>{biometricLabel(biometricType)}</Text>
                    <Text style={rowSub}>{biometricEnabled ? 'On' : 'Off'}</Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={async val => {
                    if (val) {
                      const result = await biometricService.authenticate(`Verify ${biometricLabel(biometricType)}`);
                      if (result.success) {
                        await enableBiometric();
                      } else {
                        Alert.alert('Verification failed', 'Biometric verification failed. Please try again.');
                      }
                    } else {
                      await disableBiometric();
                    }
                  }}
                  trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
            </>
          )}

          {/* Re-enroll row — only when biometric is enabled */}
          {lockEnabled && biometricEnabled && (
            <>
              <View style={divider} />
              <Pressable
                onPress={async () => {
                  const result = await biometricService.authenticate(`Re-enroll ${biometricLabel(biometricType)}`);
                  if (!result.success) {
                    Alert.alert('Verification failed', 'Could not verify biometric credential.');
                  }
                }}
                style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
                accessibilityLabel={`Re-enroll ${biometricLabel(biometricType)}`}
              >
                <View>
                  <Text style={rowLabel}>Re-enroll {biometricLabel(biometricType)}</Text>
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
