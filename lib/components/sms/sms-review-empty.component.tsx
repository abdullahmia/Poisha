import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export type TSmsEmptyReason = 'unavailable' | 'disabled' | 'blocked' | 'denied' | 'clear';

type SmsReviewEmptyProps = { reason: TSmsEmptyReason; onRequestPermission: () => void };

/**
 * "Nothing here" has four genuinely different causes, and collapsing them into
 * one message is what makes a feature like this feel broken: a user whose
 * permission was auto-revoked would otherwise sit looking at "all caught up"
 * while transactions pile up unread.
 */
export const SmsReviewEmpty: React.FC<SmsReviewEmptyProps> = ({ reason, onRequestPermission }) => {
  const { colors } = useTheme();

  const content: Record<TSmsEmptyReason, { icon: keyof typeof Feather.glyphMap; title: string; body: string; action?: { label: string; onPress: () => void } }> = {
    unavailable: {
      icon: 'smartphone',
      title: 'Not available on this device',
      body: 'Reading messages needs an Android phone with SMS. Poisha can’t do this here.',
    },
    disabled: {
      icon: 'message-square',
      title: 'Automatic expenses are off',
      body: 'Turn this on and Poisha will read your bank and wallet messages to suggest entries.',
      action: { label: 'Open settings', onPress: () => router.push('/settings/sms') },
    },
    blocked: {
      icon: 'lock',
      title: 'Permission needed',
      body: 'Message access was turned off. Poisha can’t ask again from here — you’ll need to allow it in Android settings.',
      action: { label: 'Open Android settings', onPress: () => void Linking.openSettings() },
    },
    denied: {
      icon: 'lock',
      title: 'Permission needed',
      body: 'Poisha needs to read your messages to spot transactions. Nothing is uploaded — it all stays on this phone.',
      action: { label: 'Allow message access', onPress: onRequestPermission },
    },
    clear: {
      icon: 'check-circle',
      title: 'All caught up',
      body: 'Nothing waiting for review. New transactions will show up here as your bank messages arrive.',
    },
  };

  const { icon, title, body, action } = content[reason];

  return (
    <View className="items-center px-6 pt-16">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-alt">
        <Feather name={icon} size={22} color={colors.inkMuted} />
      </View>
      <Text
        className="mt-5 text-center text-ink"
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: -0.1 }}
      >
        {title}
      </Text>
      <Text
        className="mt-2 text-center text-ink-soft"
        style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
      >
        {body}
      </Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          className="mt-6 rounded-2xl bg-accent px-6 py-3 active:opacity-80"
        >
          <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
};
