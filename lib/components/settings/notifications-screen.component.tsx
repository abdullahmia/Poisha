import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '@/lib/hooks/use-notifications.hook';
import {
  useBudgetAlertsEnabled,
  usePlanRemindersEnabled,
  useSetBudgetAlertsEnabled,
  useSetPlanRemindersEnabled,
} from '@/lib/services/notifications';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { ScreenHeader } from './screen-header.component';
import { SettingsToggleRow } from './settings-toggle-row.component';

function GroupLabel({ title, description }: { title: string; description: string }) {
  return (
    <View className="pb-1 pt-7">
      <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}>
        {title}
      </Text>
      <Text className="mt-1 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        {description}
      </Text>
    </View>
  );
}

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const { enabled: planModeEnabled } = usePlanMode();

  const budgetAlerts = useBudgetAlertsEnabled();
  const setBudgetAlerts = useSetBudgetAlertsEnabled();
  const planReminders = usePlanRemindersEnabled();
  const setPlanReminders = useSetPlanRemindersEnabled();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Notifications" />

      <SettingsToggleRow
        label="Allow notifications"
        description="Permission for Poisha to send alerts to this device."
        value={notificationsEnabled}
        onValueChange={setNotificationsEnabled}
      />

      <View className="h-px bg-line" />

      <GroupLabel title="Spending" description="Alerts about money already spent." />
      <SettingsToggleRow
        label="Budget alerts"
        description="When this month's spending passes your budget."
        value={budgetAlerts.data ?? true}
        onValueChange={v => setBudgetAlerts.mutate(v)}
        disabled={!notificationsEnabled}
      />

      <View className="h-px bg-line" />

      <GroupLabel title="Planning" description="Alerts about entries scheduled for the future." />
      <SettingsToggleRow
        label="Planned entry reminders"
        description={
          planModeEnabled
            ? 'At 9:00 AM on the day a planned entry starts counting.'
            : 'Turn on Plan Mode in Features to schedule future entries.'
        }
        value={planReminders.data ?? true}
        onValueChange={v => setPlanReminders.mutate(v)}
        // Doubly gated: a reminder about planned entries is meaningless when
        // Plan Mode is off, since nothing can be planned in the first place.
        disabled={!notificationsEnabled || !planModeEnabled}
      />
    </ScrollView>
  );
}
