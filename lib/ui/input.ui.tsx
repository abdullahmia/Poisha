import { clsx } from 'clsx';
import type React from 'react';
import type { Control, FieldValues, Path, RegisterOptions } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type InputProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  rules?: RegisterOptions<T, Path<T>>;
  label?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'>;

export function Input<T extends FieldValues>({
  control,
  name,
  rules,
  label,
  className,
  ...rest
}: InputProps<T>): React.ReactElement {
  const { colors } = useTheme();

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View className="gap-1">
          {label && <Text className="text-xs font-medium text-ink-muted">{label}</Text>}
          <TextInput
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={colors.inkMuted}
            className={clsx('rounded-xl border border-line bg-surface-alt px-4 py-3 text-ink', className)}
            {...rest}
          />
          {error?.message && <Text className="text-xs text-danger">{error.message}</Text>}
        </View>
      )}
    />
  );
}
