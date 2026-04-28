import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AddEntrySheet } from '@/lib/components/add-entry-sheet.component';
import { darkTheme } from '@/lib/constants/theme';
import { EntriesProvider } from '@/lib/context/entries.context';
import { ThemeProvider } from '@/lib/context/theme.context';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export const unstable_settings = { anchor: '(tabs)' };

function AppStatusBar() {
  const { scheme, colors } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: darkTheme.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <EntriesProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <AddEntrySheet />
          <AppStatusBar />
        </EntriesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
