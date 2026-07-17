import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { BottomSheet } from './bottom-sheet.ui';
import { Button } from './button.ui';

export type TConfirmModalActionVariant = 'solid' | 'outline' | 'ghost' | 'danger';

export interface TConfirmModalAction {
  label: string;
  variant?: TConfirmModalActionVariant;
  onPress?: () => void;
}

export interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  destructive?: boolean;
  /** Defaults to a single "OK" dismiss button. More than 2 actions stack vertically. */
  actions?: TConfirmModalAction[];
}

const DEFAULT_ACTIONS: TConfirmModalAction[] = [{ label: 'OK', variant: 'solid' }];

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  onClose,
  title,
  message,
  icon,
  destructive = false,
  actions = DEFAULT_ACTIONS,
}) => {
  const { colors } = useTheme();
  const stacked = actions.length > 2;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {(close) => (
        <View className="p-6">
          {icon ? (
            <View
              className="mb-4 h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: destructive ? colors.dangerSoft : colors.accentSoft }}
            >
              <Feather name={icon} size={18} color={destructive ? colors.danger : colors.accent} />
            </View>
          ) : null}

          <Text className="mb-1.5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
            {title}
          </Text>
          <Text className="mb-6 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 }}>
            {message}
          </Text>

          <View className={stacked ? 'gap-2.5' : 'flex-row gap-3'}>
            {actions.map((action) => (
              <View key={action.label} className={stacked ? undefined : 'flex-1'}>
                <Button
                  label={action.label}
                  variant={action.variant ?? 'outline'}
                  onPress={() => {
                    action.onPress?.();
                    close();
                  }}
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </BottomSheet>
  );
};
