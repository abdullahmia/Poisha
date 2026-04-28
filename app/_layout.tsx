import { AddEntrySheet } from '@/lib/components/add-entry-sheet.component';
import { LockScreen } from '@/lib/components/lock-screen.component';
import { PinOnboarding } from '@/lib/components/pin-onboarding.component';
import { darkTheme } from '@/lib/constants/theme';
import { EntriesProvider } from '@/lib/context/entries.context';
import { LockProvider } from '@/lib/context/lock.context';
import { ThemeProvider } from '@/lib/context/theme.context';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = { anchor: '(tabs)' };

function AppStatusBar() {
  const { scheme, colors } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />;
}

function AppGate() {
  const { isLocked, showOnboarding } = useLock();

  if (showOnboarding) return <PinOnboarding />;
  if (isLocked) return <LockScreen />;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AddEntrySheet />
    </>
  );
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
        <LockProvider>
          <EntriesProvider>
            <AppGate />
            <AppStatusBar />
          </EntriesProvider>
        </LockProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
