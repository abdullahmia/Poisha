import type React from 'react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { ScreenHeader } from '../shared/screen-header.component';

export const Region: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();

  const [symbol, setSymbol] = useState(locale.symbol);

  // Inline field with a blur commit — replaces the old split path that used an
  // iOS Alert.prompt and an Android bottom sheet to edit one character.
  function commitSymbol() {
    const next = symbol.trim() || DEFAULT_LOCALE.symbol;
    setSymbol(next);
    setLocale({ symbol: next });
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="Region" subtitle="How amounts are written throughout the app." />

      <Text
        className="pb-2 uppercase text-ink-muted"
        style={{ fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_600SemiBold' }}
      >
        Currency symbol
      </Text>
      <View className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4">
        <TextInput
          value={symbol}
          onChangeText={setSymbol}
          onBlur={commitSymbol}
          onSubmitEditing={commitSymbol}
          returnKeyType="done"
          maxLength={3}
          placeholder={DEFAULT_LOCALE.symbol}
          placeholderTextColor={colors.inkMuted}
          className="flex-1 py-4 text-ink"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 18 }}
        />
      </View>

      <Text
        className="pb-2 pt-7 uppercase text-ink-muted"
        style={{ fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_600SemiBold' }}
      >
        Number format
      </Text>
      <View className="flex-row gap-2.5">
        {[
          { comma: false, label: '1,234.56' },
          { comma: true, label: '1.234,56' },
        ].map(opt => {
          const selected = locale.decimalComma === opt.comma;
          return (
            <Pressable
              key={opt.label}
              onPress={() => setLocale({ decimalComma: opt.comma })}
              className={clsx(
                'flex-1 items-center rounded-2xl border py-4',
                selected ? 'border-accent bg-accent' : 'border-line bg-surface',
              )}
            >
              <Text
                className={selected ? 'text-white' : 'text-ink-soft'}
                style={{ fontFamily: 'Inter_500Medium', fontSize: 15 }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text className="pt-4 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
        Preview: {locale.decimalComma ? `${symbol}1.234,56` : `${symbol}1,234.56`}
      </Text>
    </ScrollView>
  );
};
