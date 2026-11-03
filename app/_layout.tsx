import '@/global.css';
import '@/lib/config/google.config';

import { AppUpdatesGate } from '@/lib/components/common/app-updates-gate.component';
import { AutoBackupGate } from '@/lib/components/common/auto-backup-gate.component';
import { GlobalAlertModal } from '@/lib/components/common/global-alert-modal.component';
import { ThemeVars } from '@/lib/components/common/theme-vars.component';
import { AddEntrySheet } from '@/lib/components/entries/add-entry-sheet.component';
import { queryClient } from '@/lib/config';
import { DARK_THEME } from '@/lib/constants';
import { AlertProvider } from '@/lib/context/alert.context';
import { EntriesSheetProvider } from '@/lib/context/entries-sheet.context';
import { LockProvider } from '@/lib/context/lock.context';
import { ThemeTransitionProvider } from '@/lib/context/theme-transition.context';
import { useLock } from '@/lib/hooks/use-lock.hook';
import { usePlanNotifications } from '@/lib/hooks/use-plan-notifications.hook';
import { useTodoNotifications } from '@/lib/hooks/use-todo-notifications.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
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
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
// eslint's import/namespace rule can't follow the `export *` chain that
// expo-notifications 58 re-exports its enums through, so this one comes in by name.
import { AndroidImportance } from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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
    importance: AndroidImportance.HIGH,
  });
}

function AppStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function AppGate() {
  const { isLocked, showOnboarding } = useLock();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const url = Linking.useURL();

  usePlanNotifications();
  useTodoNotifications();

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
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={showOnboarding}>
          <Stack.Screen name="onboarding" options={screenOptions} />
        </Stack.Protected>
        <Stack.Protected guard={!showOnboarding && isLocked}>
          <Stack.Screen name="lock" options={screenOptions} />
        </Stack.Protected>
      </Stack>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.bg,
        }}
      />
      <AddEntrySheet />
      <GlobalAlertModal />
      {!showOnboarding && !isLocked && <AppUpdatesGate />}
      {!showOnboarding && !isLocked && <AutoBackupGate />}
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
                      {/* Must sit inside the providers it reads from, and must
                          wrap everything that renders a className colour. */}
                      <ThemeVars>
                        <AppGate />
                        <AppStatusBar />
                      </ThemeVars>
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
