import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '@/lib/context/alert.context';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { ScreenHeader } from './screen-header.component';

export function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const showAlert = useAlert();
  const { locale, fmtFull } = useLocale();
  const { budget, setBudget } = useBudget();

  const [input, setInput] = useState(budget !== null ? String(budget) : '');

  async function save() {
    const parsed = parseFloat(input);
    if (!input.trim() || isNaN(parsed) || parsed <= 0) {
      showAlert({ title: 'Invalid amount', message: 'Please enter a positive number.' });
      return;
    }
    await setBudget(parsed);
  }

  async function remove() {
    await setBudget(null);
    setInput('');
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        title="Budget"
        subtitle="A monthly spending limit. Poisha shows your progress against it on Home."
      />

      <Text
        className="pb-2 uppercase text-ink-muted"
        style={{ fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_600SemiBold' }}
      >
        Monthly budget
      </Text>
      <View className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4">
        <Text className="mr-2.5 text-ink-muted" style={{ fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17 }}>
          {locale.symbol}
        </Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="e.g. 5000"
          keyboardType="numeric"
          placeholderTextColor={colors.inkMuted}
          className="flex-1 py-4 text-ink"
          style={{ fontFamily: 'Inter_500Medium', fontSize: 18, letterSpacing: -0.2 }}
        />
      </View>

      <Text className="pt-2.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
        {budget !== null ? `Currently ${fmtFull(budget)} per month.` : 'No budget set.'}
      </Text>

      <Pressable onPress={save} className="mt-7 items-center rounded-2xl bg-accent py-[17px] active:opacity-80">
        <Text className="uppercase text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.6 }}>
          Save budget
        </Text>
      </Pressable>

      {budget !== null && (
        <Pressable onPress={remove} className="mt-3 items-center py-3 active:opacity-60">
          <Text className="text-danger" style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }}>
            Remove budget
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
