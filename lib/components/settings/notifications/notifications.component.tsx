import type React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '@/lib/hooks/use-notifications.hook';
import {
  useBudgetAlertsEnabled,
  usePlanRemindersEnabled,
  useSetBudgetAlertsEnabled,
  useSetPlanRemindersEnabled,
  useSetSmsAlertsEnabled,
  useSmsAlertsEnabled,
} from '@/lib/services/notifications';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { useSmsBadge } from '@/lib/hooks/use-sms-badge.hook';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

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

export const Notifications: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const { enabled: planModeEnabled } = usePlanMode();

  const budgetAlerts = useBudgetAlertsEnabled();
  const setBudgetAlerts = useSetBudgetAlertsEnabled();
  const planReminders = usePlanRemindersEnabled();
  const setPlanReminders = useSetPlanRemindersEnabled();
  const { available: smsAvailable, enabled: smsEnabled } = useSmsBadge();
  const smsAlerts = useSmsAlertsEnabled();
  const setSmsAlerts = useSetSmsAlertsEnabled();

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

      {smsAvailable && (
        <>
          <View className="h-px bg-line" />

          <GroupLabel
            title="Bank messages"
            description="Alerts when a transaction message arrives while Poisha is closed."
          />
          <SettingsToggleRow
            label="Detected transactions"
            description={
              smsEnabled
                ? 'A nudge to review it. The message itself is never shown in the notification.'
                : 'Turn on Automatic expenses in Features to use this.'
            }
            value={smsAlerts.data ?? true}
            onValueChange={v => setSmsAlerts.mutate(v)}
            disabled={!notificationsEnabled || !smsEnabled}
          />
          {smsEnabled && notificationsEnabled && (smsAlerts.data ?? true) && (
            <Text
              className="pb-2 text-ink-muted"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}
            >
              Some phones — Xiaomi, Realme, Oppo, Vivo and others — aggressively stop background apps, which can delay
              or skip this notification. Nothing is lost either way: anything missed is picked up next time you open
              Poisha.
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
};
