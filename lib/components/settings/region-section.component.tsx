import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { CurrencySymbolSheetContent } from './currency-symbol-sheet.component';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle } from './settings-styles.constants';

export function RegionSection() {
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
  const style = useFadeIn(140);

  const [symbolSheetOpen, setSymbolSheetOpen] = useState(false);
  const [symbolInput, setSymbolInput] = useState('');

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
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="globe" label="Region" />
      <Card className="overflow-hidden rounded-2xl">
        <Pressable
          onPress={handleCurrencySymbolPress}
          className={clsx(rowClass, 'active:opacity-60')}
          accessibilityLabel="Currency Symbol"
        >
          <View className="flex-row items-center gap-3">
            <RowIcon name="dollar-sign" />
            <Text className="text-ink" style={rowLabelStyle}>Currency Symbol</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
              {locale.symbol}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.inkMuted} />
          </View>
        </Pressable>

        <View className="mx-4 h-px bg-line" />

        <View className={rowClass}>
          <View className="flex-1">
            <View className="flex-row items-center gap-3">
              <RowIcon name="hash" />
              <Text className="text-ink" style={rowLabelStyle}>Number Format</Text>
            </View>
            <View className="ml-12 mt-2.5 flex-row gap-2">
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
            <Text className="ml-12 mt-2.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              {'Preview: ' + (locale.decimalComma ? `${locale.symbol}1.234,56` : `${locale.symbol}1,234.56`)}
            </Text>
          </View>
        </View>
      </Card>

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
    </Animated.View>
  );
}
