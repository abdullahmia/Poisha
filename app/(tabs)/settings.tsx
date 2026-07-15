import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppearanceSection } from '@/lib/components/settings/appearance-section.component';
import { BudgetSection } from '@/lib/components/settings/budget-section.component';
import { DataSection } from '@/lib/components/settings/data-section.component';
import { RegionSection } from '@/lib/components/settings/region-section.component';
import { SecuritySection } from '@/lib/components/settings/security-section.component';
import { SettingsHero } from '@/lib/components/settings/settings-hero.component';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <SettingsHero />
      <AppearanceSection />
      <RegionSection />
      <DataSection />
      <BudgetSection />
      <SecuritySection />
    </ScrollView>
  );
}
