import '@/global.css';

import { AddEntrySheet } from '@/lib/components/entries/add-entry-sheet.component';
import { LockScreen } from '@/lib/components/pin/lock-screen.component';
import { PinOnboarding } from '@/lib/components/pin/pin-onboarding.component';
import { queryClient } from '@/lib/config';
import { DARK_THEME } from '@/lib/constants';
import { EntriesSheetProvider } from '@/lib/context/entries-sheet.context';
import { LockProvider } from '@/lib/context/lock.context';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
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
import { StatusBar } from 'expo-status-bar';
import { Modal, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = { anchor: '(tabs)' };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

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
      <QueryClientProvider client={queryClient}>
        {fontsLoaded ? (
          <SafeAreaProvider>
            <KeyboardProvider>
              <LockProvider>
                <EntriesSheetProvider>
                  <AppGate />
                  <AppStatusBar />
                </EntriesSheetProvider>
              </LockProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        ) : (
          <View style={{ flex: 1, backgroundColor: DARK_THEME.bg }} />
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
