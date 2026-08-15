import { Children, type ReactNode } from 'react';
import { Text, View } from 'react-native';

type SettingsGroupProps = {
  label: string;
  children: ReactNode;
};

export function SettingsGroup({ label, children }: SettingsGroupProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View className="pt-7">
      <Text
        className="pb-1 text-ink"
        style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}
      >
        {label}
      </Text>
      {rows.map((row, i) => (
        <View key={i}>
          {i > 0 && <View className="ml-7 h-px bg-line" />}
          {row}
        </View>
      ))}
    </View>
  );
}
