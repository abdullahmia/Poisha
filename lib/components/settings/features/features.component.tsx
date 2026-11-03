import type React from 'react';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { usePlanSummary } from '@/lib/hooks/use-plan-summary.hook';
import { useSms } from '@/lib/hooks/use-sms.hook';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

type TPendingOff = 'plan' | 'categories' | 'sms' | null;

export const Features: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { fmtFull } = useLocale();
  const { enabled: planEnabled, setEnabled: setPlanEnabled } = usePlanMode();
  const { enabled: categoriesEnabled, setEnabled: setCategoriesEnabled } = useCategories();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();
  const { count: plannedCount, plannedTotal } = usePlanSummary();
  const {
    available: smsAvailable,
    enabled: smsEnabled,
    pendingCount: smsPendingCount,
    setEnabled: setSmsEnabled,
    requestPermission: requestSmsPermission,
  } = useSms();

  const [pendingOff, setPendingOff] = useState<TPendingOff>(null);

  // Only switching *off* asks. Turning a feature on adds surfaces and changes
  // no numbers, so a prompt there would be pure friction.
  function handlePlanChange(next: boolean) {
    if (next) setPlanEnabled(true);
    else setPendingOff('plan');
  }

  function handleCategoriesChange(next: boolean) {
    if (next) setCategoriesEnabled(true);
    else setPendingOff('categories');
  }

  // Turning this one on also asks for the permission, because a flag that's on
  // while the permission is missing does nothing and looks broken.
  function handleSmsChange(next: boolean) {
    if (next) void setSmsEnabled(true).then(() => requestSmsPermission());
    else setPendingOff('sms');
  }

  // The consequence is specific and worth stating: planned money stops being
  // held aside and lands in this month's spend.
  const planMessage =
    plannedCount > 0
      ? `Your ${plannedCount} planned ${plannedCount === 1 ? 'entry' : 'entries'} (${fmtFull(plannedTotal)}) will count as ordinary spending straight away, so your totals will go up. The Plan tab disappears and the date picker goes back to capping at today.\n\nNothing is deleted — turning Plan Mode back on restores everything exactly as it was.`
      : 'The Plan tab disappears and the date picker goes back to capping at today, so you can no longer schedule future entries.\n\nNothing is deleted — you can turn it back on at any time.';

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader title="Features" subtitle="Turn parts of Poisha on or off. Nothing is deleted when you switch something off." />

      <SettingsToggleRow
        label="Plan Mode"
        description="Schedule future-dated entries. They stay out of your totals until their date arrives."
        value={planEnabled}
        onValueChange={handlePlanChange}
      />

      <View className="h-px bg-line" />

      <SettingsToggleRow
        label="Categories"
        description="Tag entries so you can see where your money goes."
        value={categoriesEnabled}
        onValueChange={handleCategoriesChange}
      />

      <View className="h-px bg-line" />

      {/* Android-only, and hidden rather than disabled where it can't work:
          a greyed-out switch implies a setting the user could reach. */}
      {smsAvailable && (
        <>
          <SettingsToggleRow
            label="Automatic expenses"
            description="Read bank and wallet messages to suggest entries. Nothing is added without your confirmation."
            value={smsEnabled}
            onValueChange={handleSmsChange}
          />
          <View className="h-px bg-line" />
        </>
      )}

      <SettingsToggleRow
        label="Haptic feedback"
        description="Small vibrations when you tap, save, and delete."
        value={hapticsEnabled}
        onValueChange={setHapticsEnabled}
      />

      <ConfirmModal
        visible={pendingOff === 'plan'}
        onClose={() => setPendingOff(null)}
        title="Turn off Plan Mode?"
        message={planMessage}
        icon="calendar"
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Turn off', variant: 'solid', onPress: () => setPlanEnabled(false) },
        ]}
      />

      <ConfirmModal
        visible={pendingOff === 'categories'}
        onClose={() => setPendingOff(null)}
        title="Turn off Categories?"
        message={
          'The Categories tab disappears and entries stop showing their tags. Your totals are unaffected.\n\nNothing is deleted — every entry keeps its category, and turning Categories back on brings them all straight back.'
        }
        icon="tag"
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Turn off', variant: 'solid', onPress: () => setCategoriesEnabled(false) },
        ]}
      />

      <ConfirmModal
        visible={pendingOff === 'sms'}
        onClose={() => setPendingOff(null)}
        title="Turn off Automatic expenses?"
        message={
          smsPendingCount > 0
            ? `Poisha stops reading new messages, and the ${smsPendingCount} ${smsPendingCount === 1 ? 'transaction' : 'transactions'} waiting for review will be deleted.\n\nEntries you already confirmed are untouched.`
            : 'Poisha stops reading new messages. Entries you already confirmed are untouched.\n\nIf you turn this back on later, it starts from that moment — it won’t go back and read the messages in between.'
        }
        icon="message-square"
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Turn off', variant: 'solid', onPress: () => void setSmsEnabled(false) },
        ]}
      />
    </ScrollView>
  );
};
