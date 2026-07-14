import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type React from 'react';
import type { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

const cardVariants = cva('rounded-[18px] border border-line', {
  variants: {
    variant: {
      default: 'bg-surface',
      accent: 'bg-accent-soft',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CardProps = VariantProps<typeof cardVariants> & {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
};

export const Card: React.FC<CardProps> = ({ children, className, style, variant = 'default', shadow = false }) => {
  const { colors } = useTheme();

  return (
    <View
      className={clsx(cardVariants({ variant }), className)}
      style={[
        shadow && {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
