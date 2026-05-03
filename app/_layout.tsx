import { AddEntrySheet } from '@/lib/components/add-entry-sheet.component';
import { LockScreen } from '@/lib/components/lock-screen.component';
import { PinOnboarding } from '@/lib/components/pin-onboarding.component';
import { darkTheme } from '@/lib/constants/theme';
import { EntriesProvider } from '@/lib/context/entries.context';
import { LockProvider } from '@/lib/context/lock.context';
import { ThemeProvider } from '@/lib/context/theme.context';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
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
import { Modal, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = { anchor: '(tabs)' };

function AppStatusBar() {
  const { scheme, colors } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.bg} />;
}

function AppGate() {
  const { isLocked, showOnboarding } = useLock();
  const url = Linking.useURL();

  useEffect(() => {
    if (url?.startsWith('tracker://home')) {
      router.replace('/(tabs)');
    }
  }, [url]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AddEntrySheet />
      {/* Modal renders in a separate native layer — never interacts with the
          navigation tree, so Expo Router's linking is set up exactly once. */}
      <Modal
        visible={isLocked || showOnboarding}
        transparent={false}
        animationType="none"
        onRequestClose={() => {}}
        statusBarTranslucent
      >
        {showOnboarding ? <PinOnboarding /> : <LockScreen />}
      </Modal>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {fontsLoaded ? (
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
      ) : (
        <View style={{ flex: 1, backgroundColor: darkTheme.bg }} />
      )}
    </GestureHandlerRootView>
  );
}
