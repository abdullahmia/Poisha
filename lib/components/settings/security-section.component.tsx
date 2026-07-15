import { Feather } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { PinSetupSheet } from '@/lib/components/pin/pin-setup-sheet.component';
import { useBiometric } from '@/lib/hooks/use-biometric.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Card } from '@/lib/ui/card.ui';
import { biometricIcon, biometricLabel } from '@/lib/utils/biometric.utils';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function SecuritySection() {
  const { colors } = useTheme();
  const { lockEnabled, biometricType, biometricEnabled, enableBiometric, disableBiometric } = useLock();
  const { authenticate } = useBiometric();
  const style = useFadeIn(350);

  const [setupSheet, setSetupSheet] = useState<{ visible: boolean; mode: 'enable' | 'change' | 'disable' }>({ visible: false, mode: 'enable' });

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="shield" label="Security" />
      <Card className="overflow-hidden rounded-2xl">
        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="lock" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>App Lock</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{lockEnabled ? 'On' : 'Off'}</Text>
            </View>
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
              <View className="flex-row items-center gap-3">
                <RowIcon name="key" />
                <Text className="text-ink" style={rowLabelStyle}>Change PIN</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.inkMuted} />
            </Pressable>
          </>
        )}

        {lockEnabled && biometricType !== 'none' && (
          <>
            <View className="mx-4 h-px bg-line" />
            <View className={rowClass}>
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.surfaceAlt }}>
                  {biometricIcon(biometricType) && (
                    <HugeiconsIcon icon={biometricIcon(biometricType)!} size={16} color={colors.inkSoft} />
                  )}
                </View>
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
              <View className="flex-row items-center gap-3">
                <RowIcon name="refresh-cw" />
                <Text className="text-ink" style={rowLabelStyle}>Re-enroll {biometricLabel(biometricType)}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.inkMuted} />
            </Pressable>
          </>
        )}
      </Card>

      <PinSetupSheet
        visible={setupSheet.visible}
        mode={setupSheet.mode}
        onClose={() => setSetupSheet(s => ({ ...s, visible: false }))}
        onSuccess={() => setSetupSheet(s => ({ ...s, visible: false }))}
      />
    </Animated.View>
  );
}
