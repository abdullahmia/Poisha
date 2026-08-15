import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsGroup } from '@/lib/components/settings/shared/settings-group.component';
import { SettingsNavRow } from '@/lib/components/settings/shared/settings-nav-row.component';
import { useFadeIn } from '@/lib/hooks/use-fade-in.hook';
import { useLocale } from '@/lib/hooks/use-locale.hook';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const titleStyle = useFadeIn(0);
  const bodyStyle = useFadeIn(70);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 110 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={titleStyle}>
        <Text
          className="pb-1 pt-8 text-ink"
          style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 36, letterSpacing: -1 }}
        >
          Settings
        </Text>
      </Animated.View>

      <Animated.View style={bodyStyle}>
        <SettingsGroup label="General">
          <SettingsNavRow icon="sun" label="Appearance" onPress={() => router.push('/settings/appearance')} />
          <SettingsNavRow icon="bell" label="Notifications" onPress={() => router.push('/settings/notifications')} />
          <SettingsNavRow icon="grid" label="Features" onPress={() => router.push('/settings/features')} />
          <SettingsNavRow icon="target" label="Budget" onPress={() => router.push('/settings/budget')} />
          <SettingsNavRow icon="globe" label="Region" value={locale.symbol} onPress={() => router.push('/settings/region')} />
          <SettingsNavRow icon="shield" label="Security" onPress={() => router.push('/settings/security')} />
        </SettingsGroup>

        <SettingsGroup label="Data">
          <SettingsNavRow icon="database" label="Import & Export" onPress={() => router.push('/settings/data')} />
        </SettingsGroup>

        <SettingsGroup label="Support">
          <SettingsNavRow icon="info" label="About & Updates" onPress={() => router.push('/settings/about')} />
        </SettingsGroup>

        <View className="h-8" />
      </Animated.View>
    </ScrollView>
  );
}
