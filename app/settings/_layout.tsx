import { useTheme } from '@/lib/hooks/use-theme.hook';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
