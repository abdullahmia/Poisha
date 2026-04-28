import { ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { scheme, colors, toggleScheme } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: 110 + insets.bottom,
        paddingHorizontal: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingTop: 28, paddingBottom: 8 }}>
        <Text style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 30, color: colors.ink, letterSpacing: -0.5 }}>
          Settings
        </Text>
      </View>

      {/* Appearance section */}
      <View style={{ marginTop: 24 }}>
        <Text style={{
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
          color: colors.inkMuted,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Appearance
        </Text>

        <View style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          overflow: 'hidden',
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 16,
          }}>
            <View>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.ink }}>
                Theme
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: colors.inkSoft, marginTop: 2 }}>
                {scheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
            <Switch
              value={scheme === 'dark'}
              onValueChange={toggleScheme}
              trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
              thumbColor={colors.surface}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
