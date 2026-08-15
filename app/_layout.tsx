import '@/global.css';

import { AppUpdatesGate } from '@/lib/components/common/app-updates-gate.component';
import { GlobalAlertModal } from '@/lib/components/common/global-alert-modal.component';
import { AddEntrySheet } from '@/lib/components/entries/add-entry-sheet.component';
import { queryClient } from '@/lib/config';
import { DARK_THEME } from '@/lib/constants';
import { AlertProvider } from '@/lib/context/alert.context';
import { EntriesSheetProvider } from '@/lib/context/entries-sheet.context';
import { LockProvider } from '@/lib/context/lock.context';
import { ThemeTransitionProvider } from '@/lib/context/theme-transition.context';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePlanNotifications } from '@/lib/hooks/use-plan-notifications.hook';
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
import { Platform, View } from 'react-native';
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
  const { colors } = useTheme();
  const url = Linking.useURL();

  usePlanNotifications();

  useEffect(() => {
    if (url?.startsWith('tracker://home')) {
      router.replace('/(tabs)');
    }
  }, [url]);

  const screenOptions = { headerShown: false, gestureEnabled: false, animation: 'none' as const };

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!showOnboarding && !isLocked}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="category-management" />
          <Stack.Screen name="settings-appearance" />
          <Stack.Screen name="settings-notifications" />
          <Stack.Screen name="settings-features" />
          <Stack.Screen name="settings-budget" />
          <Stack.Screen name="settings-region" />
          <Stack.Screen name="settings-security" />
          <Stack.Screen name="settings-data" />
          <Stack.Screen name="settings-about" />
        </Stack.Protected>
        <Stack.Protected guard={showOnboarding}>
          <Stack.Screen name="onboarding" options={screenOptions} />
        </Stack.Protected>
        <Stack.Protected guard={!showOnboarding && isLocked}>
          <Stack.Screen name="lock" options={screenOptions} />
        </Stack.Protected>
      </Stack>
      <AddEntrySheet />
      <GlobalAlertModal />
      {!showOnboarding && !isLocked && <AppUpdatesGate />}
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
              <ThemeTransitionProvider>
                <LockProvider>
                  <AlertProvider>
                    <EntriesSheetProvider>
                      <AppGate />
                      <AppStatusBar />
                    </EntriesSheetProvider>
                  </AlertProvider>
                </LockProvider>
              </ThemeTransitionProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        ) : (
          <View style={{ flex: 1, backgroundColor: DARK_THEME.bg }} />
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
