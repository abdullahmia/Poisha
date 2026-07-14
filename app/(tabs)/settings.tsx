import { Feather } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { clsx } from 'clsx';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BudgetSheetContent } from '@/lib/components/settings/budget-sheet.component';
import { CsvFormatSheetContent } from '@/lib/components/settings/csv-format-sheet.component';
import { CurrencySymbolSheetContent } from '@/lib/components/settings/currency-symbol-sheet.component';
import { PinSetupSheet } from '@/lib/components/pin-setup-sheet.component';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useCsvExport } from '@/lib/hooks/use-csv-export.hook';
import { useCsvImport } from '@/lib/hooks/use-csv-import.hook';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';

const rowClass = 'flex-row items-center justify-between px-4 py-4';
const sectionLabelClass = 'mb-2 uppercase text-ink-muted';
const sectionLabelStyle = { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 2 } as const;
const rowLabelStyle = { fontFamily: 'Inter_500Medium', fontSize: 15 } as const;
const rowSubStyle = { fontFamily: 'Inter_400Regular', fontSize: 12 } as const;
const chevronStyle = { fontFamily: 'Inter_400Regular', fontSize: 18 } as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors, toggleScheme } = useTheme();
  const { entries, importEntries } = useEntries();
  const { locale, setLocale, fmtFull } = useLocale();
  const { lockEnabled, biometricType, biometricEnabled, enableBiometric, disableBiometric } = useLock();
  const { authenticate } = useBiometric();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();
  const { budget, setBudget } = useBudget();
  const { exporting, handleExport } = useCsvExport(entries);
  const { importing, handleImport } = useCsvImport();

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

  async function saveBudget() {
    const parsed = parseFloat(budgetInput);
    if (!budgetInput.trim() || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number.');
      return;
    }
    await setBudget(parsed);
    setBudgetSheetOpen(false);
  }

  async function removeBudget() {
    await setBudget(null);
    setBudgetSheetOpen(false);
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

  async function saveCurrencySymbol() {
    await setLocale({ symbol: symbolInput.trim() || DEFAULT_LOCALE.symbol });
    setSymbolSheetOpen(false);
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="pb-2 pt-7">
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, letterSpacing: -0.5 }}>
          Settings
        </Text>
      </View>

      {/* Appearance section */}
      <View className="mt-6">
        <Text className={sectionLabelClass} style={sectionLabelStyle}>Appearance</Text>
        <Card className="overflow-hidden rounded-2xl">
          <View className={rowClass}>
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Theme</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{scheme === 'dark' ? 'Dark' : 'Light'}</Text>
            </View>
            <Switch
              value={scheme === 'dark'}
              onValueChange={toggleScheme}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>

          <View className="mx-4 h-px bg-line" />

          <View className={rowClass}>
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Haptic Feedback</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{hapticsEnabled ? 'On' : 'Off'}</Text>
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
      <View className="mt-7">
        <Text className={sectionLabelClass} style={sectionLabelStyle}>Region</Text>
        <Card className="overflow-hidden rounded-2xl">
          <Pressable
            onPress={handleCurrencySymbolPress}
            className={clsx(rowClass, 'active:opacity-60')}
            accessibilityLabel="Currency Symbol"
          >
            <Text className="text-ink" style={rowLabelStyle}>Currency Symbol</Text>
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
              {locale.symbol}
            </Text>
          </Pressable>

          <View className="mx-4 h-px bg-line" />

          <View className={rowClass}>
            <View className="flex-1">
              <Text className="text-ink" style={rowLabelStyle}>Number Format</Text>
              <View className="mt-2.5 flex-row gap-2">
                <Pressable
                  onPress={() => setLocale({ decimalComma: false })}
                  className={clsx('rounded-lg border px-3.5 py-2', !locale.decimalComma ? 'border-ink bg-ink' : 'border-line bg-surface')}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: !locale.decimalComma ? colors.bg : colors.inkSoft }}>
                    1,234.56
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLocale({ decimalComma: true })}
                  className={clsx('rounded-lg border px-3.5 py-2', locale.decimalComma ? 'border-ink bg-ink' : 'border-line bg-surface')}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: locale.decimalComma ? colors.bg : colors.inkSoft }}>
                    1.234,56
                  </Text>
                </Pressable>
              </View>
              <Text className="mt-2.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
                {'Preview: ' + (locale.decimalComma ? `${locale.symbol}1.234,56` : `${locale.symbol}1,234.56`)}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Data section */}
      <View className="mt-7">
        <Text className={sectionLabelClass} style={sectionLabelStyle}>Data</Text>
        <Card className="overflow-hidden rounded-2xl">
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className={clsx(rowClass, 'active:opacity-60')}
            accessibilityLabel="Export CSV"
          >
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Export CSV</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Share all entries as a file</Text>
            </View>
            {exporting ? <ActivityIndicator size="small" color={colors.inkMuted} /> : <Text className="text-ink-muted" style={chevronStyle}>↑</Text>}
          </Pressable>

          <View className="mx-4 h-px bg-line" />

          <View className={clsx(rowClass, 'pr-2')}>
            <Pressable onPress={handleImport} disabled={importing} className="flex-1" accessibilityLabel="Import CSV">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-ink" style={rowLabelStyle}>Import CSV</Text>
                <Pressable onPress={() => setFormatSheetOpen(true)} hitSlop={8} accessibilityLabel="Show CSV format">
                  <Feather name="info" size={13} color={colors.inkMuted} />
                </Pressable>
              </View>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Restore entries from a file</Text>
            </Pressable>
            {importing ? <ActivityIndicator size="small" color={colors.inkMuted} /> : <Text className="text-ink-muted" style={chevronStyle}>↓</Text>}
          </View>

          <View className="mx-4 h-px bg-line" />

          <Pressable
            onPress={() => {
              Alert.alert(
                'Reset All Data',
                'This will permanently delete all your entries. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', style: 'destructive', onPress: () => importEntries([], true) },
                ],
              );
            }}
            className={clsx(rowClass, 'active:opacity-60')}
            accessibilityLabel="Reset all data"
          >
            <View>
              <Text className="text-accent" style={rowLabelStyle}>Reset All Data</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>Permanently delete all entries</Text>
            </View>
            <Text className="text-accent" style={chevronStyle}>›</Text>
          </Pressable>
        </Card>
      </View>

      {/* Budget section */}
      <View className="mt-7">
        <Text className={sectionLabelClass} style={sectionLabelStyle}>Budget</Text>
        <Card className="overflow-hidden rounded-2xl">
          <Pressable onPress={openBudgetSheet} className={clsx(rowClass, 'active:opacity-60')} accessibilityLabel="Monthly Budget">
            <Text className="text-ink" style={rowLabelStyle}>Monthly Budget</Text>
            <Text className={budget !== null ? 'text-ink' : 'text-ink-muted'} style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
              {budget !== null ? fmtFull(budget) : 'Not set'}
            </Text>
          </Pressable>
        </Card>
      </View>

      {/* Security section */}
      <View className="mt-7">
        <Text className={sectionLabelClass} style={sectionLabelStyle}>Security</Text>
        <Card className="overflow-hidden rounded-2xl">
          <View className={rowClass}>
            <View>
              <Text className="text-ink" style={rowLabelStyle}>App Lock</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{lockEnabled ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={lockEnabled}
              onValueChange={val => setSetupSheet({ visible: true, mode: val ? 'enable' : 'disable' })}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>

          {lockEnabled && (
            <>
              <View className="mx-4 h-px bg-line" />
              <Pressable
                onPress={() => setSetupSheet({ visible: true, mode: 'change' })}
                className={clsx(rowClass, 'active:opacity-60')}
                accessibilityLabel="Change PIN"
              >
                <Text className="text-ink" style={rowLabelStyle}>Change PIN</Text>
                <Text className="text-ink-muted" style={chevronStyle}>›</Text>
              </Pressable>
            </>
          )}

          {lockEnabled && biometricType !== 'none' && (
            <>
              <View className="mx-4 h-px bg-line" />
              <View className={rowClass}>
                <View className="flex-row items-center gap-2.5">
                  {biometricIcon(biometricType) && (
                    <HugeiconsIcon icon={biometricIcon(biometricType)!} size={18} color={colors.inkSoft} />
                  )}
                  <View>
                    <Text className="text-ink" style={rowLabelStyle}>{biometricLabel(biometricType)}</Text>
                    <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{biometricEnabled ? 'On' : 'Off'}</Text>
                  </View>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={async val => {
                    if (val) {
                      const result = await authenticate(`Verify ${biometricLabel(biometricType)}`);
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

          {lockEnabled && biometricEnabled && (
            <>
              <View className="mx-4 h-px bg-line" />
              <Pressable
                onPress={async () => {
                  const result = await authenticate(`Re-enroll ${biometricLabel(biometricType)}`);
                  if (!result.success) {
                    Alert.alert('Verification failed', 'Could not verify biometric credential.');
                  }
                }}
                className={clsx(rowClass, 'active:opacity-60')}
                accessibilityLabel={`Re-enroll ${biometricLabel(biometricType)}`}
              >
                <Text className="text-ink" style={rowLabelStyle}>Re-enroll {biometricLabel(biometricType)}</Text>
                <Text className="text-ink-muted" style={chevronStyle}>›</Text>
              </Pressable>
            </>
          )}
        </Card>
      </View>

      <BottomSheet visible={budgetSheetOpen} onClose={() => setBudgetSheetOpen(false)} keyboardAvoiding>
        {() => (
          <BudgetSheetContent
            budgetInput={budgetInput}
            setBudgetInput={setBudgetInput}
            hasBudget={budget !== null}
            onSave={saveBudget}
            onRemove={removeBudget}
            onCancel={() => setBudgetSheetOpen(false)}
          />
        )}
      </BottomSheet>

      <BottomSheet visible={symbolSheetOpen} onClose={() => setSymbolSheetOpen(false)} keyboardAvoiding>
        {() => (
          <CurrencySymbolSheetContent
            symbolInput={symbolInput}
            setSymbolInput={setSymbolInput}
            onSave={saveCurrencySymbol}
            onCancel={() => setSymbolSheetOpen(false)}
          />
        )}
      </BottomSheet>

      <BottomSheet visible={formatSheetOpen} onClose={() => setFormatSheetOpen(false)}>
        {() => <CsvFormatSheetContent onClose={() => setFormatSheetOpen(false)} />}
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
