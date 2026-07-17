import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, type PressableProps, Text } from 'react-native';

const buttonVariants = cva('flex-row items-center justify-center rounded-2xl', {
  variants: {
    variant: {
      solid: 'bg-accent',
      outline: 'border border-line bg-transparent',
      ghost: 'bg-transparent',
      danger: 'bg-danger',
    },
    size: {
      md: 'px-5 py-3',
      sm: 'px-4 py-2',
    },
    disabled: {
      true: 'opacity-40',
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});

const labelVariants = cva('text-center font-medium', {
  variants: {
    variant: {
      solid: 'text-white',
      outline: 'text-ink',
      ghost: 'text-ink',
      danger: 'text-white',
    },
    size: {
      md: 'text-base',
      sm: 'text-sm',
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});

type ButtonProps = VariantProps<typeof buttonVariants> & {
  label: string;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'solid',
  size = 'md',
  disabled = false,
}) => (
  <Pressable
    onPress={disabled ? undefined : onPress}
    disabled={disabled}
    className={clsx(buttonVariants({ variant, size, disabled }))}
  >
    <Text className={clsx(labelVariants({ variant, size }))}>{label}</Text>
  </Pressable>
);
