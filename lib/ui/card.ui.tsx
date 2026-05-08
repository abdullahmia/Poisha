import { type ReactNode, useMemo } from 'react';
import { type StyleProp, type ViewStyle, StyleSheet, View } from 'react-native';
import { type Palette } from '@/lib/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent';
  shadow?: boolean;
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    base: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.line,
    },
    accent: {
      backgroundColor: c.accentSoft,
    },
    shadow: {
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
  });
}

export function Card({ children, style, variant = 'default', shadow = false }: CardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.base,
        variant === 'accent' && styles.accent,
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}
