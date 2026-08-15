import type React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { usePlanMode } from '@/lib/hooks/use-plan-mode.hook';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

export const Features: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { enabled: planEnabled, setEnabled: setPlanEnabled } = usePlanMode();
  const { enabled: categoriesEnabled, setEnabled: setCategoriesEnabled } = useCategories();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();

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
        onValueChange={setPlanEnabled}
      />

      <View className="h-px bg-line" />

      <SettingsToggleRow
        label="Categories"
        description="Tag entries so you can see where your money goes."
        value={categoriesEnabled}
        onValueChange={setCategoriesEnabled}
      />

      <View className="h-px bg-line" />

      <SettingsToggleRow
        label="Haptic feedback"
        description="Small vibrations when you tap, save, and delete."
        value={hapticsEnabled}
        onValueChange={setHapticsEnabled}
      />
    </ScrollView>
  );
};
