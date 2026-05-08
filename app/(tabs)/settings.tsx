import { Alert, ActivityIndicator, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { PinSetupSheet } from '@/lib/components/pin-setup-sheet.component';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { DEFAULT_LOCALE } from '@/lib/utils/format.util';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { biometricService } from '@/lib/services/biometric.service';
import { biometricLabel, biometricIcon } from '@/lib/utils/biometric.utils';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Feather } from '@expo/vector-icons';
import { entriesToCsv, csvToEntries } from '@/lib/utils/csv.util';
import { useState } from 'react';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors, toggleScheme } = useTheme();
  const { entries, importEntries } = useEntries();
  const { locale, setLocale, fmtFull } = useLocale();
  const { lockEnabled, biometricType, biometricEnabled, enableBiometric, disableBiometric } = useLock();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();
  const { budget, setBudget } = useBudget();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [setupSheet, setSetupSheet] = useState<{ visible: boolean; mode: 'enable' | 'change' | 'disable' }>({ visible: false, mode: 'enable' });
  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [symbolSheetOpen, setSymbolSheetOpen] = useState(false);
  const [symbolInput, setSymbolInput] = useState('');
  const [formatSheetOpen, setFormatSheetOpen] = useState(false);

  function openBudgetSheet() {
    setBudgetInput(budget !== null ? String(budget) : '');
    setBudgetSheetOpen(true);
  }

  async function saveBudget(close: () => void) {
    const parsed = parseFloat(budgetInput);
    if (!budgetInput.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    await setBudget(parsed);
    close();
  }

  async function removeBudget(close: () => void) {
    await setBudget(null);
    close();
  }

  function handleCurrencySymbolPress() {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Currency Symbol',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: (text: string | undefined) => setLocale({ symbol: text?.trim() || DEFAULT_LOCALE.symbol }) },
        ],
        'plain-text',
        locale.symbol,
      );
    } else {
      setSymbolInput(locale.symbol);
      setSymbolSheetOpen(true);
    }
  }

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
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
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
        </Card>
      </View>

      {/* Region section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Region</Text>
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
          {/* Currency Symbol */}
          <Pressable
            onPress={handleCurrencySymbolPress}
            style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Currency Symbol"
          >
            <Text style={rowLabel}>Currency Symbol</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.inkSoft }}>
              {locale.symbol}
            </Text>
          </Pressable>

          <View style={divider} />

          {/* Number Format */}
          <View style={rowStyle}>
            <View style={{ flex: 1 }}>
              <Text style={rowLabel}>Number Format</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Pressable
                  onPress={() => setLocale({ decimalComma: false })}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: !locale.decimalComma ? colors.ink : colors.line,
                    backgroundColor: !locale.decimalComma ? colors.ink : colors.surface,
                  }}
                >
                  <Text style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 13,
                    color: !locale.decimalComma ? colors.bg : colors.inkSoft,
                  }}>1,234.56</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLocale({ decimalComma: true })}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: locale.decimalComma ? colors.ink : colors.line,
                    backgroundColor: locale.decimalComma ? colors.ink : colors.surface,
                  }}
                >
                  <Text style={{
                    fontFamily: 'Inter_500Medium',
                    fontSize: 13,
                    color: locale.decimalComma ? colors.bg : colors.inkSoft,
                  }}>1.234,56</Text>
                </Pressable>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 10 }}>
                {'Preview: ' + (locale.decimalComma
                  ? `${locale.symbol}1.234,56`
                  : `${locale.symbol}1,234.56`)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Data section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Data</Text>
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
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
          <View style={[rowStyle, { paddingRight: 8 }]}>
            <Pressable
              onPress={handleImport}
              disabled={importing}
              style={{ flex: 1 }}
              accessibilityLabel="Import CSV"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={rowLabel}>Import CSV</Text>
                <Pressable
                  onPress={() => setFormatSheetOpen(true)}
                  hitSlop={8}
                  accessibilityLabel="Show CSV format"
                >
                  <Feather name="info" size={13} color={colors.inkMuted} />
                </Pressable>
              </View>
              <Text style={rowSub}>Restore entries from a file</Text>
            </Pressable>
            {importing
              ? <ActivityIndicator size="small" color={colors.inkMuted} />
              : <Text style={chevron}>↓</Text>
            }
          </View>

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
        </Card>
      </View>

      {/* Budget section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Budget</Text>
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
          <Pressable
            onPress={openBudgetSheet}
            style={({ pressed }) => [rowStyle, pressed && { opacity: 0.6 }]}
            accessibilityLabel="Monthly Budget"
          >
            <Text style={rowLabel}>Monthly Budget</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: budget !== null ? colors.ink : colors.inkMuted }}>
              {budget !== null ? fmtFull(budget) : 'Not set'}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* Security section */}
      <View style={{ marginTop: 28 }}>
        <Text style={sectionLabel}>Security</Text>
        <Card style={{ borderRadius: 16, overflow: 'hidden' }}>
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
        </Card>
      </View>

      <BottomSheet
        visible={budgetSheetOpen}
        onClose={() => setBudgetSheetOpen(false)}
        keyboardAvoiding
      >
        {(close) => (
          <View style={{ padding: 24 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 6 }}>
              Monthly Budget
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 20 }}>
              Leave empty to disable the budget indicator.
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.bg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: colors.ink,
                marginBottom: 16,
              }}
              keyboardType="numeric"
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.inkMuted}
              autoFocus
            />
            <Pressable
              onPress={() => saveBudget(close)}
              style={({ pressed }) => [{
                backgroundColor: colors.accent,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center' as const,
                marginBottom: 10,
              }, pressed && { opacity: 0.8 }]}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' }}>Save</Text>
            </Pressable>
            {budget !== null && (
              <Pressable
                onPress={() => removeBudget(close)}
                style={({ pressed }) => [{ paddingVertical: 12, alignItems: 'center' as const, marginBottom: 4 }, pressed && { opacity: 0.6 }]}
              >
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#e84040' }}>Remove Budget</Text>
              </Pressable>
            )}
            <Pressable
              onPress={close}
              style={({ pressed }) => [{ paddingVertical: 12, alignItems: 'center' as const }, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.inkMuted }}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        visible={symbolSheetOpen}
        onClose={() => setSymbolSheetOpen(false)}
        keyboardAvoiding
      >
        {(close) => (
          <View style={{ padding: 24 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 20 }}>
              Currency Symbol
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.bg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.line,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontFamily: 'Inter_400Regular',
                fontSize: 16,
                color: colors.ink,
                marginBottom: 16,
              }}
              value={symbolInput}
              onChangeText={setSymbolInput}
              placeholder={DEFAULT_LOCALE.symbol}
              placeholderTextColor={colors.inkMuted}
              maxLength={3}
              autoFocus
            />
            <Pressable
              onPress={async () => {
                await setLocale({ symbol: symbolInput.trim() || DEFAULT_LOCALE.symbol });
                close();
              }}
              style={({ pressed }) => [{
                backgroundColor: colors.accent,
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center' as const,
                marginBottom: 10,
              }, pressed && { opacity: 0.8 }]}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#fff' }}>Save</Text>
            </Pressable>
            <Pressable
              onPress={close}
              style={({ pressed }) => [{ paddingVertical: 12, alignItems: 'center' as const }, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.inkMuted }}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        visible={formatSheetOpen}
        onClose={() => setFormatSheetOpen(false)}
      >
        {(close) => (
          <View style={{ padding: 24 }}>
            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18, color: colors.ink, marginBottom: 4 }}>
              CSV Format
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.inkMuted, marginBottom: 20 }}>
              Your file must include these four columns in order.
            </Text>

            {/* Column definitions */}
            {[
              { col: 'id', desc: 'Unique entry ID', example: 'e_1234567890' },
              { col: 'date', desc: 'ISO date', example: 'YYYY-MM-DD' },
              { col: 'amounts', desc: 'JSON array of numbers', example: '[150, 80]' },
              { col: 'note', desc: 'Label (optional)', example: 'groceries' },
            ].map(({ col, desc, example }) => (
              <View
                key={col}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <View style={{
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  minWidth: 72,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ink }}>{col}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.inkSoft }}>{desc}</Text>
                  <Text style={{ fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.inkMuted, marginTop: 1 }}>{example}</Text>
                </View>
              </View>
            ))}

            {/* Example block */}
            <View style={{
              backgroundColor: colors.bg,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.line,
              padding: 14,
              marginTop: 8,
              marginBottom: 20,
            }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, color: colors.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                Example
              </Text>
              {[
                'id,date,amounts,note',
                'e_001,2024-01-15,"[150,80]",groceries',
                'e_002,2024-01-16,[200],rent',
              ].map((line, i) => (
                <Text
                  key={i}
                  style={{
                    fontFamily: 'DMSans_400Regular',
                    fontSize: 11,
                    color: i === 0 ? colors.inkMuted : colors.ink,
                    lineHeight: 18,
                  }}
                >
                  {line}
                </Text>
              ))}
            </View>

            <Pressable
              onPress={close}
              style={({ pressed }) => [{ paddingVertical: 12, alignItems: 'center' as const }, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.inkMuted }}>Close</Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      <PinSetupSheet
        visible={setupSheet.visible}
        mode={setupSheet.mode}
        onClose={() => setSetupSheet(s => ({ ...s, visible: false }))}
        onSuccess={() => setSetupSheet(s => ({ ...s, visible: false }))}
      />
    </ScrollView>
  );
}
