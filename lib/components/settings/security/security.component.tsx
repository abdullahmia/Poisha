import type React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PinSetupSheet } from '@/lib/components/pin/pin-setup-sheet.component';
import { useAlert } from '@/lib/context/alert.context';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsNavRow } from '../shared/settings-nav-row.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

export const Security: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const showAlert = useAlert();
  const { lockEnabled, biometricType, biometricEnabled, enableBiometric, disableBiometric } = useLock();
  const { authenticate } = useBiometric();

  const [setupSheet, setSetupSheet] = useState<{ visible: boolean; mode: 'enable' | 'change' | 'disable' }>({
    visible: false,
    mode: 'enable',
  });

  async function handleBiometricToggle(val: boolean) {
    if (!val) {
      await disableBiometric();
      return;
    }
    const result = await authenticate(`Verify ${biometricLabel(biometricType)}`);
    if (result.success) {
      await enableBiometric();
    } else {
      showAlert({ title: 'Verification failed', message: 'Biometric verification failed. Please try again.' });
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Security" subtitle="Poisha's data lives only on this device. A PIN keeps it private if the device is shared." />

      <SettingsToggleRow
        label="App Lock"
        description="Require a PIN each time Poisha opens."
        value={lockEnabled}
        onValueChange={val => setSetupSheet({ visible: true, mode: val ? 'enable' : 'disable' })}
      />

      {lockEnabled && (
        <>
          <View className="h-px bg-line" />
          <SettingsNavRow
            icon="key"
            label="Change PIN"
            onPress={() => setSetupSheet({ visible: true, mode: 'change' })}
          />
        </>
      )}

      {lockEnabled && biometricType !== 'none' && (
        <>
          <View className="h-px bg-line" />
          <View className="flex-row items-center gap-3 pt-4">
            {biometricIcon(biometricType) && (
              <HugeiconsIcon icon={biometricIcon(biometricType)!} size={18} color={colors.inkSoft} />
            )}
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>
              {biometricLabel(biometricType)}
            </Text>
          </View>
          <SettingsToggleRow
            label={`Unlock with ${biometricLabel(biometricType)}`}
            description="Skip the PIN when your device recognises you."
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
        </>
      )}

      {lockEnabled && biometricEnabled && (
        <>
          <View className="h-px bg-line" />
          <SettingsNavRow
            icon="refresh-cw"
            label={`Re-enroll ${biometricLabel(biometricType)}`}
            onPress={async () => {
              const result = await authenticate(`Re-enroll ${biometricLabel(biometricType)}`);
              if (!result.success) {
                showAlert({ title: 'Verification failed', message: 'Could not verify biometric credential.' });
              }
            }}
          />
        </>
      )}

      <PinSetupSheet
        visible={setupSheet.visible}
        mode={setupSheet.mode}
        onClose={() => setSetupSheet(s => ({ ...s, visible: false }))}
        onSuccess={() => setSetupSheet(s => ({ ...s, visible: false }))}
      />
    </ScrollView>
  );
};
