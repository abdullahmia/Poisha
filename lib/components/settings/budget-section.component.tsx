import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import { useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useBudget } from '@/lib/hooks/use-budget.hook';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useNotifications } from '@/lib/hooks/use-notifications.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { BudgetSheetContent } from './budget-sheet.component';
import { RowIcon, SectionHeader } from './settings-row.component';
import { rowClass, rowLabelStyle, rowSubStyle } from './settings-styles.constants';

export function BudgetSection() {
  const { colors } = useTheme();
  const { fmtFull } = useLocale();
  const { budget, setBudget } = useBudget();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const style = useFadeIn(280);

  const [budgetSheetOpen, setBudgetSheetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

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

  return (
    <Animated.View className="mt-7" style={style}>
      <SectionHeader icon="credit-card" label="Budget" />
      <Card className="overflow-hidden rounded-2xl">
        <Pressable onPress={openBudgetSheet} className={clsx(rowClass, 'active:opacity-60')} accessibilityLabel="Monthly Budget">
          <View className="flex-row items-center gap-3">
            <RowIcon name="target" />
            <Text className="text-ink" style={rowLabelStyle}>Monthly Budget</Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Text className={budget !== null ? 'text-ink' : 'text-ink-muted'} style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
              {budget !== null ? fmtFull(budget) : 'Not set'}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.inkMuted} />
          </View>
        </Pressable>

        <View className="mx-4 h-px bg-line" />

        <View className={rowClass}>
          <View className="flex-row items-center gap-3">
            <RowIcon name="bell" />
            <View>
              <Text className="text-ink" style={rowLabelStyle}>Budget Alerts</Text>
              <Text className="mt-0.5 text-ink-soft" style={rowSubStyle}>{notificationsEnabled ? 'On' : 'Off'}</Text>
            </View>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={async val => {
              const result = await setNotificationsEnabled(val);
              if (val && !result) {
                Alert.alert('Permission needed', 'Enable notifications for Poisha in system settings to get budget alerts.');
              }
            }}
            trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>

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
    </Animated.View>
  );
}
